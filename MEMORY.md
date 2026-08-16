# 项目记忆 · Walvez's Log

> 本文档是项目的**长期记忆**，供任何会话快速恢复上下文。每次重要变更请同步更新。
> 最后更新：2026-08-16

---

## 1. 项目一句话

Walvez 的个人博客：AstroPaper v6 主题 + Cloudflare Workers 免费托管。

## 2. 关键链接（TL;DR）

| 项目 | 值 |
|---|---|
| 🌐 线上地址 | https://walvez-log.qx-sync-9f3a7c.workers.dev/ |
| 🐙 GitHub 仓库 | https://github.com/Walvez/walvez-log |
| ☁️ Cloudflare 账户 | Qq1456176105@gmail.com（account id: `903ecee392049ce40f40230ff81bf4d7`） |
| ☁️ workers.dev 子域 | `qx-sync-9f3a7c` |
| ⚙️ Worker 名 | `walvez-log` |
| 📖 使用说明 | 见 `DEPLOY.md` |

## 3. 技术栈与架构

- **框架**：Astro 7（纯静态 SSG）+ Tailwind CSS v4
- **主题**：AstroPaper v6.1.0（[satnaing/astro-paper](https://github.com/satnaing/astro-paper)，MIT）
- **搜索**：Pagefind（构建期生成中文索引）
- **部署**：Cloudflare Workers **静态资源直传 API**（`scripts/deploy.mjs`）
  - 免费额度：10 万请求/天、2 万静态文件、单文件 25 MiB
  - 资产按 sha256 去重，重复部署不重复上传
- **本地环境**：Node v26 / pnpm v11（AstroPaper 要求 Node ≥ 22.12）

## 4. 本地定制清单（相对上游主题的改动）

1. `astro-paper.config.ts` — 站点信息（标题/作者/描述/时区 Asia/Shanghai/lang zh-CN）、社交链接、关闭 editPost
2. `astro.config.ts` — i18n locales 改为 `["zh-CN"]` + defaultLocale zh-CN（**必须**与 site.lang 一致，否则构建报 MissingLocaleError）
3. `src/components/Datetime.astro` — 日期格式：zh-CN 显示「YYYY年M月D日」
4. `src/pages/index.astro` — hero 改为「你好，我是 Walvez」+ 中文简介
5. `src/content/pages/about.md` — 中文关于页
6. `src/content/posts/hello-world.md` — 首篇文章（featured）
7. 删除全部示例文章
8. `scripts/deploy.mjs` — 部署脚本（读取 `~/.dsh/.env` 的 `CLOUDFLARE_API_TOKEN`）

## 5. 部署流程（更新网站）

```bash
pnpm build                          # → dist/ + pagefind 索引
node scripts/deploy.mjs dist walvez-log
```

注意：`pnpm build` 包含 `astro check`（类型检查，改配置报错先看这里）。

## 6. 账户/权限现状

- ✅ API Token（~/.dsh/.env）可操作：Workers、Zones
- ✅ **Pages:Edit 已加**（2026-08-16 用户确认）
- ❌ D1 / R2 无权限（暂时用不到）
- ✅ gh CLI 已登录（Walvez，scopes: repo/workflow/gist）
- ⚠️ 邮件占位符已改为 qq1456176105@gmail.com（用户 Cloudflare 注册邮箱）

## 7. 待办 / 后续计划

- [ ] **连接 Cloudflare Pages（Git 自动部署）** — 2026-08-16 尝试 API 失败：错误 8000011「Cloudflare Pages Git installation 内部异常」，需要用户在控制台重新授权 GitHub App：
  1. 打开 https://dash.cloudflare.com/ → Workers 和 Pages → 创建应用程序 → Pages → 连接到 Git
  2. 按提示重新安装/授权 Cloudflare GitHub App（选择 Walvez/walvez-log）
  3. 选择仓库 walvez-log，Framework 预设 Astro
  4. 构建命令 `pnpm build`，输出目录 `dist`，环境变量 `NODE_VERSION=22`
  5. 部署后建议关闭 Rocket Loader（Speed → Optimization）
- [ ] **绑定自定义域名**（用户计划以后购买，域名接入 Cloudflare DNS 后指向 walvez-log Worker）
- [ ] 可选：Giscus 评论（需 GitHub Discussions）、Twikoo
- [ ] 可选：中文 UI 文案（现在导航为英文，i18n 只有 en）

## 8. 历史决策记录

| 日期 | 决策 | 原因 |
|---|---|---|
| 2026-08-16 | 选 AstroPaper 而非全栈方案 | 纯静态、免费额度完全够用、官方演示站就在 CF 上 |
| 2026-08-16 | 用 Workers 静态资源而非 Pages 直传 | 当时 Token 无 Pages 权限；Workers 同样免费且已跑通 |
| 2026-08-16 | lang 用 zh-CN 并同步 i18n 配置 | 中文日期/SEO；不配 i18n.locales 会构建失败 |
| 2026-08-16 | 部署脚本读 ~/.dsh/.env 的 token | MCP token 与本地 wrangler 未配置，.env 是唯一本地凭据源 |

## 9. 常见问题

- **部署后 404**：等 1-2 分钟 CDN 传播，或检查 subdomain 是否 enabled
- **构建报 MissingLocaleError**：`astro.config.ts` 的 i18n.locales 必须包含 site.lang
- **改配置后类型错误**：editPost.enabled=false 时不能带 url 字段
- **部署脚本报 "No such module"**：模块 part 名必须是 `files`（filename=index.js），不是文件名
