/**
 * 发布文件守护器（2026-11-09）
 *
 * 本仓库根目录下的发布文件是「发布真相」：24 条 FAQ、9 条 sitemap、五份机器可读内容、
 * 11-09 安全头。src/build.mjs 是早期骨架，运行会把它们降级，已加显式拦截。
 *
 *   node src/publish.mjs --check   发布文件是否与基线逐字节一致（CI 用；默认命令）
 *   node src/publish.mjs --lock    改动发布文件后，重新记录基线
 *   node src/publish.mjs --sync    只重算 CSP 哈希 + 同步 dateModified/lastmod，然后自动 lock
 *
 * --sync 不重建页面、不覆盖文案。改文案请用发布脚本或直接编辑发布文件，再跑 --lock。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SRC, '..');
const BASELINE = join(SRC, 'published.json');

const LOCK_FILES = [
  'index.html', 'zhuce/index.html', 'en/index.html', 'r/index.html', '404.html',
  'llms.txt', 'sitemap.xml', 'robots.txt',
  'content.md', 'content.txt', 'content.json', 'content.yaml', 'content-en.md',
  'assets/site.css', 'assets/og.png', 'CNAME'
];
const HTML_PAGES = ['index.html', 'zhuce/index.html', 'en/index.html', 'r/index.html', '404.html'];

// 统一按 LF 计算：仓库 .gitattributes 是 eol=lf，CI 在 Linux 检出的也是 LF。
// 若按工作区原始字节（可能 CRLF）算，本地与 CI 的基线会不一致，CI 必然误报。
const read = (p) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const write = (p, t) => writeFileSync(join(ROOT, p), t.replace(/\r\n/g, '\n'), 'utf8');
const sha = (p) => {
  const b = readFileSync(join(ROOT, p));
  if (/\.(png|jpe?g|gif|ico)$/i.test(p)) return createHash('sha256').update(b).digest('hex');
  return createHash('sha256').update(b.toString('utf8').replace(/\r\n/g, '\n'), 'utf8').digest('hex');
};

function collect() {
  const out = {};
  for (const p of LOCK_FILES) {
    if (!existsSync(join(ROOT, p))) {
      console.error(`FAIL ${p}: 发布文件缺失（很可能误跑了早期构建器）`);
      process.exitCode = 1;
      continue;
    }
    out[p] = sha(p);
  }
  return out;
}

function lock() {
  const files = collect();
  if (process.exitCode) return;
  writeFileSync(BASELINE, JSON.stringify({ note: '发布文件基线；改动后跑 node src/publish.mjs --lock', files }, null, 2) + '\n', 'utf8');
  console.log(`publish: 已锁定 ${Object.keys(files).length} 个发布文件`);
}

function check() {
  if (!existsSync(BASELINE)) {
    console.error('FAIL 无基线文件，先跑 node src/publish.mjs --lock');
    process.exit(1);
  }
  const base = JSON.parse(readFileSync(BASELINE, 'utf8')).files;
  const cur = collect();
  const errs = [];
  const all = new Set([...Object.keys(base), ...Object.keys(cur)]);
  for (const p of all) {
    if (!(p in cur)) errs.push(`${p}: 发布文件缺失（是否误跑早期构建器？）`);
    else if (!(p in base)) errs.push(`${p}: 新增发布文件，确认后跑 --lock`);
    else if (base[p] !== cur[p]) errs.push(`${p}: 内容已改动，确认后跑 --lock 更新基线`);
  }
  if (errs.length || process.exitCode) {
    errs.forEach((e) => console.error('FAIL ' + e));
    console.error(`\npublish --check FAILED（${errs.length} 项）`);
    process.exit(1);
  }
  console.log(`publish --check PASSED（${Object.keys(cur).length} 个发布文件与基线一致）`);
}

function sync() {
  const d = JSON.parse(read('src/data.json'));
  const modified = d.meta.modified;
  for (const p of HTML_PAGES) {
    let t = read(p);
    const blocks = [...t.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((x) => x[1]);
    const hashes = blocks.map((b) => createHash('sha256').update(b, 'utf8').digest('base64'));
    t = t.replace(/(<meta\s+http-equiv="Content-Security-Policy"\s+content=")([^"]+)(")/i,
      (all, a, policy, c) => {
        if (!/script-src/.test(policy)) return all;
        const repl = blocks.length
          ? "script-src 'self' " + hashes.map((h) => `'sha256-${h}'`).join(' ')
          : "script-src 'none'";
        return a + policy.replace(/script-src[^;]*/, repl) + c;
      });
    t = t.replace(/("dateModified"\s*:\s*")[^"]+(")/g, `$1${modified}$2`);
    write(p, t);
  }
  write('sitemap.xml', read('sitemap.xml').replace(/<lastmod>[^<]+<\/lastmod>/g, `<lastmod>${modified}</lastmod>`));
  console.log(`publish: CSP 哈希与日期已同步到 ${modified}`);
  lock();
}

const cmd = process.argv[2] || '--check';
if (cmd === '--lock') lock();
else if (cmd === '--sync') sync();
else if (cmd === '--check') check();
else {
  console.error('用法: node src/publish.mjs [--check | --lock | --sync]');
  process.exit(2);
}
