# Walvez's Log — 使用说明

个人博客，基于 [AstroPaper](https://github.com/satnaing/astro-paper) v6 主题，
部署在 Cloudflare Workers（免费）。

**线上地址：** https://walvez-log.qx-sync-9f3a7c.workers.dev/

## 写文章

1. 在 `src/content/posts/` 下新建 Markdown 文件（参考 `hello-world.md`）：

```markdown
---
author: Walvez
pubDatetime: 2026-08-16T00:00:00+08:00
title: 文章标题
featured: true        # 是否首页精选
draft: false          # true = 草稿，不发布
tags:
  - 标签1
description: 文章简介（用于 SEO 和列表页）
---

正文内容，支持 Markdown 语法。
```

2. 本地预览：`pnpm dev` → http://localhost:4321
3. 构建并部署：

```bash
pnpm build            # 生成 dist/ 静态文件 + 搜索索引
node scripts/deploy.mjs dist walvez-log   # 上传到 Cloudflare Workers
```

## 修改站点信息

编辑 `astro-paper.config.ts`：
- `site.title` / `site.description` / `site.author` — 站点名称与作者
- `site.profile` — 作者主页链接
- `socials` — 页脚社交链接（github、邮箱等，目前是占位符）

## 部署原理

- 使用 Cloudflare Workers **静态资源直传** API（免费额度：10 万请求/天、2 万个文件）
- 脚本：`scripts/deploy.mjs`（需 `~/.dsh/.env` 中的 `CLOUDFLARE_API_TOKEN`）
- 资产去重：重复上传相同文件不会重复计费

## 后续可选升级

- **绑定自己的域名**：在 Cloudflare 控制台添加域名，DNS 指向该 Worker（域名需购买）
- **GitHub 自动部署**：推送到 GitHub 后连接 Cloudflare Pages（需在 API Token 中
  添加 Pages 权限，或在控制台操作），实现 push 即发布
- **评论系统**：参考 AstroPaper 文档集成 Giscus / Twikoo
