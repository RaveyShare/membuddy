#!/bin/bash

# MemBuddy 一键发布脚本
# 支持多种部署方式：本地部署、Docker部署、阿里云部署

set -e

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="membuddy"
DOCKER_USERNAME="${DOCKER_USERNAME:-raveyshare}"
DOCKER_REPO="${DOCKER_REPO:-membuddy}"
DOCKER_TAG="${DOCKER_TAG:-latest}"
REMOTE_HOST="${REMOTE_HOST}"
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_PATH="${REMOTE_PATH:-/opt/membuddy}"

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

# 显示帮助信息
show_help() {
    cat << EOF
🚀 MemBuddy 一键发布脚本

用法: $0 [选项] <命令>

命令:
  commit          提交代码到Git仓库
  build           构建Docker镜像
  push            推送Docker镜像到Docker Hub
  deploy-local    本地部署（使用现有的deploy-aliyun.sh）
  deploy-docker   Docker部署到远程服务器
  deploy-full     完整部署（提交+构建+推送+部署）
  status          检查部署状态
  logs            查看应用日志
  help            显示此帮助信息

选项:
  -h, --host      远程服务器地址
  -u, --user      远程服务器用户名 (默认: root)
  -p, --path      远程部署路径 (默认: /opt/membuddy)
  -t, --tag       Docker镜像标签 (默认: latest)
  -m, --message   Git提交信息
  --skip-git      跳过Git操作
  --skip-build    跳过构建步骤
  --skip-push     跳过推送步骤
  --dry-run       预览操作，不实际执行

环境变量:
  DOCKER_USERNAME    Docker Hub用户名 (默认: raveyshare)
  DOCKER_REPO        Docker仓库名 (默认: membuddy)
  REMOTE_HOST        远程服务器地址
  REMOTE_USER        远程服务器用户名
  REMOTE_PATH        远程部署路径

示例:
  # 完整部署到远程服务器
  $0 -h your-server.com deploy-full
  
  # 仅构建并推送Docker镜像
  $0 build push
  
  # 本地阿里云部署
  $0 deploy-local
  
  # 使用自定义标签部署
  $0 -t v1.0.0 deploy-docker
EOF
}

# 检查必要的工具
check_requirements() {
    local missing_tools=()
    
    command -v git >/dev/null 2>&1 || missing_tools+=("git")
    command -v docker >/dev/null 2>&1 || missing_tools+=("docker")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "缺少必要工具: ${missing_tools[*]}"
        log_info "请安装缺少的工具后重试"
        exit 1
    fi
}

# 检查Docker是否运行
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker守护进程未运行，请先启动Docker"
        exit 1
    fi
}

# Git提交代码
commit_code() {
    local commit_message="${1:-自动部署提交 $(date '+%Y-%m-%d %H:%M:%S')}"
    
    log_info "检查Git状态..."
    
    # 检查是否有未提交的更改
    if git diff --quiet && git diff --staged --quiet; then
        log_warning "没有检测到代码更改"
        return 0
    fi
    
    log_info "添加文件到Git..."
    git add .
    
    log_info "提交代码: $commit_message"
    git commit -m "$commit_message"
    
    log_info "推送到远程仓库..."
    git push
    
    log_success "代码提交完成"
}

# 构建Docker镜像
build_docker() {
    log_info "构建Docker镜像..."
    
    cd "$SCRIPT_DIR/back"
    
    if [ ! -f "Dockerfile" ]; then
        log_error "未找到Dockerfile，请确保在back目录下存在Dockerfile"
        exit 1
    fi
    
    log_info "构建镜像: $DOCKER_USERNAME/$DOCKER_REPO:$DOCKER_TAG"
    docker build -t "$DOCKER_USERNAME/$DOCKER_REPO:$DOCKER_TAG" .
    
    log_success "Docker镜像构建完成"
}

# 推送Docker镜像
push_docker() {
    log_info "推送Docker镜像到Docker Hub..."
    
    # 检查是否已登录Docker Hub
    if ! docker info | grep -q "Username"; then
        log_warning "请先登录Docker Hub"
        read -p "是否现在登录？(y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker login
        else
            log_error "需要先登录Docker Hub"
            exit 1
        fi
    fi
    
    log_info "推送镜像: $DOCKER_USERNAME/$DOCKER_REPO:$DOCKER_TAG"
    docker push "$DOCKER_USERNAME/$DOCKER_REPO:$DOCKER_TAG"
    
    log_success "Docker镜像推送完成"
    log_info "镜像地址: https://hub.docker.com/r/$DOCKER_USERNAME/$DOCKER_REPO"
}

# 本地部署（使用现有的阿里云部署脚本）
deploy_local() {
    log_info "执行本地部署..."
    
    if [ ! -f "$SCRIPT_DIR/deploy-aliyun.sh" ]; then
        log_error "未找到deploy-aliyun.sh脚本"
        exit 1
    fi
    
    chmod +x "$SCRIPT_DIR/deploy-aliyun.sh"
    "$SCRIPT_DIR/deploy-aliyun.sh" "$@"
}

# Docker部署到远程服务器
deploy_docker() {
    if [ -z "$REMOTE_HOST" ]; then
        log_error "请设置远程服务器地址 (-h 或 REMOTE_HOST 环境变量)"
        exit 1
    fi
    
    log_info "部署到远程服务器: $REMOTE_USER@$REMOTE_HOST"
    
    # 创建部署脚本
    local deploy_script="/tmp/membuddy-deploy.sh"
    cat > "$deploy_script" << EOF
#!/bin/bash
set -e

echo "🚀 开始部署 MemBuddy..."

# 停止现有容器
echo "停止现有容器..."
docker stop membuddy-api || true
docker rm membuddy-api || true

# 拉取最新镜像
echo "拉取最新镜像..."
docker pull $DOCKER_USERNAME/$DOCKER_REPO:$DOCKER_TAG

# 启动新容器
echo "启动新容器..."
docker run -d \\
  --name membuddy-api \\
  --restart unless-stopped \\
  -p 8000:8000 \\
  --env-file $REMOTE_PATH/.env \\
  -v $REMOTE_PATH/service-account-key.json:/app/google-credentials.json:ro \\
  $DOCKER_USERNAME/$DOCKER_REPO:$DOCKER_TAG

echo "✅ 部署完成！"
echo "检查容器状态..."
docker ps | grep membuddy-api
EOF
    
    # 上传并执行部署脚本
    log_info "上传部署脚本到服务器..."
    scp "$deploy_script" "$REMOTE_USER@$REMOTE_HOST:/tmp/"
    
    log_info "执行远程部署..."
    ssh "$REMOTE_USER@$REMOTE_HOST" "chmod +x /tmp/membuddy-deploy.sh && /tmp/membuddy-deploy.sh"
    
    # 清理临时文件
    rm "$deploy_script"
    
    log_success "Docker部署完成"
}

# 检查部署状态
check_status() {
    if [ -n "$REMOTE_HOST" ]; then
        log_info "检查远程服务器状态: $REMOTE_USER@$REMOTE_HOST"
        ssh "$REMOTE_USER@$REMOTE_HOST" "docker ps | grep membuddy || echo '容器未运行'"
        ssh "$REMOTE_USER@$REMOTE_HOST" "curl -s http://localhost:8000/health || echo '健康检查失败'"
    else
        log_info "检查本地状态..."
        if command -v systemctl >/dev/null 2>&1; then
            systemctl status membuddy-api || true
        fi
        curl -s http://localhost:8000/health || echo "健康检查失败"
    fi
}

# 查看日志
show_logs() {
    if [ -n "$REMOTE_HOST" ]; then
        log_info "查看远程服务器日志: $REMOTE_USER@$REMOTE_HOST"
        ssh "$REMOTE_USER@$REMOTE_HOST" "docker logs -f membuddy-api"
    else
        log_info "查看本地日志..."
        if command -v systemctl >/dev/null 2>&1; then
            journalctl -u membuddy-api -f
        else
            tail -f /var/log/membuddy/app.log 2>/dev/null || echo "日志文件未找到"
        fi
    fi
}

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--host)
                REMOTE_HOST="$2"
                shift 2
                ;;
            -u|--user)
                REMOTE_USER="$2"
                shift 2
                ;;
            -p|--path)
                REMOTE_PATH="$2"
                shift 2
                ;;
            -t|--tag)
                DOCKER_TAG="$2"
                shift 2
                ;;
            -m|--message)
                COMMIT_MESSAGE="$2"
                shift 2
                ;;
            --skip-git)
                SKIP_GIT=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-push)
                SKIP_PUSH=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            help)
                show_help
                exit 0
                ;;
            commit|build|push|deploy-local|deploy-docker|deploy-full|status|logs)
                COMMANDS+=("$1")
                shift
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# 执行命令
execute_commands() {
    for cmd in "${COMMANDS[@]}"; do
        if [ "$DRY_RUN" = true ]; then
            log_info "[DRY RUN] 将执行: $cmd"
            continue
        fi
        
        case $cmd in
            commit)
                [ "$SKIP_GIT" != true ] && commit_code "$COMMIT_MESSAGE"
                ;;
            build)
                [ "$SKIP_BUILD" != true ] && build_docker
                ;;
            push)
                [ "$SKIP_PUSH" != true ] && push_docker
                ;;
            deploy-local)
                deploy_local
                ;;
            deploy-docker)
                deploy_docker
                ;;
            deploy-full)
                [ "$SKIP_GIT" != true ] && commit_code "$COMMIT_MESSAGE"
                [ "$SKIP_BUILD" != true ] && build_docker
                [ "$SKIP_PUSH" != true ] && push_docker
                deploy_docker
                ;;
            status)
                check_status
                ;;
            logs)
                show_logs
                ;;
        esac
    done
}

# 主函数
main() {
    local COMMANDS=()
    local COMMIT_MESSAGE=""
    local SKIP_GIT=false
    local SKIP_BUILD=false
    local SKIP_PUSH=false
    local DRY_RUN=false
    
    # 如果没有参数，显示帮助
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    parse_args "$@"
    
    # 如果没有指定命令，显示帮助
    if [ ${#COMMANDS[@]} -eq 0 ]; then
        show_help
        exit 0
    fi
    
    log_info "🚀 开始执行 MemBuddy 部署流程..."
    log_info "项目目录: $SCRIPT_DIR"
    log_info "Docker镜像: $DOCKER_USERNAME/$DOCKER_REPO:$DOCKER_TAG"
    
    # 检查必要工具
    check_requirements
    
    # 如果需要Docker操作，检查Docker
    for cmd in "${COMMANDS[@]}"; do
        if [[ "$cmd" =~ ^(build|push|deploy-docker|deploy-full)$ ]]; then
            check_docker
            break
        fi
    done
    
    # 执行命令
    execute_commands
    
    log_success "🎉 所有操作完成！"
}

# 运行主函数
main "$@"