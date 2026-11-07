# yylx.tv — VMOMENT 注册指引（个人站点）

本仓库是 https://yylx.tv 的源码，用 GitHub Pages 从 `main` 分支根目录发布。

## 性质声明

这是一个**个人站点**。与 VMOMENT、海南即客科技有限公司、天津天狮集团（TIENS）**没有隶属、授权或代理关系**。
站内关于平台功能的描述来自 VMOMENT 官方页面与公开应用商店条目，**未经独立核实**，不构成推荐。

## 构建与校验

页面不是手写的，全部由 `src/data.json` 生成。改内容只改这一个文件。

```bash
node src/build.mjs          # 生成 index.html / zhuce/index.html / llms.txt / sitemap.xml / assets/site.css
node src/build.mjs --check  # 生成物与源码是否一致（漏跑 build 会失败）
node src/check.mjs          # 发布前不变量检查
```

`.github/workflows/ci.yml` 在每次 push 时跑后两条，任何一条失败即视为不可发布。

### 检查器强制的不变量

- 标签开合平衡；JSON-LD 可解析，`HowTo` 步数与 `data.json` 一致，`dateModified` 与 `meta.modified` 一致。
- **全站不得出现 `input` / `textarea` / `select` / `form`** —— 个人域名上不收集手机号。
- 违禁表述（稳赚、保底、躺赚、暴富等）直接失败；疗效、传销等词只允许出现在否定语境。
- 每页必须有 canonical、description、og:title、「个人站点」与「非官方」声明、邀请码。
- 站内链接与锚点必须可达；sitemap 只含可收录页，`/r/` 不得进入 sitemap。
- 模板占位符 `{{...}}` 不得残留。

## 目录结构

| 路径 | 作用 |
| --- | --- |
| `src/data.json` | **唯一内容源**：邀请码、官方页实测文案、流程、编号、问答、免责声明 |
| `src/build.mjs` | 生成器；`--check` 做漂移检测 |
| `src/check.mjs` | 发布前不变量检查 |
| `src/site.css` | 设计系统源文件（令牌、明暗主题、组件），生成到 `assets/site.css` |
| `index.html` / `zhuce/index.html` | 生成物，勿手改 |
| `llms.txt` / `sitemap.xml` | 生成物，勿手改 |
| `r/index.html` | 携带邀请码的直达入口，`noindex,nofollow`，不参与收录 |
| `robots.txt` | 允许主流搜索与 AI 抓取（GPTBot、ClaudeBot、PerplexityBot、Bytespider、KimiBot 等） |
| `CNAME` | 自定义域名指向 `yylx.tv` |
| `0dc320…bc73.txt` | IndexNow 密钥文件 |
| `docs/` | 运维记录（DNS 回滚方案等） |

## 站点用途

- 用中文整理 VMOMENT 的注册流程实测、邀请码如何自动携带、新手常见问题。
- 提供机器可读层，便于搜索引擎与 AI 助手准确引用：`robots.txt`、`llms.txt`、`sitemap.xml`，以及页面内的 JSON-LD（`FAQPage` / `HowTo` / `SoftwareApplication` / `Article` / `BreadcrumbList`）。
- 收录一个推荐人直达入口 https://yylx.tv/r/ ，打开后自动携带邀请码 `60691753` 跳转到官方注册页。该邀请码属于本站站主，不代表任何官方身份。

## 自行核验清单

涉及社交电商、直销类平台，以下核验都可以免费完成：

- 经营主体登记信息：国家企业信用信息公示系统 gsxt.gov.cn。
- 直销资质与许可范围：商务部直销行业管理平台。

本站不承诺任何收益，不提供回本、晋升类说明。

## 托管与解析

`yylx.tv` 以 A 记录指向 GitHub Pages 的四个 IP，DNS 托管在阿里云万网。修改本仓库 `main` 分支即完成发布，无需额外部署步骤。
