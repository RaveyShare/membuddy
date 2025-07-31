#!/bin/bash

# MemBuddy 国内版一键部署脚本
# 使用国产大模型，部署到国内云服务

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置变量
APP_NAME="membuddy-china"
APP_DIR="/opt/${APP_NAME}"
DOCKER_IMAGE="${APP_NAME}:latest"
CONTAINER_NAME="${APP_NAME}-container"
PORT=8000
REGION="china"

# 显示帮助信息
show_help() {
    echo "MemBuddy 国内版部署脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  init        初始化服务器环境"
    echo "  deploy      部署应用"
    echo "  update      更新应用"
    echo "  start       启动服务"
    echo "  stop        停止服务"
    echo "  restart     重启服务"
    echo "  status      查看服务状态"
    echo "  logs        查看日志"
    echo "  config      配置环境变量"
    echo "  validate    验证配置"
    echo "  backup      备份数据"
    echo "  help        显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 init     # 初始化服务器"
    echo "  $0 deploy   # 部署应用"
    echo "  $0 status   # 查看状态"
}

# 检查系统
check_system() {
    log_info "检查系统环境..."
    
    # 检查操作系统
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        log_success "检测到 Linux 系统"
    else
        log_error "此脚本仅支持 Linux 系统"
        exit 1
    fi
    
    # 检查是否为 root 用户
    if [[ $EUID -eq 0 ]]; then
        log_warning "建议使用非 root 用户运行此脚本"
    fi
    
    # 检查网络连接
    if ping -c 1 baidu.com &> /dev/null; then
        log_success "网络连接正常"
    else
        log_error "网络连接失败，请检查网络设置"
        exit 1
    fi
}

# 安装依赖
install_dependencies() {
    log_info "安装系统依赖..."
    
    # 更新包管理器
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y curl wget git unzip
    elif command -v yum &> /dev/null; then
        sudo yum update -y
        sudo yum install -y curl wget git unzip
    else
        log_error "不支持的包管理器"
        exit 1
    fi
    
    log_success "系统依赖安装完成"
}

# 安装 Docker
install_docker() {
    if command -v docker &> /dev/null; then
        log_success "Docker 已安装"
        return
    fi
    
    log_info "安装 Docker..."
    
    # 使用阿里云 Docker 镜像源
    curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable"
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # 配置 Docker 镜像加速器
    sudo mkdir -p /etc/docker
    sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://registry.cn-hangzhou.aliyuncs.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
EOF
    
    # 启动 Docker 服务
    sudo systemctl enable docker
    sudo systemctl start docker
    
    # 将当前用户添加到 docker 组
    sudo usermod -aG docker $USER
    
    log_success "Docker 安装完成"
    log_warning "请重新登录以使 Docker 组权限生效"
}

# 安装 Docker Compose
install_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        log_success "Docker Compose 已安装"
        return
    fi
    
    log_info "安装 Docker Compose..."
    
    # 使用国内镜像源下载
    sudo curl -L "https://get.daocloud.io/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    log_success "Docker Compose 安装完成"
}

# 安装 Nginx
install_nginx() {
    if command -v nginx &> /dev/null; then
        log_success "Nginx 已安装"
        return
    fi
    
    log_info "安装 Nginx..."
    
    if command -v apt-get &> /dev/null; then
        sudo apt-get install -y nginx
    elif command -v yum &> /dev/null; then
        sudo yum install -y nginx
    fi
    
    sudo systemctl enable nginx
    sudo systemctl start nginx
    
    log_success "Nginx 安装完成"
}

# 初始化环境
init_environment() {
    log_info "初始化部署环境..."
    
    check_system
    install_dependencies
    install_docker
    install_docker_compose
    install_nginx
    
    # 创建应用目录
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
    
    log_success "环境初始化完成"
}

# 克隆代码
clone_repository() {
    log_info "克隆代码仓库..."
    
    if [ -d "$APP_DIR/.git" ]; then
        log_info "代码仓库已存在，更新代码..."
        cd $APP_DIR
        git pull origin main
    else
        log_info "克隆新的代码仓库..."
        git clone https://github.com/RaveyShare/membuddy.git $APP_DIR
        cd $APP_DIR
    fi
    
    log_success "代码更新完成"
}

# 配置环境变量
setup_environment_variables() {
    log_info "配置环境变量..."
    
    cd $APP_DIR/back
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.china.example" ]; then
            cp .env.china.example .env
            log_info "已复制国内版环境变量模板"
        else
            log_error "未找到国内版环境变量模板文件"
            exit 1
        fi
    fi
    
    # 设置区域和语言
    sed -i "s/REGION=.*/REGION=china/g" .env
    sed -i "s/LANGUAGE=.*/LANGUAGE=zh-CN/g" .env
    
    log_warning "请编辑 $APP_DIR/back/.env 文件，配置以下必要参数："
    echo "  - 数据库配置 (SUPABASE_*)"
    echo "  - 通义千问 API 密钥 (QWEN_API_KEY)"
    echo "  - 阿里云 TTS 配置 (ALIYUN_TTS_*)"
    echo "  - 微信配置 (WECHAT_*)"
    echo "  - 前端域名 (FRONTEND_URL)"
    
    read -p "配置完成后按 Enter 继续..."
}

# 构建 Docker 镜像
build_docker_image() {
    log_info "构建 Docker 镜像..."
    
    cd $APP_DIR/back
    
    # 构建镜像
    docker build -t $DOCKER_IMAGE .
    
    log_success "Docker 镜像构建完成"
}

# 启动服务
start_service() {
    log_info "启动应用服务..."
    
    # 停止现有容器
    if docker ps -a | grep -q $CONTAINER_NAME; then
        docker stop $CONTAINER_NAME || true
        docker rm $CONTAINER_NAME || true
    fi
    
    # 启动新容器
    docker run -d \
        --name $CONTAINER_NAME \
        --restart unless-stopped \
        -p $PORT:8000 \
        --env-file $APP_DIR/back/.env \
        -v $APP_DIR/back/service-account-key.json:/app/service-account-key.json:ro \
        $DOCKER_IMAGE
    
    log_success "应用服务启动完成"
}

# 配置 Nginx
setup_nginx() {
    log_info "配置 Nginx 反向代理..."
    
    # 创建 Nginx 配置文件
    sudo tee /etc/nginx/sites-available/$APP_NAME <<EOF
server {
    listen 80;
    server_name _;
    
    client_max_body_size 100M;
    
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    # 启用站点
    sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # 测试配置
    sudo nginx -t
    
    # 重载 Nginx
    sudo systemctl reload nginx
    
    log_success "Nginx 配置完成"
}

# 部署应用
deploy_application() {
    log_info "开始部署 MemBuddy 国内版..."
    
    clone_repository
    setup_environment_variables
    build_docker_image
    start_service
    setup_nginx
    
    log_success "MemBuddy 国内版部署完成！"
    log_info "访问地址: http://$(curl -s ifconfig.me)"
}

# 更新应用
update_application() {
    log_info "更新应用..."
    
    clone_repository
    build_docker_image
    start_service
    
    log_success "应用更新完成"
}

# 查看服务状态
check_status() {
    log_info "检查服务状态..."
    
    echo "=== Docker 容器状态 ==="
    docker ps -a | grep $CONTAINER_NAME || echo "容器未运行"
    
    echo "\n=== Nginx 状态 ==="
    sudo systemctl status nginx --no-pager -l
    
    echo "\n=== 端口监听状态 ==="
    sudo netstat -tlnp | grep :$PORT || echo "端口 $PORT 未监听"
    sudo netstat -tlnp | grep :80 || echo "端口 80 未监听"
    
    echo "\n=== 磁盘使用情况 ==="
    df -h $APP_DIR
    
    echo "\n=== 内存使用情况 ==="
    free -h
}

# 查看日志
view_logs() {
    log_info "查看应用日志..."
    
    if docker ps | grep -q $CONTAINER_NAME; then
        docker logs -f --tail=100 $CONTAINER_NAME
    else
        log_error "容器未运行"
        exit 1
    fi
}

# 停止服务
stop_service() {
    log_info "停止服务..."
    
    if docker ps | grep -q $CONTAINER_NAME; then
        docker stop $CONTAINER_NAME
        log_success "服务已停止"
    else
        log_warning "服务未运行"
    fi
}

# 重启服务
restart_service() {
    log_info "重启服务..."
    
    stop_service
    sleep 2
    
    if docker ps -a | grep -q $CONTAINER_NAME; then
        docker start $CONTAINER_NAME
        log_success "服务已重启"
    else
        log_error "容器不存在，请先部署应用"
        exit 1
    fi
}

# 验证配置
validate_configuration() {
    log_info "验证配置..."
    
    cd $APP_DIR/back
    
    if [ ! -f ".env" ]; then
        log_error "环境变量文件不存在"
        exit 1
    fi
    
    # 检查必要的环境变量
    required_vars=("QWEN_API_KEY" "ALIYUN_TTS_ACCESS_KEY" "SUPABASE_URL")
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env || grep -q "^$var=$" .env || grep -q "^$var=your-" .env; then
            log_error "环境变量 $var 未正确配置"
            exit 1
        fi
    done
    
    log_success "配置验证通过"
}

# 备份数据
backup_data() {
    log_info "备份应用数据..."
    
    backup_dir="/opt/backups/membuddy-china"
    backup_file="$backup_dir/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    sudo mkdir -p $backup_dir
    
    # 备份配置文件和数据
    sudo tar -czf $backup_file \
        -C $APP_DIR \
        back/.env \
        back/service-account-key.json \
        || true
    
    log_success "备份完成: $backup_file"
}

# 主函数
main() {
    case "${1:-help}" in
        init)
            init_environment
            ;;
        deploy)
            deploy_application
            ;;
        update)
            update_application
            ;;
        start)
            start_service
            ;;
        stop)
            stop_service
            ;;
        restart)
            restart_service
            ;;
        status)
            check_status
            ;;
        logs)
            view_logs
            ;;
        config)
            setup_environment_variables
            ;;
        validate)
            validate_configuration
            ;;
        backup)
            backup_data
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"