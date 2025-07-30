#!/bin/bash

# MemBuddy 阿里云一键部署脚本
# 使用方法：./deploy-aliyun.sh [init|deploy|update]

set -e  # 遇到错误立即退出

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
APP_NAME="membuddy-api"
APP_DIR="/opt/membuddy"
NGINX_SITE="membuddy-api"
GIT_REPO="https://github.com/RaveyShare/membuddy.git"

# 检查是否为 root 用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "请不要使用 root 用户运行此脚本"
        exit 1
    fi
}

# 检查系统要求
check_system() {
    log_info "检查系统要求..."
    
    # 检查操作系统
    if [[ ! -f /etc/os-release ]]; then
        log_error "不支持的操作系统"
        exit 1
    fi
    
    source /etc/os-release
    if [[ "$ID" != "ubuntu" ]] && [[ "$ID" != "debian" ]]; then
        log_error "仅支持 Ubuntu 和 Debian 系统"
        exit 1
    fi
    
    log_success "系统检查通过: $PRETTY_NAME"
}

# 安装系统依赖
install_dependencies() {
    log_info "安装系统依赖..."
    
    # 更新包列表
    sudo apt update
    
    # 安装基础工具
    sudo apt install -y curl wget git vim unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    
    log_success "系统依赖安装完成"
}

# 安装 Docker
install_docker() {
    log_info "安装 Docker..."
    
    if command -v docker &> /dev/null; then
        log_warning "Docker 已安装，跳过安装步骤"
        return
    fi
    
    # 添加 Docker 官方 GPG 密钥
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # 添加 Docker 仓库
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # 安装 Docker
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # 启动 Docker 服务
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # 将当前用户添加到 docker 组
    sudo usermod -aG docker $USER
    
    log_success "Docker 安装完成"
    log_warning "请重新登录以使 Docker 组权限生效"
}

# 安装 Nginx
install_nginx() {
    log_info "安装 Nginx..."
    
    if command -v nginx &> /dev/null; then
        log_warning "Nginx 已安装，跳过安装步骤"
        return
    fi
    
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    log_success "Nginx 安装完成"
}

# 安装 Certbot (SSL 证书)
install_certbot() {
    log_info "安装 Certbot..."
    
    if command -v certbot &> /dev/null; then
        log_warning "Certbot 已安装，跳过安装步骤"
        return
    fi
    
    sudo apt install -y certbot python3-certbot-nginx
    
    log_success "Certbot 安装完成"
}

# 创建应用目录
setup_app_directory() {
    log_info "创建应用目录..."
    
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
    
    log_success "应用目录创建完成: $APP_DIR"
}

# 克隆代码
clone_repository() {
    log_info "克隆代码仓库..."
    
    if [[ -d "$APP_DIR/.git" ]]; then
        log_warning "代码已存在，执行更新..."
        cd $APP_DIR
        git pull origin main
    else
        git clone $GIT_REPO $APP_DIR
        cd $APP_DIR
    fi
    
    log_success "代码克隆/更新完成"
}

# 配置环境变量
setup_environment() {
    log_info "配置环境变量..."
    
    cd $APP_DIR/back
    
    if [[ ! -f ".env" ]]; then
        cp .env.aliyun.example .env
        log_warning "请编辑 $APP_DIR/back/.env 文件，配置你的环境变量"
        log_warning "配置完成后，请重新运行: ./deploy-aliyun.sh deploy"
        
        # 打开编辑器
        read -p "是否现在编辑环境变量文件? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-vim} .env
        else
            log_error "请手动编辑 $APP_DIR/back/.env 文件后重新运行部署"
            exit 1
        fi
    fi
    
    log_success "环境变量配置完成"
}

# 构建 Docker 镜像
build_docker_image() {
    log_info "构建 Docker 镜像..."
    
    cd $APP_DIR/back
    
    # 停止并删除旧容器
    if docker ps -a --format 'table {{.Names}}' | grep -q "^$APP_NAME$"; then
        log_info "停止旧容器..."
        docker stop $APP_NAME || true
        docker rm $APP_NAME || true
    fi
    
    # 构建新镜像
    docker build -t $APP_NAME .
    
    log_success "Docker 镜像构建完成"
}

# 启动应用容器
start_container() {
    log_info "启动应用容器..."
    
    cd $APP_DIR/back
    
    # 检查 Google Cloud 服务账号密钥文件
    if [[ ! -f "service-account-key.json" ]]; then
        log_warning "未找到 Google Cloud 服务账号密钥文件"
        log_warning "请将 service-account-key.json 文件放置在 $APP_DIR/back/ 目录下"
        
        read -p "是否继续启动容器? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # 启动容器
    docker run -d \
        --name $APP_NAME \
        --restart unless-stopped \
        -p 8000:8000 \
        --env-file .env \
        $(if [[ -f "service-account-key.json" ]]; then echo "-v $(pwd)/service-account-key.json:/app/google-credentials.json:ro"; fi) \
        $APP_NAME
    
    # 等待容器启动
    sleep 5
    
    # 检查容器状态
    if docker ps --format 'table {{.Names}}' | grep -q "^$APP_NAME$"; then
        log_success "应用容器启动成功"
    else
        log_error "应用容器启动失败"
        docker logs $APP_NAME
        exit 1
    fi
}

# 配置 Nginx
setup_nginx() {
    log_info "配置 Nginx..."
    
    read -p "请输入你的后端域名 (例如: api.yourdomain.com): " BACKEND_DOMAIN
    
    if [[ -z "$BACKEND_DOMAIN" ]]; then
        log_error "域名不能为空"
        exit 1
    fi
    
    # 创建 Nginx 配置文件
    sudo tee /etc/nginx/sites-available/$NGINX_SITE > /dev/null <<EOF
server {
    listen 80;
    server_name $BACKEND_DOMAIN;
    
    # API 代理
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS 配置
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
        
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # 健康检查
    location /health {
        proxy_pass http://localhost:8000/health;
        access_log off;
    }
}
EOF
    
    # 启用站点
    sudo ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/
    
    # 测试 Nginx 配置
    sudo nginx -t
    
    # 重载 Nginx
    sudo systemctl reload nginx
    
    log_success "Nginx 配置完成"
    
    # 询问是否配置 SSL
    read -p "是否配置 SSL 证书? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_ssl $BACKEND_DOMAIN
    fi
}

# 配置 SSL 证书
setup_ssl() {
    local domain=$1
    log_info "配置 SSL 证书..."
    
    # 获取 SSL 证书
    sudo certbot --nginx -d $domain --non-interactive --agree-tos --email admin@$domain
    
    # 设置自动续期
    (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -
    
    log_success "SSL 证书配置完成"
}

# 检查服务状态
check_service() {
    log_info "检查服务状态..."
    
    # 检查 Docker 容器
    if docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -q "^$APP_NAME"; then
        log_success "Docker 容器运行正常"
        docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep $APP_NAME
    else
        log_error "Docker 容器未运行"
        return 1
    fi
    
    # 检查 Nginx
    if sudo systemctl is-active --quiet nginx; then
        log_success "Nginx 服务运行正常"
    else
        log_error "Nginx 服务未运行"
        return 1
    fi
    
    # 检查应用健康状态
    if curl -f http://localhost:8000/health &>/dev/null; then
        log_success "应用健康检查通过"
    else
        log_warning "应用健康检查失败，请检查日志"
    fi
}

# 显示日志
show_logs() {
    log_info "显示应用日志..."
    docker logs -f $APP_NAME
}

# 更新部署
update_deployment() {
    log_info "更新部署..."
    
    cd $APP_DIR
    
    # 拉取最新代码
    git pull origin main
    
    # 重新构建和启动
    build_docker_image
    start_container
    
    # 检查服务状态
    check_service
    
    log_success "部署更新完成"
}

# 初始化环境
init_environment() {
    log_info "开始初始化阿里云 ECS 环境..."
    
    check_root
    check_system
    install_dependencies
    install_docker
    install_nginx
    install_certbot
    setup_app_directory
    
    log_success "环境初始化完成"
    log_info "请重新登录以使 Docker 组权限生效，然后运行: ./deploy-aliyun.sh deploy"
}

# 部署应用
deploy_application() {
    log_info "开始部署应用..."
    
    clone_repository
    setup_environment
    build_docker_image
    start_container
    setup_nginx
    check_service
    
    log_success "应用部署完成"
    log_info "你可以通过以下命令查看日志: ./deploy-aliyun.sh logs"
}

# 显示帮助信息
show_help() {
    echo "MemBuddy 阿里云一键部署脚本"
    echo ""
    echo "使用方法:"
    echo "  ./deploy-aliyun.sh init     - 初始化服务器环境"
    echo "  ./deploy-aliyun.sh deploy   - 部署应用"
    echo "  ./deploy-aliyun.sh update   - 更新部署"
    echo "  ./deploy-aliyun.sh status   - 检查服务状态"
    echo "  ./deploy-aliyun.sh logs     - 查看应用日志"
    echo "  ./deploy-aliyun.sh help     - 显示帮助信息"
    echo ""
    echo "部署步骤:"
    echo "  1. 首次部署请先运行: ./deploy-aliyun.sh init"
    echo "  2. 重新登录服务器"
    echo "  3. 运行: ./deploy-aliyun.sh deploy"
    echo "  4. 根据提示配置环境变量和域名"
}

# 主函数
main() {
    case "${1:-help}" in
        "init")
            init_environment
            ;;
        "deploy")
            deploy_application
            ;;
        "update")
            update_deployment
            ;;
        "status")
            check_service
            ;;
        "logs")
            show_logs
            ;;
        "help")
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