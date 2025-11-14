# MemBuddy - 智能记忆助手

MemBuddy 是一个基于AI的智能记忆助手，帮助用户通过思维导图、记忆口诀和感官联想等方式提升记忆效果。

## 🚀 特性

- 📝 智能记忆卡片生成
- 🧠 AI 驱动的记忆助手
- 📊 记忆效果分析
- 🔄 间隔重复算法
- 📱 响应式设计
- 🔐 用户认证和数据安全

## 🚀 快速部署

### 一键部署脚本（推荐）

项目提供了强大的一键部署脚本 `deploy.sh`，支持多种部署方式：

```bash
# 查看帮助信息
./deploy.sh help

# 完整部署流程（提交代码 + 构建镜像 + 推送 + 部署）
./deploy.sh -h your-server.com deploy-full

# 本地阿里云部署
./deploy.sh deploy-local init    # 初始化环境
./deploy.sh deploy-local deploy  # 部署应用

# 分步骤操作
./deploy.sh commit               # 提交代码
./deploy.sh build                # 构建Docker镜像
./deploy.sh push                 # 推送镜像
./deploy.sh -h server deploy-docker  # Docker部署

# 监控和维护
./deploy.sh status               # 检查状态
./deploy.sh logs                 # 查看日志
```

### 传统本地部署

```bash
# 1. 克隆项目
git clone https://github.com/RaveyShare/membuddy.git
cd membuddy

# 2. 初始化环境
./deploy-aliyun.sh init

# 3. 配置环境变量
cp back/.env.aliyun.example back/.env
# 编辑 back/.env 文件，配置API密钥

# 4. 部署应用
./deploy-aliyun.sh deploy

# 5. 查看状态
./deploy-aliyun.sh status
```

## 📁 项目结构

```
membuddy/
├── back/                          # 后端代码
│   ├── ai_manager.py             # AI管理器
│   ├── ai_providers_china.py     # 国内AI提供商
│   ├── ai_providers_global.py    # 国际AI提供商
│   ├── config.py                 # 配置管理
│   ├── gemini.py                 # 主要业务逻辑
│   ├── .env.aliyun.example       # 环境变量模板
│   ├── push-to-dockerhub.sh      # Docker镜像构建脚本
│   └── ...
├── front/                         # 前端代码
│   ├── app/                      # Next.js 应用
│   ├── components/               # React 组件
│   └── ...
├── mina/                          # 微信小程序代码
│   ├── pages/                    # 小程序页面
│   ├── utils/                    # 工具函数
│   └── ...
├── nginx/                         # Nginx配置
│   └── local-deploy.conf         # 本地部署配置模板
├── scripts/                       # 数据库脚本
├── deploy.sh                     # 一键部署脚本（推荐）
├── deploy-aliyun.sh              # 阿里云部署脚本
├── DEPLOYMENT.md                 # 详细部署指南
└── LOCAL_DEPLOY_README.md        # 本地部署文档
```

## ⚙️ 配置说明

### 环境变量配置 (.env.aliyun.example)

主要配置项：
- `SUPABASE_URL` - Supabase 数据库 URL
- `SUPABASE_ANON_KEY` - Supabase 匿名密钥
- `SUPABASE_JWT_SECRET` - Supabase JWT 密钥
- `GEMINI_API_KEY` - Google Gemini API 密钥
- `FRONTEND_URL` - 前端应用 URL
- 其他可选的 AI 服务配置

## 🏗️ 项目架构

- **前端**: Next.js + TypeScript + Tailwind CSS
- **后端**: FastAPI + Python 3.11+
- **数据库**: Supabase PostgreSQL
- **AI 服务**: Google Gemini API
- **Web 服务器**: Nginx
- **部署方式**: 本地部署（Python 虚拟环境 + systemd 服务）

## 📖 详细文档

- 🚀 [一键部署指南](./DEPLOYMENT.md) - **推荐阅读**
- 📋 [本地部署详细指南](./LOCAL_DEPLOY_README.md)
- 🌐 [前端 Vercel 部署](./front/VERCEL_DEPLOY.md)
- 🐳 [Docker 部署说明](./back/push-to-dockerhub.sh)

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
# 创建虚拟环境
python3 -m venv .venv
source .venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动开发服务器
uvicorn main:app --reload
```

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
- 本地部署（Python 虚拟环境 + systemd 服务）
- Nginx（反向代理和静态文件服务）
- Supabase（数据库）

## 🔧 服务管理

本项目使用 systemd 管理后端服务，提供以下优势：

- ✅ **自动启动**: 系统启动时自动启动服务
- ✅ **自动重启**: 服务异常时自动重启
- ✅ **日志管理**: 统一的日志管理和查看
- ✅ **资源控制**: 可配置内存和 CPU 限制
- ✅ **简单管理**: 使用标准的 systemctl 命令管理

## 📄 许可证

MIT License
