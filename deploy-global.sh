#!/bin/bash

# MemBuddy Global Version One-Click Deployment Script
# Uses international AI services, deploys to global cloud services

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Configuration variables
APP_NAME="membuddy-global"
APP_DIR="/opt/${APP_NAME}"
DOCKER_IMAGE="${APP_NAME}:latest"
CONTAINER_NAME="${APP_NAME}-container"
PORT=8000
REGION="global"

# Show help information
show_help() {
    echo "MemBuddy Global Version Deployment Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  init        Initialize server environment"
    echo "  deploy      Deploy application"
    echo "  update      Update application"
    echo "  start       Start service"
    echo "  stop        Stop service"
    echo "  restart     Restart service"
    echo "  status      Check service status"
    echo "  logs        View logs"
    echo "  config      Configure environment variables"
    echo "  validate    Validate configuration"
    echo "  backup      Backup data"
    echo "  ssl         Setup SSL certificate"
    echo "  help        Show help information"
    echo ""
    echo "Examples:"
    echo "  $0 init     # Initialize server"
    echo "  $0 deploy   # Deploy application"
    echo "  $0 status   # Check status"
}

# Check system
check_system() {
    log_info "Checking system environment..."
    
    # Check operating system
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        log_success "Linux system detected"
    else
        log_error "This script only supports Linux systems"
        exit 1
    fi
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        log_warning "It's recommended to run this script as a non-root user"
    fi
    
    # Check network connectivity
    if ping -c 1 google.com &> /dev/null; then
        log_success "Network connection is working"
    else
        log_error "Network connection failed, please check network settings"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Installing system dependencies..."
    
    # Update package manager
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y curl wget git unzip software-properties-common
    elif command -v yum &> /dev/null; then
        sudo yum update -y
        sudo yum install -y curl wget git unzip
    else
        log_error "Unsupported package manager"
        exit 1
    fi
    
    log_success "System dependencies installed"
}

# Install Docker
install_docker() {
    if command -v docker &> /dev/null; then
        log_success "Docker is already installed"
        return
    fi
    
    log_info "Installing Docker..."
    
    # Install Docker using official script
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    
    # Configure Docker
    sudo mkdir -p /etc/docker
    sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
EOF
    
    # Start Docker service
    sudo systemctl enable docker
    sudo systemctl start docker
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    log_success "Docker installation completed"
    log_warning "Please log out and log back in for Docker group permissions to take effect"
}

# Install Docker Compose
install_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        log_success "Docker Compose is already installed"
        return
    fi
    
    log_info "Installing Docker Compose..."
    
    # Download and install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    log_success "Docker Compose installation completed"
}

# Install Nginx
install_nginx() {
    if command -v nginx &> /dev/null; then
        log_success "Nginx is already installed"
        return
    fi
    
    log_info "Installing Nginx..."
    
    if command -v apt-get &> /dev/null; then
        sudo apt-get install -y nginx
    elif command -v yum &> /dev/null; then
        sudo yum install -y nginx
    fi
    
    sudo systemctl enable nginx
    sudo systemctl start nginx
    
    log_success "Nginx installation completed"
}

# Install Certbot for SSL
install_certbot() {
    if command -v certbot &> /dev/null; then
        log_success "Certbot is already installed"
        return
    fi
    
    log_info "Installing Certbot for SSL certificates..."
    
    if command -v apt-get &> /dev/null; then
        sudo apt-get install -y certbot python3-certbot-nginx
    elif command -v yum &> /dev/null; then
        sudo yum install -y certbot python3-certbot-nginx
    fi
    
    log_success "Certbot installation completed"
}

# Initialize environment
init_environment() {
    log_info "Initializing deployment environment..."
    
    check_system
    install_dependencies
    install_docker
    install_docker_compose
    install_nginx
    install_certbot
    
    # Create application directory
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
    
    log_success "Environment initialization completed"
}

# Clone repository
clone_repository() {
    log_info "Cloning code repository..."
    
    if [ -d "$APP_DIR/.git" ]; then
        log_info "Repository already exists, updating code..."
        cd $APP_DIR
        git pull origin main
    else
        log_info "Cloning new repository..."
        git clone https://github.com/RaveyShare/membuddy.git $APP_DIR
        cd $APP_DIR
    fi
    
    log_success "Code update completed"
}

# Setup environment variables
setup_environment_variables() {
    log_info "Configuring environment variables..."
    
    cd $APP_DIR/back
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.global.example" ]; then
            cp .env.global.example .env
            log_info "Global version environment template copied"
        else
            log_error "Global version environment template file not found"
            exit 1
        fi
    fi
    
    # Set region and language
    sed -i "s/REGION=.*/REGION=global/g" .env
    sed -i "s/LANGUAGE=.*/LANGUAGE=en-US/g" .env
    
    log_warning "Please edit $APP_DIR/back/.env file and configure the following required parameters:"
    echo "  - Database configuration (SUPABASE_*)"
    echo "  - Gemini API key (GEMINI_API_KEY)"
    echo "  - Google Cloud configuration (GOOGLE_CLOUD_*)"
    echo "  - WeChat configuration (WECHAT_*) [optional]"
    echo "  - Frontend domain (FRONTEND_URL)"
    
    read -p "Press Enter after configuration is complete..."
}

# Build Docker image
build_docker_image() {
    log_info "Building Docker image..."
    
    cd $APP_DIR/back
    
    # Build image
    docker build -t $DOCKER_IMAGE .
    
    log_success "Docker image build completed"
}

# Start service
start_service() {
    log_info "Starting application service..."
    
    # Stop existing container
    if docker ps -a | grep -q $CONTAINER_NAME; then
        docker stop $CONTAINER_NAME || true
        docker rm $CONTAINER_NAME || true
    fi
    
    # Start new container
    docker run -d \
        --name $CONTAINER_NAME \
        --restart unless-stopped \
        -p $PORT:8000 \
        --env-file $APP_DIR/back/.env \
        -v $APP_DIR/back/service-account-key.json:/app/service-account-key.json:ro \
        $DOCKER_IMAGE
    
    log_success "Application service started"
}

# Setup Nginx
setup_nginx() {
    log_info "Configuring Nginx reverse proxy..."
    
    # Get domain name
    read -p "Enter your domain name (e.g., membuddy.example.com): " DOMAIN_NAME
    
    if [ -z "$DOMAIN_NAME" ]; then
        DOMAIN_NAME="_"
        log_warning "No domain specified, using default configuration"
    fi
    
    # Create Nginx configuration file
    sudo tee /etc/nginx/sites-available/$APP_NAME <<EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;
    
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
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    sudo nginx -t
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    log_success "Nginx configuration completed"
    
    # Store domain for SSL setup
    echo $DOMAIN_NAME > $APP_DIR/.domain
}

# Setup SSL certificate
setup_ssl() {
    log_info "Setting up SSL certificate..."
    
    if [ ! -f "$APP_DIR/.domain" ]; then
        log_error "Domain not configured. Please run 'deploy' first."
        exit 1
    fi
    
    DOMAIN_NAME=$(cat $APP_DIR/.domain)
    
    if [ "$DOMAIN_NAME" = "_" ]; then
        log_error "Cannot setup SSL for default domain. Please configure a real domain first."
        exit 1
    fi
    
    # Obtain SSL certificate
    sudo certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME
    
    # Setup auto-renewal
    sudo systemctl enable certbot.timer
    sudo systemctl start certbot.timer
    
    log_success "SSL certificate setup completed"
}

# Deploy application
deploy_application() {
    log_info "Starting MemBuddy Global Version deployment..."
    
    clone_repository
    setup_environment_variables
    build_docker_image
    start_service
    setup_nginx
    
    log_success "MemBuddy Global Version deployment completed!"
    log_info "Access URL: http://$(curl -s ifconfig.me)"
    log_info "To setup SSL, run: $0 ssl"
}

# Update application
update_application() {
    log_info "Updating application..."
    
    clone_repository
    build_docker_image
    start_service
    
    log_success "Application update completed"
}

# Check service status
check_status() {
    log_info "Checking service status..."
    
    echo "=== Docker Container Status ==="
    docker ps -a | grep $CONTAINER_NAME || echo "Container not running"
    
    echo "\n=== Nginx Status ==="
    sudo systemctl status nginx --no-pager -l
    
    echo "\n=== Port Listening Status ==="
    sudo netstat -tlnp | grep :$PORT || echo "Port $PORT not listening"
    sudo netstat -tlnp | grep :80 || echo "Port 80 not listening"
    sudo netstat -tlnp | grep :443 || echo "Port 443 not listening"
    
    echo "\n=== Disk Usage ==="
    df -h $APP_DIR
    
    echo "\n=== Memory Usage ==="
    free -h
    
    echo "\n=== SSL Certificate Status ==="
    if [ -f "$APP_DIR/.domain" ]; then
        DOMAIN_NAME=$(cat $APP_DIR/.domain)
        if [ "$DOMAIN_NAME" != "_" ]; then
            sudo certbot certificates | grep $DOMAIN_NAME || echo "No SSL certificate found"
        fi
    fi
}

# View logs
view_logs() {
    log_info "Viewing application logs..."
    
    if docker ps | grep -q $CONTAINER_NAME; then
        docker logs -f --tail=100 $CONTAINER_NAME
    else
        log_error "Container not running"
        exit 1
    fi
}

# Stop service
stop_service() {
    log_info "Stopping service..."
    
    if docker ps | grep -q $CONTAINER_NAME; then
        docker stop $CONTAINER_NAME
        log_success "Service stopped"
    else
        log_warning "Service not running"
    fi
}

# Restart service
restart_service() {
    log_info "Restarting service..."
    
    stop_service
    sleep 2
    
    if docker ps -a | grep -q $CONTAINER_NAME; then
        docker start $CONTAINER_NAME
        log_success "Service restarted"
    else
        log_error "Container does not exist, please deploy first"
        exit 1
    fi
}

# Validate configuration
validate_configuration() {
    log_info "Validating configuration..."
    
    cd $APP_DIR/back
    
    if [ ! -f ".env" ]; then
        log_error "Environment file does not exist"
        exit 1
    fi
    
    # Check required environment variables
    required_vars=("GEMINI_API_KEY" "GOOGLE_CLOUD_PROJECT_ID" "SUPABASE_URL")
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env || grep -q "^$var=$" .env || grep -q "^$var=your-" .env; then
            log_error "Environment variable $var is not properly configured"
            exit 1
        fi
    done
    
    log_success "Configuration validation passed"
}

# Backup data
backup_data() {
    log_info "Backing up application data..."
    
    backup_dir="/opt/backups/membuddy-global"
    backup_file="$backup_dir/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    sudo mkdir -p $backup_dir
    
    # Backup configuration files and data
    sudo tar -czf $backup_file \
        -C $APP_DIR \
        back/.env \
        back/service-account-key.json \
        .domain \
        || true
    
    log_success "Backup completed: $backup_file"
}

# Main function
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
        ssl)
            setup_ssl
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"