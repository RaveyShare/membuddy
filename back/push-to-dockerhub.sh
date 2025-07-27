#!/bin/bash

# MemBuddy API Docker Hub 推送脚本

set -e

# 配置变量
IMAGE_NAME="membuddy-api"
DOCKER_USERNAME="${DOCKER_USERNAME:-raveyshare}"
REPO_NAME="${REPO_NAME:-membuddy}"
TAG="${TAG:-latest}"

echo "🐳 开始构建并推送 MemBuddy API 到 Docker Hub..."
echo "镜像名称: $DOCKER_USERNAME/$REPO_NAME:$TAG"
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 守护进程未运行，请先启动 Docker Desktop"
    exit 1
fi

# 检查是否已登录 Docker Hub
if ! docker info | grep -q "Username"; then
    echo "⚠️  请先登录 Docker Hub:"
    echo "docker login"
    echo ""
    read -p "是否现在登录？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker login
    else
        echo "❌ 需要先登录 Docker Hub"
        exit 1
    fi
fi

# 构建镜像
echo "📦 构建 Docker 镜像..."
docker build -t $IMAGE_NAME:$TAG .

# 标记镜像
echo "🏷️  标记镜像为 $DOCKER_USERNAME/$REPO_NAME:$TAG"
docker tag $IMAGE_NAME:$TAG $DOCKER_USERNAME/$REPO_NAME:$TAG

# 推送镜像
echo "🚀 推送镜像到 Docker Hub..."
docker push $DOCKER_USERNAME/$REPO_NAME:$TAG

echo "✅ 镜像推送完成！"
echo ""
echo "📋 镜像信息:"
echo "   仓库: https://hub.docker.com/r/$DOCKER_USERNAME/$REPO_NAME"
echo "   拉取命令: docker pull $DOCKER_USERNAME/$REPO_NAME:$TAG"
echo ""
echo "🚀 运行命令:"
echo "docker run -p 8000:8000 \\"
echo "  -e SUPABASE_URL=your_supabase_url \\"
echo "  -e SUPABASE_ANON_KEY=your_supabase_anon_key \\"
echo "  -e SUPABASE_JWT_SECRET=your_supabase_jwt_secret \\"
echo "  -e GEMINI_API_KEY=your_gemini_api_key \\"
echo "  -e GOOGLE_CLOUD_PROJECT_ID=your_project_id \\"
echo "  -e GOOGLE_CLOUD_LOCATION=your_location \\"
echo "  -v /path/to/service-account-key.json:/app/google-credentials.json:ro \\"
echo "  $DOCKER_USERNAME/$REPO_NAME:$TAG"