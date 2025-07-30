#!/bin/bash

# Claw Cloud Run Nginx 代理部署脚本
# 专门用于部署 Gemini API 代理服务

set -e

# 配置变量
IMAGE_NAME="membuddy-nginx-proxy"
TAG="latest"
CONTAINER_NAME="nginx-gemini-proxy"
PORT="80"

echo "🚀 开始部署 Nginx Gemini 代理到 Claw Cloud Run..."

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 守护进程未运行，请先启动 Docker"
    exit 1
fi

# 构建 Docker 镜像
echo "📦 构建 Docker 镜像..."
docker build -t $IMAGE_NAME:$TAG .

echo "✅ Docker 镜像构建完成！"
echo ""
echo "📋 部署信息:"
echo "镜像名称: $IMAGE_NAME:$TAG"
echo "容器名称: $CONTAINER_NAME"
echo "端口: $PORT"
echo ""
echo "🔧 Claw Cloud Run 部署步骤:"
echo "1. 登录 Claw Cloud Run 控制台"
echo "2. 创建新的容器实例"
echo "3. 上传或推送镜像: $IMAGE_NAME:$TAG"
echo "4. 配置端口映射: $PORT"
echo "5. 设置健康检查路径: /nginx-health"
echo ""
echo "🌐 服务路径:"
echo "- 健康检查: http://your-domain/nginx-health"
echo "- 微信验证: http://your-domain/MP_verify_mluLfyNcp0fnRTDW.txt"
echo "- Gemini 代理: http://your-domain/gemini-proxy/"
echo ""
echo "⚙️  后端配置:"
echo "在阿里云后端服务中设置环境变量:"
echo "GEMINI_BASE_URL=http://your-claw-domain/gemini-proxy"
echo ""
echo "📝 注意事项:"
echo "- 确保 Claw Cloud Run 实例可以访问 generativelanguage.googleapis.com"
echo "- 记录部署后的域名，用于配置后端服务"
echo "- 建议设置自动重启策略"