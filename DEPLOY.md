# Walvez's Log — 使用说明（Notion 版）

个人博客，基于 [astro-notion-blog](https://github.com/otoyo/astro-notion-blog) 模板。
**写作在 Notion 里完成**，构建时通过 Notion API 拉取文章，部署在 Cloudflare Pages（免费）。

**线上地址：** https://walvez-log.pages.dev/

## 写文章（在 Notion 中）

1. 打开 Notion 工作区中的 **astro-notion-blog** 数据库
2. 点击 **New** 新建条目，填写字段：
   - **Page**：文章标题（点进去写正文，支持 Notion 全部排版）
   - **Tags**：分类标签（会显示为彩色标签）
   - **Date**：发布日期（Published 勾选才会发布）
   - **Excerpt**：列表页摘要
   - **FeaturedImage**：封面图 URL
   - **Slug**：URL 后缀（可留空自动生成）
   - **Published**：勾选 = 发布
3. 更新后触发部署：
   - 方式一：`git push`（改任意文件触发）
   - 方式二：Cloudflare Pages 控制台 → walvez-log → Deployments → Retry deployment

## 站点信息修改

在 **Notion 数据库页面本身**修改：
- 数据库标题 → 站点名
- 数据库 icon → 站点 logo
- 页面描述 → 站点副标题

## 本地开发

```bash
npm install
NOTION_API_SECRET=<token> DATABASE_ID=<id> npm run dev   # http://localhost:4321
NOTION_API_SECRET=<token> DATABASE_ID=<id> npm run build # 构建到 dist/
```

## 关键配置（Cloudflare Pages）

- 构建命令：`npm run build`（框架预设选 Astro）
- 输出目录：`dist`
- 环境变量：
  - `NOTION_API_SECRET`（secret）— Notion integration token
  - `DATABASE_ID` — Notion 数据库 ID
  - `NODE_VERSION=22`

## 备注

- 旧版 AstroPaper 方案（Markdown 写作）已迁移，git 历史中可找回
- 备用部署通道：`walvez-log.qx-sync-9f3a7c.workers.dev`（旧 Worker，可能过期）
