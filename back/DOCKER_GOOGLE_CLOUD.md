# Docker 部署 Google Cloud 配置指南

本指南说明如何在 Docker 环境中配置 Google Cloud 认证，以启用图像生成和音频生成功能。

## 📋 前置要求

1. **Google Cloud 服务账号密钥文件**
   - 从 Google Cloud Console 下载的 JSON 格式服务账号密钥
   - 例如：`gen-lang-client-0374473221-e19a8e500cef.json`

2. **已启用的 Google Cloud APIs**
   - Vertex AI API
   - Cloud Text-to-Speech API
   - Imagen API

## 🚀 快速部署

### 步骤 1: 准备环境变量

复制并修改环境变量文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，设置以下变量：
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=gen-lang-client-0374473221
GOOGLE_CLOUD_LOCATION=us-central1

# Google Cloud Credentials Path (绝对路径)
GOOGLE_CREDENTIALS_PATH=/Users/ravey/Downloads/gen-lang-client-0374473221-e19a8e500cef.json
```

### 步骤 2: 启动服务

```bash
# 构建并启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f membuddy-api
```

### 步骤 3: 验证部署

检查服务是否正常启动：
```bash
# 检查容器状态
docker-compose ps

# 测试 API
curl http://localhost:8000/health
```

## 🔧 高级配置

### 生产环境部署

对于生产环境，建议使用以下方式管理密钥：

1. **使用 Docker Secrets**：
```yaml
services:
  membuddy-api:
    secrets:
      - google_credentials
    environment:
      - GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/google_credentials

secrets:
  google_credentials:
    file: ./path/to/service-account-key.json
```

2. **使用环境变量传递密钥内容**：
```bash
# 将密钥文件内容作为环境变量
GOOGLE_CREDENTIALS_JSON=$(cat /path/to/service-account-key.json | base64)
```

### 云平台部署

在云平台（如 AWS、Azure、GCP）上部署时：

1. **使用托管身份认证**（推荐）
2. **将密钥文件存储在安全的密钥管理服务中**
3. **使用环境变量注入密钥内容**

## 🛠️ 故障排除

### 常见问题

1. **认证失败**：
   - 检查 `GOOGLE_CREDENTIALS_PATH` 路径是否正确
   - 确认密钥文件权限可读
   - 验证服务账号权限

2. **API 未启用**：
   ```bash
   # 启用必要的 APIs
   gcloud services enable aiplatform.googleapis.com
   gcloud services enable texttospeech.googleapis.com
   ```

3. **容器无法访问密钥文件**：
   - 确认文件路径使用绝对路径
   - 检查文件权限和 SELinux 设置

### 调试命令

```bash
# 进入容器检查配置
docker-compose exec membuddy-api bash

# 检查环境变量
echo $GOOGLE_APPLICATION_CREDENTIALS

# 检查密钥文件
ls -la /app/google-credentials.json

# 测试认证
python -c "from google.auth import default; print(default())"
```

## 📝 注意事项

- 🔒 **安全性**：不要将密钥文件提交到版本控制系统
- 🔄 **密钥轮换**：定期更新服务账号密钥
- 📊 **监控**：监控 API 使用量和费用
- 🚫 **权限最小化**：只授予必要的权限给服务账号

## 🎯 验证功能

部署完成后，可以通过前端界面测试：
1. 访问 `http://localhost:3000`
2. 创建新的记忆项目
3. 测试图像生成功能
4. 测试音频生成功能

如果配置正确，这些功能应该能够正常工作而不再显示 fallback 文本。