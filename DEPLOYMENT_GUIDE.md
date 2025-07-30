# MemBuddy 架构部署指南

## 🏗️ 架构概览

部署架构采用分离式设计，各组件部署在最适合的平台上：

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vercel        │    │  Claw Cloud Run  │    │   阿里云 ECS     │
│   (前端)        │    │  (Nginx 代理)    │    │   (后端 API)    │
│                 │    │                  │    │                 │
│ Next.js App     │───▶│ Gemini Proxy     │◀───│ FastAPI Server  │
│                 │    │ /gemini-proxy/   │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Google Gemini   │    │   Supabase      │
                       │ API             │    │   (数据库)      │
                       └─────────────────┘    └─────────────────┘
```

## 📋 部署顺序

### 1. Claw Cloud Run - Nginx 代理 (第一步)

**目的**：提供 Gemini API 代理服务，解决网络访问限制

**部署步骤**：
```bash
cd nginx/
./deploy-claw.sh
```

**配置要点**：
- 仅提供 `/gemini-proxy/` 路径的代理服务
- 包含微信验证文件 `/MP_verify_mluLfyNcp0fnRTDW.txt`
- 健康检查端点 `/nginx-health`

**获得**：Claw Cloud Run 域名（如：`https://your-claw-domain.com`）

### 2. 阿里云 ECS - 后端 API (第二步)

**目的**：部署 FastAPI 后端服务

**部署步骤**：
```bash
cd back/
# 参考 ALIYUN_DEPLOY.md 详细步骤
cp .env.aliyun.example .env
# 编辑 .env 文件，设置 GEMINI_BASE_URL=https://your-claw-domain.com/gemini-proxy
docker build -t membuddy-api .
docker run -d --name membuddy-api -p 8000:8000 --env-file .env membuddy-api
```

**配置要点**：
- `GEMINI_BASE_URL` 指向 Claw Cloud Run 代理
- 配置 CORS 允许 Vercel 域名
- 设置 Nginx 反向代理和 SSL

**获得**：阿里云后端域名（如：`https://api.your-domain.com`）

### 3. Vercel - 前端应用 (第三步)

**目的**：部署 Next.js 前端应用

**部署步骤**：
```bash
cd front/
# 参考 VERCEL_DEPLOY.md 详细步骤
# 在 Vercel 中设置环境变量：
# NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
```

**配置要点**：
- `NEXT_PUBLIC_API_URL` 指向阿里云后端
- 自动部署和 CDN 加速

## 🔧 关键配置文件修改

### 已完成的修改

✅ **删除的文件**：
- `nginx/cloudbuild.yaml` - Google Cloud Build 配置
- `nginx/deploy.sh` - Google Cloud Run 部署脚本
- `back/DOCKER_GOOGLE_CLOUD.md` - Google Cloud 部署文档
- `nginx/docker-compose.yml` - 完整应用 Docker Compose
- `back/docker-compose.yml` - 后端 Docker Compose

✅ **修改的文件**：
- `nginx/nginx.conf` - 简化为仅 Gemini 代理
- `nginx/Dockerfile` - 添加健康检查
- `front/lib/api-config.ts` - API URL 指向阿里云
- `front/vercel.json` - 环境变量指向阿里云
- `front/VERCEL_DEPLOY.md` - 更新部署说明
- `back/config.py` - GEMINI_BASE_URL 指向 Claw 代理

✅ **新增的文件**：
- `nginx/deploy-claw.sh` - Claw Cloud Run 部署脚本
- `back/ALIYUN_DEPLOY.md` - 阿里云部署详细指南
- `back/.env.aliyun.example` - 阿里云环境变量模板

## 🌐 网络流量路径

### 用户访问流程
```
用户浏览器 → Vercel CDN → Next.js App → 阿里云后端 API
```

### Gemini API 调用流程
```
阿里云后端 → Claw Cloud Run Nginx → Google Gemini API
```

### 微信验证流程
```
微信服务器 → Claw Cloud Run → /MP_verify_mluLfyNcp0fnRTDW.txt
```

## 🔑 环境变量配置

### Claw Cloud Run (Nginx)
- 无需特殊环境变量
- 通过配置文件处理代理

### 阿里云后端
```bash
GEMINI_BASE_URL=https://your-claw-domain.com/gemini-proxy
SUPABASE_URL=https://your-project.supabase.co
FRONTEND_URL=https://your-app.vercel.app
```

### Vercel 前端
```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
```

## 🚀 部署验证

### 1. Claw Cloud Run 验证
```bash
curl https://your-claw-domain.com/nginx-health
curl https://your-claw-domain.com/MP_verify_mluLfyNcp0fnRTDW.txt
```

### 2. 阿里云后端验证
```bash
curl https://api.your-domain.com/health
curl https://api.your-domain.com/api/memory_items
```

### 3. Vercel 前端验证
```bash
curl https://your-app.vercel.app
```

## 🔄 更新部署

### 代码更新流程
1. **前端**：推送到 GitHub → Vercel 自动部署
2. **后端**：推送到服务器 → 重新构建 Docker 镜像
3. **代理**：修改配置 → 重新部署 Claw Cloud Run

## 📊 监控和维护

### 健康检查端点
- Nginx 代理：`/nginx-health`
- 后端 API：`/health`
- 前端应用：Vercel 自动监控

### 日志查看
- Claw Cloud Run：平台控制台
- 阿里云后端：`docker logs membuddy-api`
- Vercel 前端：Vercel 控制台

## 🛡️ 安全考虑

1. **HTTPS 强制**：所有服务都使用 HTTPS
2. **CORS 配置**：严格限制跨域访问
3. **API 密钥**：通过环境变量安全管理
4. **网络隔离**：各服务独立部署，降低风险

## 💰 成本优化

- **Vercel**：前端 CDN 和自动扩缩容
- **Claw Cloud Run**：按需付费，仅代理服务
- **阿里云 ECS**：固定成本，可控资源
- **Supabase**：数据库即服务，按使用量付费

这种架构充分利用了各平台的优势，实现了成本效益和性能的最佳平衡。