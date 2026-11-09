# 构建链状态说明（2026-11-09 14:0x 更新）

## 当前事实

根目录的 16 个发布文件是**发布真相**：24 条 FAQ、9 条 sitemap URL、五份机器可读内容、
11-09 安全头（referrer / favicon / 分享图 / CSP）。GitHub Pages 直接对外提供这些文件。

`src/build.mjs` 是早期骨架，只能生成 3 页 / 3 条 sitemap，**运行会降级线上内容**。
现已加显式拦截：不带 `--force-legacy` 直接退出码 1。`package.json` 里会降级的
`npm run build` 已删除。

`src/data.json` 仍是邀请码、流程、声明等文案的单一数据源，但**不是**页面的完整模板来源。
改文案要同步到全部载体（HTML / llms.txt / 五份 content.*），再跑 `--lock`。

## 发布守护器

`src/publish.mjs` + `src/published.json`（16 个发布文件的 SHA-256 基线）：

- `--check`：比对基线；改动发布文件却没重新 lock 会 FAILED（CI 跑这条，也是默认命令）
- `--lock`：重新记录基线
- `--sync`：只重算 CSP 哈希 + 同步 `dateModified` / `lastmod`，随后自动 lock；**不重建页面**
- 文本哈希统一按 LF 计算（仓库 `.gitattributes` 是 `eol=lf`）。模拟 Windows CRLF 检出
  实测仍 PASSED，避免工作区与 Linux CI 基线不一致导致误报。

`README.md` 已按真实状态重写（原文写「页面全部由 data.json 生成、勿手改」，与事实不符）。
`.github/workflows/ci.yml` 现在只跑 `publish.mjs --check` + `check.mjs`。

**注意**：`.github/` 此前从未提交，提交它需要 GitHub PAT 具备 `workflow` scope，
否则 push 会被 GitHub 拒绝（与代码内容无关，是凭据权限）。

## 护栏（src/check.mjs）

- 第 10 节：发布文件禁止平台归属类字眼（中文与英文变体，正则用 Unicode 转义构造）
- 第 11 节：sitemap ≥ 9、llms.txt 问答 ≥ 24、五份多格式内容不得被清空
- 第 12 节：中英 FAQ 条数一致、llms 与首页一致、`FAQPage` 与可见问答一致、
  JSON-LD 无悬空空节点、每页 hreflang、CSP 哈希与实际 inline 脚本一致、
  `404.html` 存在且带声明、五份多格式内容带声明

## 尚未恢复

「一次 build 出全部」**仍未恢复**：要把 24 条 FAQ、9 条 sitemap、五份 content.*、
en 页与 r 页的全量模板并回生成器，需把 `data.json` 扩展成完整内容模型，属于另一轮工程。
当前用「发布文件为准 + 基线锁」把误降级风险堵死，成本更低也更稳。

## 本轮修复（14:0x）

- 英文页 FAQ 23 → 24，与中文逐条 id 对齐，`FAQPage` 同步；zhuce 补 hreflang、删悬空 JSON-LD 节点
- `/r/` 补 viewport / description / referrer / CSP；新增 `404.html`
- 清掉上一轮机械替换残留：「个人站点 · 个人站点」「个人站点通用注册页」、
  llms.txt 页面性质整句、英文页 answer-note 重复措辞、content-en.md 重复词
- 英文页复制按钮原本复制整段中文，已换成英文答案
- 验证：`npm run verify` 全绿、全站禁词 0、`publish --check PASSED`

记录时间：2026-11-09（北京时间）。本轮改动**未 push**，本地与远程 HEAD 均为 `d03a0bd`。
