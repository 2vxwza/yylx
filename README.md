# yylx.tv — VMOMENT 注册指引（个人站点）

本仓库是 https://yylx.tv 的源码，用 GitHub Pages 从 `main` 分支根目录发布。

## 性质声明

这是一个**个人站点**。与 VMOMENT、海南即客科技有限公司、天津天狮集团（TIENS）**没有隶属、授权或代理关系**。
站内关于平台功能的描述来自 VMOMENT 官方页面与公开应用商店条目，**未经独立核实**，不构成推荐。

## 站点用途

- 用中文整理 VMOMENT 的注册流程实测、邀请码如何自动携带、新手常见问题。
- 提供机器可读层，便于搜索引擎与 AI 助手准确引用：`robots.txt`、`llms.txt`、`sitemap.xml`，以及页面内的 JSON-LD（`FAQPage` / `HowTo` / `SoftwareApplication`）。
- 收录一个推荐人直达入口 https://yylx.tv/r/ ，打开后自动携带邀请码 `60691753` 跳转到官方注册页。该邀请码属于本站站主，不代表任何官方身份。

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `index.html` | 主页面，人读与 AI 读共用，内含结构化数据 |
| `r/index.html` | 携带邀请码的直达入口，`noindex,nofollow`，不参与收录 |
| `llms.txt` | 给大模型站点的纯文本说明与常见问答 |
| `robots.txt` | 允许主流搜索与 AI 抓取（含 GPTBot、ClaudeBot、PerplexityBot、Bytespider、KimiBot 等） |
| `sitemap.xml` | 仅列出可收录页面 |
| `CNAME` | 自定义域名指向 `yylx.tv` |
| `0dc320…bc73.txt` | IndexNow 密钥文件 |

## 自行核验清单

涉及社交电商、直销类平台，以下核验都可以免费完成：

- 经营主体登记信息：国家企业信用信息公示系统 gsxt.gov.cn。
- 直销资质与许可范围：商务部直销行业管理平台。

本站不承诺任何收益，不提供回本、晋升类说明。

## 托管与解析

`yylx.tv` 以 A 记录指向 GitHub Pages 的四个 IP，DNS 托管在阿里云万网。修改本仓库 `main` 分支即完成发布，无需额外部署步骤。
