#!/bin/bash

# MemBuddy API Docker 构建脚本

set -e

echo "🐳 开始构建 MemBuddy API Docker 镜像..."

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 守护进程未运行，请先启动 Docker Desktop"
    exit 1
fi

# 构建镜像
echo "📦 构建 Docker 镜像..."
docker build -t membuddy-api:latest .

echo "✅ Docker 镜像构建完成！"
echo ""
echo "🚀 运行容器的命令示例："
echo "docker run -p 8000:8000 \\"
echo "  -e SUPABASE_URL=your_supabase_url \\"
echo "  -e SUPABASE_ANON_KEY=your_supabase_anon_key \\"
echo "  -e SUPABASE_JWT_SECRET=your_supabase_jwt_secret \\"
echo "  -e GEMINI_API_KEY=your_gemini_api_key \\"
echo "  membuddy-api:latest"
echo ""
echo "📚 更多信息请查看 DOCKER.md 文件"