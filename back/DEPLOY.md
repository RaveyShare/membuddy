# MemBuddy API - Render 部署指南

## 部署步骤

### 1. 准备工作
确保你有以下环境变量的值：
- `SUPABASE_URL`: 你的 Supabase 项目 URL
- `SUPABASE_KEY`: 你的 Supabase anon key
- `SUPABASE_JWT_SECRET`: 你的 Supabase JWT secret
- `GEMINI_API_KEY`: 你的 Google Gemini API key

### 2. 在 Render 上部署

1. 访问 [Render.com](https://render.com) 并登录
2. 点击 "New +" 按钮，选择 "Web Service"
3. 连接你的 GitHub 仓库
4. 选择 `memBuddy/back` 目录作为根目录
5. 配置以下设置：
   - **Name**: `membuddy-api`
   - **Environment**: `Python 3`
   - **Build Command**: 
     ```
     apt-get update && apt-get install -y libpq-dev gcc && pip install -r requirements.txt
     ```
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`

### 3. 设置环境变量
在 Render 的环境变量设置中添加：
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_JWT_SECRET`
- `GEMINI_API_KEY`

### 4. 部署
点击 "Create Web Service" 开始部署。

### 5. 更新前端配置
部署完成后，将 Render 提供的 URL 添加到前端的 API 配置中。

## 文件说明

- `render.yaml`: Render 部署配置文件
- `start.sh`: 启动脚本
- `requirements.txt`: Python 依赖
- `main.py`: FastAPI 应用入口

## 故障排除

### psycopg2 构建错误
如果遇到 psycopg2 相关的构建错误，可以尝试以下解决方案：

1. **使用系统依赖** (推荐):
   ```
   apt-get update && apt-get install -y libpq-dev gcc && pip install -r requirements.txt
   ```

2. **替换为 psycopg2-binary** (如果上述方法失败):
   在 `requirements.txt` 中将 `psycopg2==2.9.10` 改为 `psycopg2-binary==2.9.10`

3. **使用 psycopg** (最新版本):
   ```
   pip install psycopg[binary]
   ```

### 常见构建错误
- **Module Not Found**: 检查 `requirements.txt` 中的依赖是否正确
- **Python 版本不兼容**: 确保使用 Python 3.8+ 
- **环境变量缺失**: 确保所有必需的环境变量都已设置

## 注意事项

1. 免费计划有一些限制：
   - 服务在 15 分钟无活动后会休眠
   - 每月有 750 小时的运行时间限制
   - 冷启动可能需要几秒钟

2. 确保所有环境变量都正确设置
3. 检查 CORS 设置是否包含你的前端域名
4. 如果构建失败，检查 Render 的构建日志获取详细错误信息