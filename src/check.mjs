import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SRC, '..');
const d = JSON.parse(readFileSync(join(SRC, 'data.json'), 'utf8'));
const CODE = d.meta.code;

const files = ['index.html', join('zhuce', 'index.html'), join('en', 'index.html')];
const text = ['llms.txt', 'sitemap.xml', join('assets', 'site.css'), join('r', 'index.html')];
const errs = [];
const warn = [];
const fail = (f, m) => errs.push(`${f}: ${m}`);

const read = (p) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

/* 1 — tag balance */
const VOID = new Set(['meta', 'link', 'br', 'hr', 'img', 'input']);
for (const f of files) {
  const html = read(f);
  for (const tag of ['div', 'section', 'main', 'aside', 'header', 'footer', 'nav', 'p', 'a', 'span', 'b', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'ul', 'ol', 'li', 'details', 'summary', 'figure', 'button', 'h1', 'h2', 'h3']) {
    if (VOID.has(tag)) continue;
    const open = (html.match(new RegExp(`<${tag}(?=[\\s>])`, 'g')) || []).length;
    const close = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    if (open !== close) fail(f, `<${tag}> 开合不平衡 ${open}/${close}`);
  }
}

/* 2 — JSON-LD */
for (const f of files) {
  const html = read(f);
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!m) { fail(f, '缺少 JSON-LD'); continue; }
  let ld;
  try { ld = JSON.parse(m[1]); } catch (e) { fail(f, `JSON-LD 解析失败 ${e.message}`); continue; }
  const graph = ld['@graph'] || [ld];
  const types = graph.map((n) => n['@type']).filter(Boolean);
  if (!types.length) fail(f, 'JSON-LD 无节点');
  const faq = graph.find((n) => n['@type'] === 'FAQPage');
  if (faq) {
    const visible = [...html.matchAll(/<summary>([^<]+)<\/summary>/g)].map((x) => x[1]);
    const marked = faq.mainEntity.map((q) => q.name);
    for (const v of visible) if (!marked.includes(v)) warn.push(`${f}: 可见问答「${v}」未进 FAQPage`);
  }
  const howto = graph.find((n) => n['@type'] === 'HowTo');
  if (howto && howto.step.length !== d.steps.length) fail(f, `HowTo 步数 ${howto.step.length} 与 data.json 的 ${d.steps.length} 不一致`);
  for (const n of graph) if (n.dateModified && n.dateModified !== d.meta.modified) fail(f, `${n['@type']} dateModified 与 meta.modified 不一致`);
}

/* 3 — no data collection */
for (const f of [...files, join('r', 'index.html')]) {
  const html = read(f);
  const hits = [...html.matchAll(/<(input|textarea|select|form)\b/gi)].map((x) => x[1].toLowerCase());
  if (hits.length) fail(f, `出现会收集输入的标签：${[...new Set(hits)].join(', ')}（个人域名上不得收集手机号）`);
}

/* 4 — banned affirmative claims */
const STRICT = /稳赚|保底|包赚|躺赚|暴富|回本周期|晋升速度/;
const CONTEXT = /治疗|疗效|根治|传销|拉人头|层级计酬/g;
for (const f of [...files, 'llms.txt']) {
  const body = read(f);
  const hit = body.match(STRICT);
  if (hit) fail(f, `出现违禁表述「${hit[0]}」`);
  for (const m of body.matchAll(CONTEXT)) {
    const ctx = body.slice(Math.max(0, m.index - 40), m.index + 40);
    if (!/[不未否无]/.test(ctx)) fail(f, `「${m[0]}」出现在非否定语境：…${ctx.replace(/\s+/g, ' ')}…`);
  }
  for (const m of body.matchAll(/收益/g)) {
    const sentence = body.slice(Math.max(0, m.index - 40), m.index + 40);
    if (!/[不未否]/.test(sentence)) fail(f, `「收益」出现在非否定语境：…${sentence.replace(/\s+/g, ' ')}…`);
  }
}

/* 5 — per-page required elements */
for (const f of files) {
  const html = read(f);
  for (const need of ['<link rel="canonical"', 'name="description"', 'property="og:title"', 'viewport']) {
    if (!html.includes(need)) fail(f, `缺少 ${need}`);
  }
  if (!/lang="(zh-CN|en)"/.test(html)) fail(f, '缺少 lang 声明（zh-CN 或 en）');
  if (!/个人站点|personal site/i.test(html)) fail(f, '缺少「个人站点 / personal site」性质声明');
  if (!/无隶属|no affiliation|not affiliated/i.test(html)) fail(f, '缺少「无隶属 / no affiliation」声明');
  if (!html.includes(CODE)) fail(f, `页面未包含邀请码 ${CODE}`);
}

/* 6 — links resolve */
const known = new Set(['/', '/zhuce/', '/en/', '/llms.txt', '/robots.txt', '/sitemap.xml', '/assets/site.css', '/r/', '/index.html']);
for (const f of files) {
  const html = read(f);
  for (const m of html.matchAll(/href="(\/[^"#]*?)(?:#[^"]*)?"/g)) {
    const raw = m[1];
    const p = /\.[a-z0-9]+$/i.test(raw) ? raw : (raw === '/' ? '/' : raw.replace(/\/$/, '') + '/');
    if (!known.has(p)) fail(f, `站内链接不可达 ${raw}`);
  }
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((x) => x[1]));
  for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!ids.has(m[1])) fail(f, `锚点缺失 #${m[1]}`);
}

/* 7 — outbound sign-up link integrity */
for (const f of files) {
  const html = read(f);
  if (!html.includes(`invitationCode=${CODE}`)) fail(f, `注册链接缺少 invitationCode=${CODE}`);
  const bad = [...html.matchAll(/href="(https:\/\/[^"]*)"/g)].map((x) => x[1]).filter((u) => u.startsWith('http://'));
  if (bad.length) fail(f, `外链使用 http：${bad.join(', ')}`);
}

/* 8 — sitemap vs robots consistency */
const sm = read('sitemap.xml');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]);
for (const l of locs) {
  const rel = l.replace(d.meta.origin, '').replace(/^\//, '').replace(/\/$/, '');
  const p = rel === '' ? 'index.html' : (/\.[a-z0-9]+$/i.test(rel) ? rel : join(rel, 'index.html'));
  if (!existsSync(join(ROOT, p))) fail('sitemap.xml', `指向的页面不存在 ${l}`);
}
if (locs.some((l) => l.includes('/r/'))) fail('sitemap.xml', '入口页 /r/ 不应出现在 sitemap');
for (const l of locs) if (!l.startsWith('https://')) fail('sitemap.xml', `sitemap 地址非 https：${l}`);
const rpage = read(join('r', 'index.html'));
if (!/noindex/.test(rpage)) fail(join('r', 'index.html'), '入口页缺少 noindex');

/* 9 — single source integrity */
for (const f of [...files, 'llms.txt']) {
  const body = read(f);
  const stale = body.match(/\{\{\w+\}\}/);
  if (stale) fail(f, `模板占位符未替换：${stale[0]}`);
}
if (!read('llms.txt').includes(CODE)) fail('llms.txt', `缺少邀请码 ${CODE}`);
if (!read('llms.txt').includes(d.meta.entry)) fail('llms.txt', '缺少直达入口地址');


/* 10 — 发布文件里禁止出现已弃用的平台归属类字眼（用转义构造，源码自身不含该词） */
const BANNED = new RegExp('\u5b98\u65b9|\u5b98\u7f51|off' + 'icial', 'i');
for (const f of [...files, 'llms.txt', 'content.md', 'content.txt', 'content.json', 'content.yaml', 'content-en.md', 'sitemap.xml', join('r', 'index.html')]) {
  const m = read(f).match(BANNED);
  if (m) fail(f, `出现已禁用的字眼：${m[0]}`);
}


/* 11 — 资产完整性：防止早期构建器把全量发布版降级 */
const smCount = (read('sitemap.xml').match(/<loc>/g) || []).length;
if (smCount < 9) fail('sitemap.xml', `URL 条数 ${smCount}，低于既有 9 条`);
const faqCount = (read('llms.txt').match(/^### /gm) || []).length;
if (faqCount < 24) fail('llms.txt', `问答条数 ${faqCount}，低于既有 24 条`);
for (const f of ['content.md', 'content.txt', 'content.json', 'content.yaml', 'content-en.md']) {
  if (read(f).length < 1000) fail(f, '多格式内容疑似被降级');
}

/* 12 — 内容同步 / CSP / 结构化数据 / 404（2026-11-09 迭代护栏） */
const visibleFaq = (f) => (read(f).match(/<details id="q-\d+">/g) || []).length;
const zhN = visibleFaq('index.html');
const enN = visibleFaq(join('en', 'index.html'));
if (zhN !== enN) fail(join('en', 'index.html'), `FAQ 条数 ${enN} 与首页 ${zhN} 不一致`);
const llTitles = [...read('llms.txt').matchAll(/^### (.+)$/gm)].map((x) => x[1].trim());
if (llTitles.length !== zhN) fail('llms.txt', `问答 ${llTitles.length} 条与首页 FAQ ${zhN} 条不一致`);
const zhTitles = [...read('index.html').matchAll(/<summary>([^<]+)<\/summary>/g)].map((x) => x[1].trim());
for (const t of zhTitles) if (!llTitles.includes(t)) warn.push(`llms.txt: 首页问题「${t}」未出现在 llms.txt`);

for (const f of files) {
  const html = read(f);
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!m) continue;
  const graph = JSON.parse(m[1])['@graph'] || [];
  for (const n of graph) {
    if (Object.keys(n).length === 1 && n['@id']) fail(f, `JSON-LD 存在悬空空节点 ${n['@id']}`);
  }
  const faq = graph.find((n) => n['@type'] === 'FAQPage');
  if (faq) {
    const vis = [...html.matchAll(/<details id="q-\d+"><summary>([^<]+)<\/summary>/g)].length;
    if (faq.mainEntity.length !== vis) fail(f, `FAQPage ${faq.mainEntity.length} 条与可见 ${vis} 条不一致`);
  }
  if (!/hreflang=/.test(html)) fail(f, '缺少 hreflang（中英互指）');
}

for (const f of [...files, join('r', 'index.html')]) {
  const html = read(f);
  const m = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i);
  if (!m) { fail(f, '缺少 CSP'); continue; }
  const declared = [...m[1].matchAll(/'sha256-([^']+)'/g)].map((x) => x[1]).sort();
  const blocks = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((x) => x[1]);
  const actual = blocks.map((b) => createHash('sha256').update(b, 'utf8').digest('base64')).sort();
  if (declared.join() !== actual.join()) {
    fail(f, `CSP 哈希与实际脚本不一致（声明 ${declared.length} / 实际 ${actual.length}）；改完 HTML 请跑 node src/publish.mjs --sync`);
  }
}

if (!existsSync(join(ROOT, '404.html'))) fail('404.html', '缺少自定义 404 页');
else {
  const p = read('404.html');
  if (!/无隶属/.test(p) || !p.includes(CODE)) fail('404.html', '缺少个人站点声明或邀请码');
}
for (const f of ['content.md', 'content.txt', 'content.json', 'content.yaml', 'content-en.md']) {
  if (!/无隶属|not affiliated|not authorized/i.test(read(f))) fail(f, '缺少个人站点/无隶属声明');
}

export const report = { errs, warn, summary: errs.length ? `FAILED（${errs.length} 项）` : `PASSED（${files.length + 3} 个文件，${warn.length} 条提醒）` };

const isCli = typeof process !== 'undefined' && ((process.argv && process.argv[1]) || '').includes('check.mjs');
if (isCli) {
  errs.forEach((e) => console.log(`FAIL ${e}`));
  warn.forEach((w) => console.log(`WARN ${w}`));
  console.log(errs.length ? `\ncheck ${report.summary}` : `\ncheck ${report.summary}`);
  process.exit(errs.length ? 1 : 0);
}
