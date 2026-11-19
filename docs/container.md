# 容器构建与镜像发布

## 当前范围

本次只补齐镜像构建、健康检查和 GHCR 发布。`cd.yml` 已替换旧部署逻辑：发布镜像后不会 SSH、SCP、重载 PM2 或切换线上入口。现有服务器服务继续运行。
尚未包含生产 Compose、服务器部署脚本、自动回滚或数据搬迁，先不要删除旧服务和目录。

## 本地构建

在当前仓库根目录执行：

```bash
docker build -t fund-frontend:local .
```

构建上下文排除了环境文件、密钥、本地依赖和运行数据。健康检查使用镜像内置工具，不依赖额外 curl。

## 发布到 GHCR

1. 先提交并推送本仓库改动。工作流需要存在于远程仓库中；手动入口通常需先合入默认分支。
2. 在 Actions 手动运行 Publish container image，或推送尚未使用的 `v*.*.*` tag。
3. 工作流测试通过后，使用自动提供的 GITHUB_TOKEN 推送 `ghcr.io/<小写owner>/<小写repo>`。
4. tag 发布生成对应版本标签，所有发布生成 `sha-<完整commit>` 标签；不生成 latest。
5. Actions 摘要记录镜像 digest，后续 Compose 使用完整 `image@sha256:...` 固定版本。
6. 私有镜像在服务器使用具有 read:packages 权限的 classic Token 登录 GHCR，然后拉取摘要中的镜像。

默认发布 `linux/amd64`，上线前用 `uname -m` 核对服务器架构；ARM 服务器必须先调整工作流平台设置。
首次推送默认私有；仓库/组织策略须允许工作流写入 Packages。未提交、未推送前不会产生镜像。

## 服务注意事项

- 多阶段构建：Node 22 打包，Nginx 提供静态资源。构建默认 `VITE_API_BASE_URL=/api`；这只是公开构建参数，不可传入密钥。
- 使用 `npm ci --legacy-peer-deps`，与镜像及发布任务保持一致。
- Nginx 默认代理到同一 Docker 网络的 `backend:9000`，保留完整 `/api/...` 路径。
- 已配置 SPA 回退、SSE 禁用缓冲、WebSocket、100 MiB 上传上限、600 秒代理超时、跨域隔离头。入口 Nginx 也必须允许对应大小和超时。
- `/healthz` 仅检查前端 Nginx；不能证明后端可用。
- 音频 WebSocket 跟随网页域名及 HTTP/HTTPS；Vite 开发代理已启用 WebSocket。
- 镜像内端口为 80。后端容器替换后通过 Docker DNS 重新解析地址。
- 原前端生产环境文件不复制进镜像；需要改变 API 前缀时用 `--build-arg VITE_API_BASE_URL=...` 重新构建。
- 切换前验证登录、深层路由刷新、研报上传、SSE、音频 WebSocket 和跨域隔离。当前仓库没有持久化的浏览器 E2E 测试配置，单元测试不能代替这些验证。

## 上线验收

先备份并验证业务数据和配置，再准备 Compose 网络、环境变量及持久化挂载。
镜像的 HEALTHCHECK 只是存活检查；依赖连接和完整业务流程通过后才能切换入口。
应用更新期间保留 MySQL、Redis、Qdrant 原部署及数据卷。
生产环境的普通 Compose 重建不是零停机发布；保留旧镜像、配置和可恢复的数据备份。

## 本次本地验证范围

已用本机 Nginx 和独立无头 Chrome 验证生产包：登录页渲染、音频深层路由、同源 WebSocket 接通/收帧/断开；模拟后端下验证 API 路径及查询参数、SSE 和跨域隔离头。该验证没有连接生产数据库或模型，也未覆盖 HTTPS 及真实 Docker DNS。
