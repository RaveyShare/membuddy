#!/bin/bash

# MemBuddy 本地开发环境快速设置脚本
# 使用方法：./setup-local-dev.sh [backend|frontend|all]

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

# 检查系统要求
check_system() {
    log_info "检查系统要求..."
    
    # 检查操作系统
    case "$(uname -s)" in
        Darwin*)
            OS="macOS"
            ;;
        Linux*)
            OS="Linux"
            ;;
        CYGWIN*|MINGW*|MSYS*)
            OS="Windows"
            ;;
        *)
            log_error "不支持的操作系统: $(uname -s)"
            exit 1
            ;;
    esac
    
    log_success "操作系统: $OS"
}

# 检查并安装 Python
check_python() {
    log_info "检查 Python 环境..."
    
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        log_success "Python 已安装: $PYTHON_VERSION"
        
        # 检查版本是否满足要求 (>= 3.8)
        if python3 -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)"; then
            log_success "Python 版本满足要求"
        else
            log_error "Python 版本过低，需要 3.8 或更高版本"
            exit 1
        fi
    else
        log_error "未找到 Python 3，请先安装 Python 3.8+"
        case $OS in
            "macOS")
                log_info "安装建议: brew install python@3.11"
                ;;
            "Linux")
                log_info "安装建议: sudo apt install python3 python3-pip python3-venv"
                ;;
            "Windows")
                log_info "请从 https://python.org 下载安装 Python"
                ;;
        esac
        exit 1
    fi
}

# 检查并安装 Node.js
check_nodejs() {
    log_info "检查 Node.js 环境..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_success "Node.js 已安装: $NODE_VERSION"
        
        # 检查版本是否满足要求 (>= 18)
        NODE_MAJOR=$(node --version | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -ge 18 ]; then
            log_success "Node.js 版本满足要求"
        else
            log_error "Node.js 版本过低，需要 18 或更高版本"
            exit 1
        fi
    else
        log_error "未找到 Node.js，请先安装 Node.js 18+"
        case $OS in
            "macOS")
                log_info "安装建议: brew install node"
                ;;
            "Linux")
                log_info "安装建议: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
                ;;
            "Windows")
                log_info "请从 https://nodejs.org 下载安装 Node.js"
                ;;
        esac
        exit 1
    fi
}

# 检查并安装 pnpm
check_pnpm() {
    log_info "检查 pnpm..."
    
    if command -v pnpm &> /dev/null; then
        PNPM_VERSION=$(pnpm --version)
        log_success "pnpm 已安装: $PNPM_VERSION"
    else
        log_info "安装 pnpm..."
        npm install -g pnpm
        log_success "pnpm 安装完成"
    fi
}

# 设置后端环境
setup_backend() {
    log_info "设置后端开发环境..."
    
    cd back
    
    # 创建虚拟环境
    if [[ ! -d ".venv" ]]; then
        log_info "创建 Python 虚拟环境..."
        python3 -m venv .venv
        log_success "虚拟环境创建完成"
    else
        log_warning "虚拟环境已存在，跳过创建"
    fi
    
    # 激活虚拟环境
    log_info "激活虚拟环境..."
    source .venv/bin/activate
    
    # 升级 pip
    log_info "升级 pip..."
    pip install --upgrade pip
    
    # 安装依赖
    log_info "安装 Python 依赖..."
    pip install -r requirements.txt
    
    # 配置环境变量
    if [[ ! -f ".env" ]]; then
        log_info "创建环境变量文件..."
        cp .env.example .env
        log_warning "请编辑 back/.env 文件，配置你的开发环境变量"
    else
        log_warning "环境变量文件已存在"
    fi
    
    # 检查 Google Cloud 服务账号密钥
    if [[ ! -f "service-account-key.json" ]]; then
        log_warning "未找到 Google Cloud 服务账号密钥文件"
        log_warning "请将 service-account-key.json 文件放置在 back/ 目录下"
    fi
    
    cd ..
    log_success "后端环境设置完成"
}

# 设置前端环境
setup_frontend() {
    log_info "设置前端开发环境..."
    
    cd front
    
    # 安装依赖
    log_info "安装前端依赖..."
    pnpm install
    
    # 配置环境变量
    if [[ ! -f ".env.local" ]]; then
        log_info "创建环境变量文件..."
        cp .env.example .env.local
        log_warning "请编辑 front/.env.local 文件，配置你的开发环境变量"
    else
        log_warning "环境变量文件已存在"
    fi
    
    cd ..
    log_success "前端环境设置完成"
}

# 启动开发服务器
start_dev_servers() {
    log_info "启动开发服务器..."
    
    # 检查是否有 tmux 或 screen
    if command -v tmux &> /dev/null; then
        TERMINAL_MULTIPLEXER="tmux"
    elif command -v screen &> /dev/null; then
        TERMINAL_MULTIPLEXER="screen"
    else
        log_warning "建议安装 tmux 或 screen 来管理多个终端会话"
        TERMINAL_MULTIPLEXER="none"
    fi
    
    if [[ "$TERMINAL_MULTIPLEXER" == "tmux" ]]; then
        # 使用 tmux 启动服务
        log_info "使用 tmux 启动开发服务器..."
        
        # 创建新的 tmux 会话
        tmux new-session -d -s membuddy
        
        # 启动后端服务
        tmux send-keys -t membuddy "cd back && source .venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000" Enter
        
        # 创建新窗口启动前端服务
        tmux new-window -t membuddy
        tmux send-keys -t membuddy "cd front && pnpm dev" Enter
        
        log_success "开发服务器已在 tmux 会话 'membuddy' 中启动"
        log_info "使用 'tmux attach -t membuddy' 连接到会话"
        log_info "使用 Ctrl+B, D 分离会话"
        log_info "使用 'tmux kill-session -t membuddy' 停止所有服务"
        
    elif [[ "$TERMINAL_MULTIPLEXER" == "screen" ]]; then
        # 使用 screen 启动服务
        log_info "使用 screen 启动开发服务器..."
        
        # 启动后端服务
        screen -dmS membuddy-backend bash -c "cd back && source .venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
        
        # 启动前端服务
        screen -dmS membuddy-frontend bash -c "cd front && pnpm dev"
        
        log_success "开发服务器已在 screen 会话中启动"
        log_info "使用 'screen -r membuddy-backend' 连接到后端会话"
        log_info "使用 'screen -r membuddy-frontend' 连接到前端会话"
        
    else
        # 手动启动说明
        log_info "请手动在不同终端中启动服务:"
        echo ""
        echo "终端 1 - 后端服务:"
        echo "  cd back"
        echo "  source .venv/bin/activate"
        echo "  uvicorn main:app --reload --host 0.0.0.0 --port 8000"
        echo ""
        echo "终端 2 - 前端服务:"
        echo "  cd front"
        echo "  pnpm dev"
        echo ""
    fi
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 5
    
    # 检查服务状态
    check_dev_services
}

# 检查开发服务状态
check_dev_services() {
    log_info "检查开发服务状态..."
    
    # 检查后端服务
    if curl -f http://localhost:8000/health &>/dev/null; then
        log_success "后端服务运行正常: http://localhost:8000"
    else
        log_warning "后端服务可能未启动或启动失败"
    fi
    
    # 检查前端服务
    if curl -f http://localhost:3000 &>/dev/null; then
        log_success "前端服务运行正常: http://localhost:3000"
    else
        log_warning "前端服务可能未启动或启动失败"
    fi
}

# 停止开发服务器
stop_dev_servers() {
    log_info "停止开发服务器..."
    
    # 停止 tmux 会话
    if tmux has-session -t membuddy 2>/dev/null; then
        tmux kill-session -t membuddy
        log_success "tmux 会话已停止"
    fi
    
    # 停止 screen 会话
    if screen -list | grep -q membuddy-backend; then
        screen -S membuddy-backend -X quit
        log_success "后端 screen 会话已停止"
    fi
    
    if screen -list | grep -q membuddy-frontend; then
        screen -S membuddy-frontend -X quit
        log_success "前端 screen 会话已停止"
    fi
    
    # 杀死可能残留的进程
    pkill -f "uvicorn main:app" || true
    pkill -f "pnpm dev" || true
    pkill -f "next dev" || true
    
    log_success "开发服务器已停止"
}

# 运行测试
run_tests() {
    log_info "运行测试..."
    
    # 后端测试
    if [[ -f "back/pytest.ini" ]] || [[ -f "back/pyproject.toml" ]]; then
        log_info "运行后端测试..."
        cd back
        source .venv/bin/activate
        python -m pytest
        cd ..
        log_success "后端测试完成"
    else
        log_warning "未找到后端测试配置"
    fi
    
    # 前端测试
    if [[ -f "front/package.json" ]] && grep -q "test" front/package.json; then
        log_info "运行前端测试..."
        cd front
        pnpm test
        cd ..
        log_success "前端测试完成"
    else
        log_warning "未找到前端测试配置"
    fi
}

# 构建生产版本
build_production() {
    log_info "构建生产版本..."
    
    # 构建后端 Docker 镜像
    log_info "构建后端 Docker 镜像..."
    cd back
    docker build -t membuddy-backend .
    cd ..
    log_success "后端镜像构建完成"
    
    # 构建前端
    log_info "构建前端..."
    cd front
    pnpm build
    cd ..
    log_success "前端构建完成"
}

# 部署到阿里云
deploy_to_aliyun() {
    log_info "准备部署到阿里云..."
    
    # 检查部署脚本
    if [[ ! -f "deploy-aliyun.sh" ]]; then
        log_error "未找到阿里云部署脚本"
        exit 1
    fi
    
    # 提示用户确认
    read -p "确认要部署到阿里云吗? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
    
    # 检查环境变量
    if [[ ! -f "back/.env" ]]; then
        log_error "请先配置 back/.env 文件"
        exit 1
    fi
    
    # 提交代码
    log_info "提交最新代码..."
    git add .
    git commit -m "feat: 准备部署到阿里云" || log_warning "没有新的更改需要提交"
    git push origin main
    
    log_success "代码已推送到远程仓库"
    log_info "请在阿里云服务器上运行: ./deploy-aliyun.sh update"
}

# 显示帮助信息
show_help() {
    echo "MemBuddy 本地开发环境设置脚本"
    echo ""
    echo "使用方法:"
    echo "  ./setup-local-dev.sh backend    - 仅设置后端环境"
    echo "  ./setup-local-dev.sh frontend   - 仅设置前端环境"
    echo "  ./setup-local-dev.sh all        - 设置完整开发环境"
    echo "  ./setup-local-dev.sh start      - 启动开发服务器"
    echo "  ./setup-local-dev.sh stop       - 停止开发服务器"
    echo "  ./setup-local-dev.sh status     - 检查服务状态"
    echo "  ./setup-local-dev.sh test       - 运行测试"
    echo "  ./setup-local-dev.sh build      - 构建生产版本"
    echo "  ./setup-local-dev.sh deploy     - 部署到阿里云"
    echo "  ./setup-local-dev.sh help       - 显示帮助信息"
    echo ""
    echo "开发流程:"
    echo "  1. 首次设置: ./setup-local-dev.sh all"
    echo "  2. 配置环境变量: 编辑 back/.env 和 front/.env.local"
    echo "  3. 启动服务: ./setup-local-dev.sh start"
    echo "  4. 开发调试: 访问 http://localhost:3000"
    echo "  5. 运行测试: ./setup-local-dev.sh test"
    echo "  6. 部署上线: ./setup-local-dev.sh deploy"
}

# 主函数
main() {
    case "${1:-help}" in
        "backend")
            check_system
            check_python
            setup_backend
            ;;
        "frontend")
            check_system
            check_nodejs
            check_pnpm
            setup_frontend
            ;;
        "all")
            check_system
            check_python
            check_nodejs
            check_pnpm
            setup_backend
            setup_frontend
            log_success "开发环境设置完成"
            log_info "请配置环境变量后运行: ./setup-local-dev.sh start"
            ;;
        "start")
            start_dev_servers
            ;;
        "stop")
            stop_dev_servers
            ;;
        "status")
            check_dev_services
            ;;
        "test")
            run_tests
            ;;
        "build")
            build_production
            ;;
        "deploy")
            deploy_to_aliyun
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