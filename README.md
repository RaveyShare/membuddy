# MemBuddy - 小杏仁记忆搭子

一个基于 AI 的智能记忆助手，帮助用户更好地记忆和复习知识点。

## 🏗️ 项目架构

- **前端**: Next.js + TypeScript + Tailwind CSS (部署在 Vercel)
- **后端**: FastAPI + Python (部署在阿里云 ECS)
- **数据库**: Supabase PostgreSQL
- **AI 服务**: Google Gemini API (通过 Claw Cloud Run 代理)
- **代理服务**: Nginx (部署在 Claw Cloud Run，仅用于 Gemini API 代理)

## 📁 项目结构

```
memBuddy/
├── front/              # Next.js 前端应用
├── back/               # FastAPI 后端 API
├── nginx/              # Nginx 代理配置 (仅 Gemini 代理)
├── scripts/            # 数据库脚本
├── wechat-service/     # 微信服务 (可选)
└── DEPLOYMENT_GUIDE.md # 详细部署指南
```

## 🚀 快速开始

### 部署顺序

1. **Nginx 代理** → Claw Cloud Run (Gemini API 代理)
2. **后端 API** → 阿里云 ECS
3. **前端应用** → Vercel

### 详细部署指南

请参考以下文档：

- 📖 [完整部署指南](./DEPLOYMENT_GUIDE.md)
- 🌐 [前端 Vercel 部署](./front/VERCEL_DEPLOY.md)
- ☁️ [后端阿里云部署](./back/ALIYUN_DEPLOY.md)
- 🔧 [Nginx 代理部署](./nginx/deploy-claw.sh)

## 🔧 本地开发

### 前端开发

```bash
cd front
pnpm install
pnpm dev
```

### 后端开发

```bash
cd back
pip install -r requirements.txt
uvicorn main:app --reload
```

## 🌟 主要功能

- 📝 智能记忆卡片生成
- 🧠 AI 驱动的记忆助手
- 📊 记忆效果分析
- 🔄 间隔重复算法
- 📱 响应式设计
- 🔐 用户认证和数据安全

## 🛠️ 技术栈

### 前端
- Next.js 14
- TypeScript
- Tailwind CSS
- Shadcn/ui
- Supabase Auth

### 后端
- FastAPI
- Python 3.11+
- Supabase PostgreSQL
- Google Gemini API

### 部署
- Vercel (前端)
- 阿里云 ECS (后端)
- Claw Cloud Run (Nginx 代理)
- Supabase (数据库)

## 📄 许可证

MIT License
