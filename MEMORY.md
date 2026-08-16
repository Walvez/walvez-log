# 项目记忆 · Walvez's Log

> 本文档是项目的**长期记忆**，供任何会话快速恢复上下文。每次重要变更请同步更新。
> 最后更新：2026-08-16（从 AstroPaper 迁移到 astro-notion-blog）

---

## 1. 项目一句话

Walvez 的个人博客：**Notion 作为 CMS**（写作全在 Notion 里）+ astro-notion-blog 模板 + Cloudflare Pages 免费托管（Git 自动部署）。

## 2. 关键链接（TL;DR）

| 项目 | 值 |
|---|---|
| 🌐 Pages 线上地址 | https://walvez-log.pages.dev/（已上线，标题 Walvez's Log） |
| 🐙 GitHub 仓库 | https://github.com/Walvez/walvez-log |
| 📝 Notion 数据库 | 工作区「walve's Notion」→ Private → **Walvez's Log**（站点内容都在这） |
| ☁️ Cloudflare 账户 | Qq1456176105@gmail.com（account id: `903ecee392049ce40f40230ff81bf4d7`） |
| 📖 使用说明 | 见 `DEPLOY.md`（写作 + 部署流程） |

**凭据（Notion）**
- DATABASE_ID = `dabd378d25b782e8a1378172340d9604`（不敏感，可入库）
- NOTION_API_SECRET：**不在仓库中存明文**（GitHub secret scanning 会拦截推送）。它只存在于：① Cloudflare Pages 项目环境变量（secret_text，类型 secret）；② 本机 shell 历史/笔记。连接名：walvez-blog
- 更新站点标题/描述/icon 的正确方式（**浏览器编辑不保存，execCommand 无效**）：
  ```bash
  curl -s -X PATCH "https://api.notion.com/v1/databases/dabd378d25b782e8a1378172340d9604" \
    -H "Authorization: Bearer <TOKEN>" -H "Notion-Version: 2022-06-28" -H "Content-Type: application/json" \
    -d '{"title":[{"text":{"content":"Walvez'"'"'s Log"}}],"description":[{"text":{"content":"描述"}}],"icon":{"type":"emoji","emoji":"📝"}}'
  ```

## 3. 技术栈与架构

- **框架**：Astro 5（SSG）+ React 19 + KaTeX + Mermaid + Prism
- **CMS**：Notion 官方 API（构建时拉取数据库 → 生成静态页）
- **模板**：[otoyo/astro-notion-blog](https://github.com/otoyo/astro-notion-blog) v0.12.0（MIT，上游 demo: astro-notion-blog.pages.dev）
- **部署**：Cloudflare Pages 直连 Git（构建命令 `npm run build`，输出 `dist`，NODE_VERSION=22）
- **构建必需环境变量**：`NOTION_API_SECRET` + `DATABASE_ID`（没有它们构建直接失败）
- **本地环境**：Node v26 无法编译 re2（模板依赖，V8 API 不兼容）→ **本地构建必须用 Node 22**：
  ```bash
  NODE22_BIN="$(dirname "$(npx -y node@22 -p 'process.execPath')")"
  PATH="$NODE22_BIN:$PATH" npm install
  PATH="$NODE22_BIN:$PATH" NOTION_API_SECRET=... DATABASE_ID=... npm run build
  ```
- 模板会额外下载 Notion 封面图/自定义 icon 到 `public/notion/` 等（构建时通过 integration 完成）

## 4. 站点结构（Notion 侧）

- 数据库字段：Page（正文）/ Tags（分类标签）/ Date / Excerpt（摘要）/ FeaturedImage（封面 URL）/ Published（勾选=发布）/ Rank（排序）/ Slug
- **站点名/logo/副标题 = 数据库页面的标题/icon/描述**，在 Notion 里改（浏览器里编辑后要确认保存；或走 API，见 §2）
- 支持多语言（Tags 里有语言字段，en/ja 示例文章可删）
- 8 篇模板示例文章（en/ja 的 Introduction / How-to / Supported blocks / Miyakojima 等）——**当前保留展示中，用户确认后可删**

## 5. 部署流程（更新网站）

```bash
# 1. 在 Notion 里写好文章（勾选 Published）——直接浏览器编辑即可（页面内容块编辑正常，与数据库标题不同）
# 2. 触发 Pages 部署（任选其一）：
git push                       # 改任意文件（或空 commit：git commit --allow-empty -m x && git push）
# 或 Cloudflare 控制台 → walvez-log → Deployments → Retry deployment
# 注意：构建完全重新执行（~2 分钟），不用管 Pages 缓存
```

## 6. 账户/权限现状

- ✅ Pages:Edit（用户已授权，项目 `walvez-log` 连接 `Walvez/walvez-log`，push 即部署）
- ✅ Notion：walvez-blog connection 已创建并连接到博客数据库
- ✅ API Token（~/.dsh/.env）：Workers、Zones、Pages 均可
- ✅ gh CLI 已登录（Walvez）
- ❌ D1 / R2 无权限（用不到）

## 7. 待办 / 后续计划

- [x] Notion 模板数据库复制 + connection + 共享（2026-08-16，浏览器操作完成）
- [x] Pages 环境变量：NOTION_API_SECRET（secret_text）、DATABASE_ID（plain_text）、NODE_VERSION=22
- [x] Pages 构建命令改为 `npm run build`（默认是 pnpm，会构建失败）
- [x] 本地 Node 22 构建验证
- [x] **推送代码 + 线上验证**（2026-08-16 上线：https://walvez-log.pages.dev/，标题 Walvez's Log）
- [x] Notion 站点名/描述/icon 更新（API 方式，标题 Walvez's Log / 📝）
- [x] 删除模板 GitHub Actions workflows（避免每次 push 报 workflow failed 邮件）
- [ ] **删掉 8 篇模板示例文章，写第一篇真文章**（用户确认后；Notion 里删除对应条目即可）
- [ ] **绑定自定义域名**（用户计划以后购买，接入 Cloudflare DNS 后指向 Pages 项目）
- [ ] 可选：lainbo.dev 风格定制（侧边栏 Search/Recommended/Categories、彩色标签、Inter+思源黑体字体、KaTeX 已内置）——之前分析过 lainbo/astro-notion-blog fork，只改了 3 个文件

## 8. 历史决策记录

| 日期 | 决策 | 原因 |
|---|---|---|
| 2026-08-16 | 用 Workers 静态资源直传部署 AstroPaper | Token 当时无 Pages 权限 |
| 2026-08-16 | 接入 Pages Git 自动部署 | 用户加 Pages:Edit 权限后走标准流程，push 即发布 |
| 2026-08-16 | **从 AstroPaper(Markdown) 迁移到 astro-notion-blog(Notion CMS)** | 用户看了 lainbo.dev 觉得好看要求复刻；Notion 写作体验好，手机也能写 |
| 2026-08-16 | 本地构建用 Node 22 而非系统 Node 26 | re2@1.21.4 与 Node 26 V8 API 不兼容，编译失败；Pages 用 NODE_VERSION=22 无此问题 |
| 2026-08-16 | NOTION_API_SECRET 类型用 secret_text | Pages 环境变量中敏感值用 secret 类型 |

## 9. 常见问题

- **构建失败 re2**：本地 Node 太新，用 Node 22（见 §3）
- **构建失败 401/404 Notion API**：检查 NOTION_API_SECRET / DATABASE_ID 是否配置、数据库是否已连接 walvez-blog
- **改了 Notion 文章没生效**：Pages 不会自动监听 Notion 变更，需手动 Retry deployment 或 push 触发
- **站点标题/描述在哪改**：Notion 数据库页面本身（标题=站名，icon=logo，描述=副标题）
- **Pages 部署流程**：build: `npm run build`；output: `dist`；Framework preset: Astro
- **旧 Worker 通道**：`walvez-log.qx-sync-9f3a7c.workers.dev` 部署的是旧 AstroPaper 静态站（2026-08-16 早前），已废弃但 URL 仍在
