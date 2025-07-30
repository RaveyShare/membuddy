# MemBuddy 阿里云一键部署指南

本指南将帮助你在阿里云 ECS 上快速部署 MemBuddy 后端服务。

## 🚀 快速开始

### 前置条件

1. **阿里云 ECS 实例**
   - 推荐配置：2核4G 或以上
   - 操作系统：Ubuntu 20.04/22.04 或 Debian 11/12
   - 开放端口：80, 443, 8000

2. **域名准备**
   - 已备案的域名（用于后端 API）
   - 域名 DNS 解析指向 ECS 公网 IP

3. **必要的配置信息**
   - Supabase 数据库配置
   - Gemini API 密钥
   - Google Cloud 服务账号密钥文件
   - 微信小程序/公众号配置（可选）

### 第一步：连接到 ECS 服务器

```bash
# 使用 SSH 连接到你的 ECS 实例
ssh root@your-ecs-ip

# 创建普通用户（如果还没有）
adduser deploy
usermod -aG sudo deploy

# 切换到普通用户
su - deploy
```

### 第二步：下载部署脚本

```bash
# 下载部署脚本
wget https://raw.githubusercontent.com/RaveyShare/membuddy/main/deploy-aliyun.sh

# 或者使用 curl
curl -O https://raw.githubusercontent.com/RaveyShare/membuddy/main/deploy-aliyun.sh

# 给脚本执行权限
chmod +x deploy-aliyun.sh
```

### 第三步：初始化服务器环境

```bash
# 初始化环境（安装 Docker、Nginx 等）
./deploy-aliyun.sh init
```

**重要：** 初始化完成后，请重新登录服务器以使 Docker 组权限生效。

```bash
# 重新登录
exit
ssh deploy@your-ecs-ip
```

### 第四步：部署应用

```bash
# 开始部署
./deploy-aliyun.sh deploy
```

部署过程中会提示你：

1. **配置环境变量**：编辑 `.env` 文件，填入你的配置信息
2. **上传 Google Cloud 密钥**：将 `service-account-key.json` 文件上传到服务器
3. **配置域名**：输入你的后端 API 域名
4. **配置 SSL**：选择是否自动配置 HTTPS 证书

## 📝 详细配置说明

### 环境变量配置

部署过程中需要编辑 `/opt/membuddy/back/.env` 文件：

```bash
# 数据库配置 (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# Gemini API 配置 (通过 Claw Cloud Run 代理)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_BASE_URL=https://your-claw-domain.com/gemini-proxy

# Google Cloud 配置 (用于图像和音频生成)
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# 微信小程序配置
WECHAT_MINI_APP_ID=your-wechat-mini-app-id
WECHAT_MINI_APP_SECRET=your-wechat-mini-app-secret

# 微信公众号配置
WECHAT_MP_APP_ID=your-wechat-mp-app-id
WECHAT_MP_APP_SECRET=your-wechat-mp-app-secret

# 前端域名 (Vercel)
FRONTEND_URL=https://your-app.vercel.app
```

### Google Cloud 服务账号密钥

1. 在 Google Cloud Console 创建服务账号
2. 下载 JSON 格式的密钥文件
3. 将文件重命名为 `service-account-key.json`
4. 上传到服务器的 `/opt/membuddy/back/` 目录

```bash
# 使用 scp 上传文件
scp service-account-key.json deploy@your-ecs-ip:/opt/membuddy/back/
```

## 🛠️ 管理命令

### 查看服务状态

```bash
./deploy-aliyun.sh status
```

### 查看应用日志

```bash
./deploy-aliyun.sh logs
```

### 更新部署

```bash
./deploy-aliyun.sh update
```

### 手动管理 Docker 容器

```bash
# 查看容器状态
docker ps

# 查看容器日志
docker logs membuddy-api

# 重启容器
docker restart membuddy-api

# 停止容器
docker stop membuddy-api

# 删除容器
docker rm membuddy-api
```

### 管理 Nginx

```bash
# 检查 Nginx 配置
sudo nginx -t

# 重载 Nginx 配置
sudo systemctl reload nginx

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔧 故障排除

### 常见问题

1. **Docker 权限问题**
   ```bash
   # 确保用户在 docker 组中
   sudo usermod -aG docker $USER
   # 重新登录
   ```

2. **容器启动失败**
   ```bash
   # 查看详细日志
   docker logs membuddy-api
   
   # 检查环境变量配置
   cat /opt/membuddy/back/.env
   ```

3. **Nginx 配置错误**
   ```bash
   # 测试配置
   sudo nginx -t
   
   # 查看错误日志
   sudo tail -f /var/log/nginx/error.log
   ```

4. **SSL 证书问题**
   ```bash
   # 手动获取证书
   sudo certbot --nginx -d your-domain.com
   
   # 检查证书状态
   sudo certbot certificates
   ```

5. **端口被占用**
   ```bash
   # 查看端口占用
   sudo netstat -tlnp | grep :8000
   
   # 杀死占用进程
   sudo kill -9 <PID>
   ```

### 健康检查

```bash
# 检查应用健康状态
curl http://localhost:8000/health

# 检查通过域名访问
curl https://your-domain.com/health
```

## 🔒 安全建议

1. **防火墙配置**
   ```bash
   # 安装 ufw
   sudo apt install ufw
   
   # 配置防火墙规则
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

2. **定期更新**
   ```bash
   # 更新系统
   sudo apt update && sudo apt upgrade -y
   
   # 更新应用
   ./deploy-aliyun.sh update
   ```

3. **备份重要文件**
   - 环境变量文件：`/opt/membuddy/back/.env`
   - Google Cloud 密钥：`/opt/membuddy/back/service-account-key.json`
   - Nginx 配置：`/etc/nginx/sites-available/membuddy-api`

## 📊 监控和维护

### 设置监控脚本

```bash
# 创建监控脚本
cat > /home/deploy/monitor.sh << 'EOF'
#!/bin/bash

# 检查容器状态
if ! docker ps | grep -q membuddy-api; then
    echo "$(date): membuddy-api container is not running" >> /var/log/membuddy-monitor.log
    # 可以添加重启逻辑或发送告警
fi

# 检查磁盘空间
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): Disk usage is ${DISK_USAGE}%" >> /var/log/membuddy-monitor.log
fi
EOF

chmod +x /home/deploy/monitor.sh

# 添加到 crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/deploy/monitor.sh") | crontab -
```

### 日志轮转

```bash
# 配置 Docker 日志轮转
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

sudo systemctl restart docker
```

## 🎯 性能优化

1. **启用 Gzip 压缩**
   ```nginx
   # 在 Nginx 配置中添加
   gzip on;
   gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   ```

2. **配置缓存**
   ```nginx
   # 静态资源缓存
   location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

3. **数据库连接池优化**
   - 在环境变量中配置合适的数据库连接池大小
   - 监控数据库连接数和响应时间

## 📞 技术支持

如果在部署过程中遇到问题，请：

1. 查看详细的错误日志
2. 检查环境变量配置
3. 确认网络连接正常
4. 参考故障排除章节

更多技术支持，请访问项目 GitHub 仓库或联系开发团队。