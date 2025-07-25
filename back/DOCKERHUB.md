# MemBuddy API Docker Hub 部署指南

## 快速推送到 Docker Hub

### 1. 准备工作

确保你有 Docker Hub 账号：https://hub.docker.com/

### 2. 设置环境变量（可选）

```bash
export DOCKER_USERNAME=your-dockerhub-username
export REPO_NAME=membuddy-api
export TAG=latest
```

### 3. 一键推送

```bash
# 使用自动化脚本
./push-to-dockerhub.sh
```

脚本会自动：
- 检查 Docker 状态
- 提示登录 Docker Hub（如果未登录）
- 构建镜像
- 标记镜像
- 推送到 Docker Hub

### 4. 手动推送（可选）

```bash
# 1. 登录 Docker Hub
docker login

# 2. 构建镜像
docker build -t membuddy-api:latest .

# 3. 标记镜像
docker tag membuddy-api:latest your-username/membuddy-api:latest

# 4. 推送镜像
docker push your-username/membuddy-api:latest
```

## 使用 Docker Hub 镜像

### 1. 拉取镜像

```bash
docker pull your-username/membuddy-api:latest
```

### 2. 运行容器

```bash
docker run -p 8000:8000 \
  -e SUPABASE_URL=your_supabase_url \
  -e SUPABASE_ANON_KEY=your_supabase_anon_key \
  -e SUPABASE_JWT_SECRET=your_supabase_jwt_secret \
  -e GEMINI_API_KEY=your_gemini_api_key \
  your-username/membuddy-api:latest
```

### 3. 使用 Docker Compose

更新 `docker-compose.yml` 中的镜像：

```yaml
services:
  membuddy-api:
    image: your-username/membuddy-api:latest  # 替换 build: .
    # ... 其他配置保持不变
```

然后运行：

```bash
docker-compose up
```

## 版本管理

### 推送特定版本

```bash
# 推送带版本号的镜像
TAG=v1.0.0 ./push-to-dockerhub.sh

# 或手动
docker tag membuddy-api:latest your-username/membuddy-api:v1.0.0
docker push your-username/membuddy-api:v1.0.0
```

### 推送多个标签

```bash
# 同时推送 latest 和版本号
docker tag membuddy-api:latest your-username/membuddy-api:latest
docker tag membuddy-api:latest your-username/membuddy-api:v1.0.0
docker push your-username/membuddy-api:latest
docker push your-username/membuddy-api:v1.0.0
```

## 自动化 CI/CD

### GitHub Actions 示例

创建 `.github/workflows/docker.yml`：

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: ./back
        push: true
        tags: |
          ${{ secrets.DOCKER_USERNAME }}/membuddy-api:latest
          ${{ secrets.DOCKER_USERNAME }}/membuddy-api:${{ github.sha }}
```

## 注意事项

1. **环境变量安全**：不要在镜像中包含敏感信息
2. **镜像大小**：当前镜像约 200MB，已经过优化
3. **版本控制**：建议使用语义化版本号
4. **私有仓库**：如需私有，可使用 Docker Hub 私有仓库或其他服务

## 故障排除

### 推送失败

```bash
# 检查登录状态
docker info | grep Username

# 重新登录
docker logout
docker login
```

### 权限问题

确保你有推送到指定仓库的权限，或者仓库名称正确。