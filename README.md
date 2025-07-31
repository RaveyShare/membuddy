# MemBuddy - 智能记忆助手

MemBuddy 是一个基于AI的智能记忆助手，帮助用户通过思维导图、记忆口诀和感官联想等方式提升记忆效果。

## 🌍 双版本架构

为了解决网络访问和本地化需求，MemBuddy 提供两套独立的系统：

### 🇨🇳 国内版 (China Version)
- **AI模型**: 通义千问、文心一言、智谱AI、百川AI等国产大模型
- **语音合成**: 阿里云TTS、腾讯云TTS
- **语言**: 中文界面和交互
- **部署**: 国内云服务器，无网络访问问题
- **特点**: 完全本土化，响应速度快

### 🌐 国际版 (Global Version)
- **AI模型**: Gemini、OpenAI、Claude等国际AI服务
- **语音合成**: Google Cloud TTS、ElevenLabs
- **语言**: 英文界面和交互
- **部署**: 全球云服务器
- **特点**: 国际化服务，功能丰富

## 🚀 快速部署

### 国内版部署

```bash
# 1. 克隆项目
git clone https://github.com/RaveyShare/membuddy.git
cd membuddy

# 2. 初始化环境
./deploy-china.sh init

# 3. 配置环境变量
cp back/.env.china.example back/.env
# 编辑 back/.env 文件，配置API密钥

# 4. 部署应用
./deploy-china.sh deploy

# 5. 查看状态
./deploy-china.sh status
```

### 国际版部署

```bash
# 1. 克隆项目
git clone https://github.com/RaveyShare/membuddy.git
cd membuddy

# 2. 初始化环境
./deploy-global.sh init

# 3. 配置环境变量
cp back/.env.global.example back/.env
# 编辑 back/.env 文件，配置API密钥

# 4. 部署应用
./deploy-global.sh deploy

# 5. 查看状态
./deploy-global.sh status
```

### Docker Compose 部署

```bash
# 国内版
docker-compose -f docker-compose.china.yml up -d

# 国际版
docker-compose -f docker-compose.global.yml up -d
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
│   ├── .env.china.example        # 国内版环境变量模板
│   ├── .env.global.example       # 国际版环境变量模板
│   └── ...
├── nginx/                         # Nginx配置
│   ├── china.conf                # 国内版配置
│   └── global.conf               # 国际版配置
├── redis/                         # Redis配置
│   └── redis.conf
├── deploy-china.sh               # 国内版部署脚本
├── deploy-global.sh              # 国际版部署脚本
├── docker-compose.china.yml      # 国内版Docker配置
├── docker-compose.global.yml     # 国际版Docker配置
└── README.md
```

## ⚙️ 配置说明

### 国内版配置 (.env.china.example)

主要配置项：
- `REGION=china` - 设置为国内版
- `AI_PROVIDER=qwen` - 选择AI提供商（qwen/ernie/zhipu/baichuan）
- `TTS_PROVIDER=aliyun` - 选择TTS服务（aliyun/tencent）
- 各AI服务的API密钥配置

### 国际版配置 (.env.global.example)

主要配置项：
- `REGION=global` - 设置为国际版
- `AI_PROVIDER=gemini` - 选择AI提供商（gemini/openai/claude）
- `TTS_PROVIDER=google` - 选择TTS服务（google/elevenlabs）
- 各AI服务的API密钥配置

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
- Docker (容器化部署)

## 🐳 Docker 镜像源配置

**重要**: 由于网络原因，在国内拉取 Docker 镜像可能会很慢。项目已配置阿里云镜像源优化：

### 快速配置镜像加速器

```bash
# 自动配置 Docker 镜像加速器
./setup-docker-mirrors.sh setup

# 验证配置
./setup-docker-mirrors.sh verify
```

### 项目镜像优化

- ✅ **Dockerfile**: 使用阿里云 Python 基础镜像
- ✅ **pip 源**: 配置阿里云 PyPI 镜像
- ✅ **系统源**: 使用阿里云 Debian 软件源
- ✅ **Docker Compose**: 所有服务镜像使用阿里云源

详细配置请参考: [Docker 镜像加速器配置指南](./DOCKER_MIRRORS_SETUP.md)

## 📄 许可证

MIT License
