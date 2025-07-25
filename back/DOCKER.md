# MemBuddy API Docker 部署指南

## 文件说明

- `Dockerfile` - Docker 镜像构建文件
- `.dockerignore` - Docker 构建时忽略的文件
- `docker-compose.yml` - Docker Compose 配置文件

## 快速开始

### 1. 环境变量设置

创建 `.env` 文件并设置以下环境变量：

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

### 2. 使用 Docker Compose（推荐）

```bash
# 构建并启动所有服务
docker-compose up --build

# 后台运行
docker-compose up -d --build

# 停止服务
docker-compose down

# 查看日志
docker-compose logs membuddy-api
```

### 3. 单独构建 Docker 镜像

```bash
# 构建镜像
docker build -t membuddy-api .

# 运行容器
docker run -p 8000:8000 \
  -e SUPABASE_URL=your_supabase_url \
  -e SUPABASE_ANON_KEY=your_supabase_anon_key \
  -e SUPABASE_JWT_SECRET=your_supabase_jwt_secret \
  -e GEMINI_API_KEY=your_gemini_api_key \
  membuddy-api
```

## 服务访问

- API 服务：http://localhost:8000
- API 文档：http://localhost:8000/docs
- 健康检查：http://localhost:8000/health

## 健康检查

Docker 容器包含健康检查功能，会定期检查 `/health` 端点：

```bash
# 检查容器健康状态
docker ps

# 查看健康检查日志
docker inspect --format='{{json .State.Health}}' <container_id>
```

## 生产环境部署

### 1. 构建生产镜像

```bash
# 构建优化的生产镜像
docker build -t membuddy-api:latest .

# 推送到镜像仓库（可选）
docker tag membuddy-api:latest your-registry/membuddy-api:latest
docker push your-registry/membuddy-api:latest
```

### 2. 推送到 Docker Hub

```bash
# 使用推送脚本（推荐）
./push-to-dockerhub.sh

# 或手动推送
docker login
docker tag membuddy-api:latest your-username/membuddy-api:latest
docker push your-username/membuddy-api:latest
```

### 3. 生产环境运行

```bash
# 从 Docker Hub 拉取并运行
docker run -d \
  --name membuddy-api \
  --restart unless-stopped \
  -p 8000:8000 \
  -e PORT=8000 \
  -e SUPABASE_URL=your_supabase_url \
  -e SUPABASE_ANON_KEY=your_supabase_anon_key \
  -e SUPABASE_JWT_SECRET=your_supabase_jwt_secret \
  -e GEMINI_API_KEY=your_gemini_api_key \
  -e BACKEND_CORS_ORIGINS=https://your-frontend-domain.com \
  your-username/membuddy-api:latest
```

## 故障排除

### 1. 查看容器日志

```bash
# Docker Compose
docker-compose logs membuddy-api

# 单独容器
docker logs <container_id>
```

### 2. 进入容器调试

```bash
# 进入运行中的容器
docker exec -it <container_id> /bin/bash

# 或使用 Docker Compose
docker-compose exec membuddy-api /bin/bash
```

### 3. 常见问题

- **端口冲突**：确保 8000 端口未被占用
- **环境变量**：检查所有必需的环境变量是否正确设置
- **网络问题**：确保容器可以访问外部 API（Supabase、Gemini）
- **依赖问题**：如果构建失败，检查 `requirements.txt` 中的依赖版本

## 镜像优化

当前 Dockerfile 已包含以下优化：

- 使用 Python 3.11 slim 镜像减小体积
- 多阶段构建（可进一步优化）
- 安装必要的系统依赖
- 使用 `.dockerignore` 排除不必要文件
- 设置合适的工作目录和环境变量

## 监控和日志

建议在生产环境中：

1. 使用日志聚合工具（如 ELK Stack）
2. 设置监控和告警（如 Prometheus + Grafana）
3. 定期备份数据
4. 使用负载均衡器（如 Nginx）