# yylx.tv — VMOMENT 注册指引（个人站点）

本仓库是 https://yylx.tv 的源码，用 GitHub Pages 从 `main` 分支根目录发布。

## 性质声明

这是一个**个人站点**。与 VMOMENT、海南即客科技有限公司、天津天狮集团（TIENS）**没有隶属、授权或代理关系**。
站内关于平台功能的描述来自 VMOMENT 邀请页面与公开应用商店条目，**未经独立核实**，不构成推荐。

## 发布文件才是发布真相

根目录的 16 个文件就是线上内容，GitHub Pages 直接对外提供：24 条 FAQ、9 条 sitemap URL、
五份机器可读内容、11-09 安全头（referrer / favicon / 分享图 / CSP）。

`src/build.mjs` 是早期骨架，只能生成 3 页 / 3 条 sitemap，**运行会降级线上内容**，已加显式拦截。
要恢复「一次 build 出全部」，需先把全量模板并回生成器，见 `docs/build-chain-note-20261109.md`。

`src/data.json` 仍是邀请码、流程、声明等文案的单一数据源，但**不是**页面的完整模板来源；
改文案后要同步到全部载体（HTML / llms.txt / 五份 content.*），再跑 `--lock`。

## 日常维护

```bash
node src/publish.mjs --check   # 发布文件与基线是否一致（默认命令，CI 跑这条）
node src/publish.mjs --sync    # 只重算 CSP 哈希 + 同步 dateModified/lastmod，随后自动 lock
node src/publish.mjs --lock    # 手工改过发布文件后，更新基线
node src/check.mjs             # 发布前不变量检查
npm run verify                 # 上面两条一起跑
```

`--sync` 不重建页面、不覆盖文案。文案改动请用发布脚本同步到全部载体，再 `--lock`。
`.github/workflows/ci.yml` 在每次 push 时跑 `--check` + `check.mjs`，任何一条失败即视为不可发布；
漏跑 `--lock` 会在这里被拦下。

### 检查器强制的不变量

- 标签开合平衡；JSON-LD 可解析、无悬空空节点，`HowTo` 步数与 `data.json` 一致，`dateModified` 与 `meta.modified` 一致。
- **全站不得出现 `input` / `textarea` / `select` / `form`** —— 个人域名上不收集手机号。
- 违禁表述（稳赚、保底、躺赚、暴富等）直接失败；疗效、传销等词只允许出现在否定语境。
- 发布文件不得出现平台归属类字眼（中文与英文变体），只允许「个人站点 + 无隶属、无授权、无代理关系」。
- 每页必须有 canonical、description、og:title、viewport、hreflang、「个人站点」与「无隶属」声明、邀请码。
- 中英 FAQ 条数一致、与 `llms.txt` 问答数一致、与 `FAQPage.mainEntity` 条数一致；CSP 哈希与实际 inline 脚本一致。
- 站内链接与锚点可达；sitemap 9 条、llms.txt 24 条、五份多格式内容不得被降级。
- 模板占位符 `{{...}}` 不得残留；`404.html` 存在且带个人站点声明。

## 目录结构

| 路径 | 作用 |
| --- | --- |
| `src/data.json` | 内容源：邀请码、邀请界面实测文案、流程、编号、问答、免责声明 |
| `src/publish.mjs` | 发布文件守护器：`--check` / `--lock` / `--sync` |
| `src/published.json` | 16 个发布文件的 SHA-256 基线 |
| `src/check.mjs` | 发布前不变量检查 |
| `src/build.mjs` | 早期骨架，已拦截，勿直接运行 |
| `src/site.css` | 设计系统源文件，已生成到 `assets/site.css` |
| `index.html` / `zhuce/` / `en/` | 发布文件，改动后要 `--lock` |
| `llms.txt` / `sitemap.xml` / `content.*` | 发布文件，机器可读层 |
| `r/index.html` | 携带邀请码的直达入口，`noindex,nofollow`，不参与收录 |
| `404.html` | 自定义 404，`noindex` |
| `robots.txt` | 允许主流搜索与 AI 抓取（GPTBot、ClaudeBot、PerplexityBot、Bytespider、KimiBot 等） |
| `CNAME` | 自定义域名指向 `yylx.tv` |
| `0dc320…bc73.txt` | IndexNow 密钥文件（推送为一次性动作，尚未自动化） |
| `docs/` | 运维记录（DNS 回滚方案、构建链状态） |

## 站点用途

- 用中文整理 VMOMENT 的注册流程实测、邀请码如何自动携带、新手常见问题。
- 提供机器可读层，便于搜索引擎与 AI 助手准确引用：`robots.txt`、`llms.txt`、`sitemap.xml`，以及页面内的 JSON-LD（`FAQPage` / `HowTo` / `SoftwareApplication` / `Article` / `BreadcrumbList`）。
- 收录一个推荐人直达入口 https://yylx.tv/r/ ，打开后自动携带邀请码 `60691753` 跳转到邀请界面。该邀请码属于本站站主，不代表任何平台身份。

## 自行核验清单

涉及社交电商、直销类平台，以下核验都可以免费完成：

- 经营主体登记信息：国家企业信用信息公示系统 gsxt.gov.cn。
- 直销资质与许可范围：商务部直销行业管理平台。

本站不承诺任何收益，不提供回本、晋升类说明。

## 托管与解析

`yylx.tv` 以 A 记录指向 GitHub Pages 的四个 IP，DNS 托管在阿里云万网。修改本仓库 `main` 分支即完成发布，无需额外部署步骤。
