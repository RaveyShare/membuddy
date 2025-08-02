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

# 安装 Python 环境
install_python() {
    log_info "安装 Python 环境..."
    
    # 安装 Python 3.11 和相关工具
    sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
    
    # 安装 uv (更快的 Python 包管理器)
    if ! command -v uv &> /dev/null; then
        curl -LsSf https://astral.sh/uv/install.sh | sh
        source $HOME/.cargo/env
    fi
    
    log_success "Python 环境安装完成"
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

# 检测可用的 Python 版本
detect_python() {
    local python_cmd=""
    
    # 按优先级检查 Python 版本
    for cmd in python3.11 python3.10 python3.9 python3; do
        if command -v "$cmd" &> /dev/null; then
            # 检查版本是否满足要求 (>= 3.9)
            local version=$("$cmd" -c "import sys; print(sys.version_info.major * 10 + sys.version_info.minor)")
            if [[ $version -ge 39 ]]; then
                python_cmd="$cmd"
                break
            fi
        fi
    done
    
    if [[ -z "$python_cmd" ]]; then
        log_error "未找到 Python 3.9+ 版本，请先安装 Python"
        log_info "在 Ubuntu/Debian 上可以运行: sudo apt install python3.11 python3.11-venv"
        exit 1
    fi
    
    echo "$python_cmd"
}

# 设置 Python 虚拟环境
setup_python_env() {
    log_info "设置 Python 虚拟环境..."
    
    cd $APP_DIR/back
    
    # 停止旧服务
    stop_app_service
    
    # 检测可用的 Python 版本
    local python_cmd=$(detect_python)
    log_info "使用 Python 命令: $python_cmd"
    
    # 创建虚拟环境
    if [[ -d ".venv" ]]; then
        log_warning "虚拟环境已存在，删除并重新创建..."
        rm -rf .venv
    fi
    
    "$python_cmd" -m venv .venv
    source .venv/bin/activate
    
    # 安装依赖
    if command -v uv &> /dev/null; then
        uv pip install -r requirements.txt
    else
        pip install -r requirements.txt
    fi
    
    log_success "Python 虚拟环境设置完成"
}

# 停止应用服务
stop_app_service() {
    log_info "停止应用服务..."
    
    # 查找并停止 uvicorn 进程
    if pgrep -f "uvicorn.*main:app" > /dev/null; then
        pkill -f "uvicorn.*main:app"
        sleep 2
        log_success "应用服务已停止"
    else
        log_info "应用服务未运行"
    fi
}

# 启动应用服务
start_app_service() {
    log_info "启动应用服务..."
    
    cd $APP_DIR/back
    
    # 检查 Google Cloud 服务账号密钥文件
    if [[ ! -f "service-account-key.json" ]]; then
        log_warning "未找到 Google Cloud 服务账号密钥文件"
        log_warning "请将 service-account-key.json 文件放置在 $APP_DIR/back/ 目录下"
        
        read -p "是否继续启动服务? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # 激活虚拟环境
    source .venv/bin/activate
    
    # 创建 systemd 服务文件
    sudo tee /etc/systemd/system/$APP_NAME.service > /dev/null <<EOF
[Unit]
Description=MemBuddy API Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR/back
Environment=PATH=$APP_DIR/back/.venv/bin
EnvironmentFile=$APP_DIR/back/.env
ExecStart=$APP_DIR/back/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
    
    # 重新加载 systemd 并启动服务
    sudo systemctl daemon-reload
    sudo systemctl enable $APP_NAME
    sudo systemctl start $APP_NAME
    
    # 等待服务启动
    sleep 5
    
    # 检查服务状态
    if sudo systemctl is-active --quiet $APP_NAME; then
        log_success "应用服务启动成功"
    else
        log_error "应用服务启动失败"
        sudo systemctl status $APP_NAME
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
    
    # 检查项目中的 Nginx 配置模板
    local nginx_template="$APP_DIR/nginx/local-deploy.conf"
    if [[ ! -f "$nginx_template" ]]; then
        log_error "未找到 Nginx 配置模板: $nginx_template"
        exit 1
    fi
    
    # 复制并修改配置文件
    sudo cp "$nginx_template" "/etc/nginx/sites-available/$NGINX_SITE"
    
    # 替换域名占位符
    sudo sed -i "s/your-domain.com/$BACKEND_DOMAIN/g" "/etc/nginx/sites-available/$NGINX_SITE"
    
    # 启用站点
    sudo ln -sf "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-enabled/"
    
    # 删除默认站点（如果存在）
    if [[ -f "/etc/nginx/sites-enabled/default" ]]; then
        sudo rm -f "/etc/nginx/sites-enabled/default"
        log_info "已删除默认 Nginx 站点配置"
    fi
    
    # 创建日志目录
    sudo mkdir -p /var/log/nginx
    
    # 测试 Nginx 配置
    if sudo nginx -t; then
        log_success "Nginx 配置语法检查通过"
    else
        log_error "Nginx 配置语法错误，请检查配置文件"
        exit 1
    fi
    
    # 重载 Nginx
    sudo systemctl reload nginx
    
    log_success "Nginx 配置完成"
    log_info "配置文件位置: /etc/nginx/sites-available/$NGINX_SITE"
    log_info "访问地址: http://$BACKEND_DOMAIN"
    
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
    
    # 检查应用服务
    if sudo systemctl is-active --quiet $APP_NAME; then
        log_success "应用服务运行正常"
        sudo systemctl status $APP_NAME --no-pager -l
    else
        log_error "应用服务未运行"
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
    sudo journalctl -u $APP_NAME -f
}

# 更新部署
update_deployment() {
    log_info "更新部署..."
    
    cd $APP_DIR
    
    # 拉取最新代码
    git pull origin main
    
    # 重新设置环境和启动服务
    setup_python_env
    start_app_service
    
    # 更新 Nginx 配置
    setup_nginx
    
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
    install_python
    install_nginx
    install_certbot
    setup_app_directory
    
    log_success "环境初始化完成"
    log_info "环境初始化完成，现在可以运行: ./deploy-aliyun.sh deploy"
}

# 部署应用
deploy_application() {
    log_info "开始部署应用..."
    
    clone_repository
    setup_environment
    setup_python_env
    start_app_service
    setup_nginx
    check_service
    
    log_success "应用部署完成"
    log_info "你可以通过以下命令查看日志: ./deploy-aliyun.sh logs"
    log_info "你可以通过以下命令检查服务状态: ./deploy-aliyun.sh status"
}

# 显示帮助信息
show_help() {
    echo "MemBuddy 阿里云一键部署脚本 (本地部署版本)"
    echo ""
    echo "使用方法:"
    echo "  ./deploy-aliyun.sh init     - 初始化服务器环境"
    echo "  ./deploy-aliyun.sh deploy   - 部署应用"
    echo "  ./deploy-aliyun.sh update   - 更新部署"
    echo "  ./deploy-aliyun.sh status   - 检查服务状态"
    echo "  ./deploy-aliyun.sh logs     - 查看应用日志"
    echo "  ./deploy-aliyun.sh stop     - 停止应用服务"
    echo "  ./deploy-aliyun.sh help     - 显示帮助信息"
    echo ""
    echo "部署步骤:"
    echo "  1. 首次部署请先运行: ./deploy-aliyun.sh init"
    echo "  2. 运行: ./deploy-aliyun.sh deploy"
    echo "  3. 根据提示配置环境变量和域名"
    echo ""
    echo "说明:"
    echo "  - 本脚本使用 Python 虚拟环境和 systemd 服务管理"
    echo "  - 不再依赖 Docker，直接在系统上运行应用"
    echo "  - 自动配置 Nginx 反向代理和 SSL 证书"
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
        "stop")
            stop_app_service
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