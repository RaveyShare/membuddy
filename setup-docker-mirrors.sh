#!/bin/bash

# MemBuddy Docker 镜像加速器配置脚本
# 用于配置阿里云等国内镜像源，解决Docker镜像拉取慢的问题

set -e

# 颜色定义
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

# 检查操作系统
check_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    else
        log_error "不支持的操作系统: $OSTYPE"
        exit 1
    fi
    log_info "检测到操作系统: $OS"
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    log_success "Docker 已安装"
}

# 配置Docker镜像加速器 - Linux
setup_docker_mirrors_linux() {
    log_info "配置 Linux Docker 镜像加速器..."
    
    # 创建docker目录
    sudo mkdir -p /etc/docker
    
    # 备份现有配置
    if [ -f "/etc/docker/daemon.json" ]; then
        sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.backup.$(date +%Y%m%d_%H%M%S)
        log_info "已备份现有配置文件"
    fi
    
    # 复制新配置
    sudo cp docker-daemon.json /etc/docker/daemon.json
    
    # 重启Docker服务
    log_info "重启 Docker 服务..."
    sudo systemctl daemon-reload
    sudo systemctl restart docker
    
    log_success "Linux Docker 镜像加速器配置完成"
}

# 配置Docker镜像加速器 - macOS
setup_docker_mirrors_macos() {
    log_info "配置 macOS Docker 镜像加速器..."
    
    log_warning "macOS 用户请手动配置 Docker Desktop:"
    echo "1. 打开 Docker Desktop"
    echo "2. 点击设置图标 (齿轮)"
    echo "3. 选择 'Docker Engine'"
    echo "4. 在配置中添加以下内容:"
    echo ""
    cat docker-daemon.json
    echo ""
    echo "5. 点击 'Apply & Restart'"
    echo ""
    
    read -p "配置完成后按 Enter 继续..."
    log_success "macOS Docker 镜像加速器配置完成"
}

# 验证配置
verify_configuration() {
    log_info "验证 Docker 配置..."
    
    # 检查Docker是否正常运行
    if docker info > /dev/null 2>&1; then
        log_success "Docker 服务运行正常"
    else
        log_error "Docker 服务异常，请检查配置"
        return 1
    fi
    
    # 显示镜像源配置
    log_info "当前镜像源配置:"
    docker info | grep -A 10 "Registry Mirrors" || log_warning "未找到镜像源配置信息"
}

# 测试镜像拉取
test_image_pull() {
    log_info "测试镜像拉取速度..."
    
    echo "测试拉取 hello-world 镜像..."
    time docker pull hello-world
    
    if [ $? -eq 0 ]; then
        log_success "镜像拉取测试成功"
    else
        log_error "镜像拉取测试失败"
    fi
}

# 显示使用说明
show_usage() {
    echo "MemBuddy Docker 镜像加速器配置脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  setup    配置镜像加速器"
    echo "  verify   验证配置"
    echo "  test     测试镜像拉取"
    echo "  help     显示帮助信息"
    echo ""
}

# 主函数
main() {
    case "${1:-setup}" in
        "setup")
            log_info "开始配置 Docker 镜像加速器..."
            check_os
            check_docker
            
            if [ "$OS" = "linux" ]; then
                setup_docker_mirrors_linux
            elif [ "$OS" = "macos" ]; then
                setup_docker_mirrors_macos
            fi
            
            verify_configuration
            log_success "Docker 镜像加速器配置完成！"
            ;;
        "verify")
            check_docker
            verify_configuration
            ;;
        "test")
            check_docker
            test_image_pull
            ;;
        "help")
            show_usage
            ;;
        *)
            log_error "未知选项: $1"
            show_usage
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"