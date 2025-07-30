#!/bin/bash

# 微信服务启动脚本

echo "启动微信认证服务..."

# 检查是否存在.env文件
if [ ! -f ".env" ]; then
    echo "警告: .env文件不存在，请复制.env.example并配置相关参数"
    echo "cp .env.example .env"
    exit 1
fi

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "错误: Python3未安装"
    exit 1
fi

# 安装依赖
echo "安装依赖包..."
pip3 install -r requirements.txt

# 启动服务
echo "启动服务在端口8000..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload