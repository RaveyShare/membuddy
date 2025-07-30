# MemBuddy 后端阿里云部署指南

## 部署架构

- **阿里云 ECS**：部署 FastAPI 后端服务
- **Claw Cloud Run**：部署 Nginx 代理，提供 Gemini API 代理服务
- **Vercel**：部署前端，连接阿里云后端

## 前置条件

- 阿里云 ECS 实例（推荐 2核4G 以上）
- 已备案的域名
- Docker 和 Docker Compose
- Nginx 代理已部署到 Claw Cloud Run

## 部署步骤

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | bash
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 安装 Git
sudo apt install git -y
```

### 2. 部署后端服务

```bash
# 克隆代码
git clone https://github.com/your-username/memBuddy.git
cd memBuddy/back

# 配置环境变量
cp .env.example .env
vim .env
```

### 3. 环境变量配置

编辑 `.env` 文件：

```bash
# 数据库配置
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# Gemini 配置（通过 Claw Cloud Run 代理）
GEMINI_API_KEY=your_gemini_api_key
GEMINI_BASE_URL=https://your-claw-domain.com/gemini-proxy

# Google Cloud 配置（用于图像和音频生成）
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_LOCATION=us-central1

# 微信配置
WECHAT_MINI_APP_ID=your_mini_app_id
WECHAT_MINI_APP_SECRET=your_mini_app_secret
WECHAT_MP_APP_ID=your_mp_app_id
WECHAT_MP_APP_SECRET=your_mp_app_secret

# 前端域名
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

### 4. 启动服务

```bash
# 构建并启动容器
docker build -t membuddy-api .
docker run -d \
  --name membuddy-api \
  --restart unless-stopped \
  -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/service-account-key.json:/app/google-credentials.json:ro \
  membuddy-api

# 检查服务状态
docker ps
docker logs membuddy-api
```

### 5. Nginx 反向代理配置

创建 `/etc/nginx/sites-available/membuddy-api`：

```nginx
server {
    listen 80;
    server_name your-backend-domain.com;
    
    # API 代理
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS 配置
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
        
        if ($request_method = 'OPTIONS') {
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
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/membuddy-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL 证书配置（推荐）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取 SSL 证书
sudo certbot --nginx -d your-backend-domain.com

# 设置自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

## 服务管理

### 查看日志

```bash
# 查看容器日志
docker logs -f membuddy-api

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新构建镜像
docker build -t membuddy-api .

# 停止旧容器
docker stop membuddy-api
docker rm membuddy-api

# 启动新容器
docker run -d \
  --name membuddy-api \
  --restart unless-stopped \
  -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/service-account-key.json:/app/google-credentials.json:ro \
  membuddy-api
```

### 监控和维护

```bash
# 检查服务状态
curl https://your-backend-domain.com/health

# 检查容器资源使用
docker stats membuddy-api

# 清理 Docker 资源
docker system prune -f
```

## 故障排除

### 常见问题

1. **容器启动失败**
   - 检查环境变量配置
   - 查看容器日志：`docker logs membuddy-api`

2. **Gemini API 调用失败**
   - 确认 Claw Cloud Run 代理服务正常运行
   - 检查 `GEMINI_BASE_URL` 配置是否正确

3. **CORS 错误**
   - 确认前端域名已添加到 CORS 配置
   - 检查 Nginx 配置中的 CORS 头设置

4. **数据库连接失败**
   - 检查 Supabase 配置
   - 确认网络连接正常

### 性能优化

1. **启用 Gzip 压缩**
2. **配置缓存策略**
3. **使用 CDN 加速静态资源**
4. **监控服务器资源使用情况**

## 安全注意事项

- 定期更新系统和依赖包
- 配置防火墙规则
- 使用强密码和密钥
- 定期备份数据
- 监控异常访问日志