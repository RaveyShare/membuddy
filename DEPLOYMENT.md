# MemBuddy 部署指南

本项目提供了一个强大的一键部署脚本 `deploy.sh`，支持多种部署方式。

## 快速开始

### 1. 基本使用

```bash
# 查看帮助信息
./deploy.sh help

# 提交代码到Git
./deploy.sh commit

# 构建Docker镜像
./deploy.sh build

# 推送镜像到Docker Hub
./deploy.sh push
```

### 2. 完整部署流程

```bash
# 一键完整部署（提交代码 + 构建镜像 + 推送镜像 + 部署到服务器）
./deploy.sh -h your-server.com deploy-full
```

### 3. 本地阿里云部署

```bash
# 使用现有的阿里云部署脚本
./deploy.sh deploy-local init    # 初始化环境
./deploy.sh deploy-local deploy  # 部署应用
./deploy.sh deploy-local update  # 更新部署
```

## 部署方式详解

### 方式一：Docker 部署

适用于已有Docker环境的服务器。

**前置条件：**
- 服务器已安装Docker
- 已配置SSH密钥登录
- 服务器上已准备好环境变量文件

**步骤：**

1. **准备环境变量**
   ```bash
   # 在服务器上创建环境变量文件
   mkdir -p /opt/membuddy
   vim /opt/membuddy/.env
   ```

   环境变量示例：
   ```env
   # Supabase配置
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Gemini AI配置
   GEMINI_API_KEY=your_gemini_api_key
   
   # Google Cloud配置
   GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json
   
   # 其他配置
   ENVIRONMENT=production
   ```

2. **上传Google Cloud服务账号密钥**
   ```bash
   scp service-account-key.json root@your-server:/opt/membuddy/
   ```

3. **执行部署**
   ```bash
   ./deploy.sh -h your-server.com deploy-full
   ```

### 方式二：阿里云部署

适用于全新的阿里云服务器，会自动安装所有依赖。

**前置条件：**
- Ubuntu/Debian系统
- Root权限

**步骤：**

1. **初始化环境**
   ```bash
   ./deploy.sh deploy-local init
   ```

2. **部署应用**
   ```bash
   ./deploy.sh deploy-local deploy
   ```

3. **后续更新**
   ```bash
   ./deploy.sh deploy-local update
   ```

## 高级用法

### 自定义配置

```bash
# 使用环境变量
export DOCKER_USERNAME="your-username"
export DOCKER_REPO="your-repo"
export REMOTE_HOST="your-server.com"

# 使用命令行参数
./deploy.sh -h your-server.com -u ubuntu -t v1.0.0 deploy-full
```

### 分步骤部署

```bash
# 1. 提交代码
./deploy.sh -m "新功能发布" commit

# 2. 构建镜像
./deploy.sh -t v1.0.0 build

# 3. 推送镜像
./deploy.sh -t v1.0.0 push

# 4. 部署到服务器
./deploy.sh -h your-server.com -t v1.0.0 deploy-docker
```

### 跳过某些步骤

```bash
# 跳过Git提交，只构建和部署
./deploy.sh --skip-git -h your-server.com deploy-full

# 跳过构建，使用现有镜像部署
./deploy.sh --skip-build --skip-push -h your-server.com deploy-full
```

### 预览模式

```bash
# 查看将要执行的操作，不实际执行
./deploy.sh --dry-run -h your-server.com deploy-full
```

## 监控和维护

### 检查部署状态

```bash
# 检查本地状态
./deploy.sh status

# 检查远程服务器状态
./deploy.sh -h your-server.com status
```

### 查看日志

```bash
# 查看本地日志
./deploy.sh logs

# 查看远程服务器日志
./deploy.sh -h your-server.com logs
```

### 手动操作

```bash
# 登录到服务器查看容器状态
ssh root@your-server.com
docker ps
docker logs membuddy-api

# 重启容器
docker restart membuddy-api

# 查看容器资源使用情况
docker stats membuddy-api
```

## 故障排除

### 常见问题

1. **Docker登录失败**
   ```bash
   docker login
   ```

2. **SSH连接失败**
   - 检查SSH密钥配置
   - 确认服务器地址和用户名
   - 测试SSH连接：`ssh root@your-server.com`

3. **容器启动失败**
   - 检查环境变量文件
   - 查看容器日志：`docker logs membuddy-api`
   - 检查端口占用：`netstat -tlnp | grep 8000`

4. **镜像构建失败**
   - 检查Dockerfile是否存在
   - 确认Docker守护进程运行正常
   - 查看构建日志中的错误信息

### 回滚操作

```bash
# 回滚到上一个版本
./deploy.sh -h your-server.com -t previous-tag deploy-docker

# 或者手动回滚
ssh root@your-server.com
docker stop membuddy-api
docker rm membuddy-api
docker run -d --name membuddy-api --restart unless-stopped -p 8000:8000 --env-file /opt/membuddy/.env raveyshare/membuddy:previous-tag
```

## 安全注意事项

1. **环境变量安全**
   - 不要将包含敏感信息的 `.env` 文件提交到Git
   - 使用强密码和安全的API密钥
   - 定期轮换密钥

2. **服务器安全**
   - 使用SSH密钥而非密码登录
   - 配置防火墙规则
   - 定期更新系统和Docker

3. **Docker安全**
   - 使用非root用户运行容器（如果可能）
   - 定期更新基础镜像
   - 扫描镜像漏洞

## 性能优化

1. **镜像优化**
   - 使用多阶段构建
   - 清理不必要的文件
   - 使用 `.dockerignore` 文件

2. **部署优化**
   - 使用镜像缓存
   - 并行执行非依赖操作
   - 配置健康检查

3. **监控优化**
   - 配置日志轮转
   - 监控资源使用情况
   - 设置告警机制

---

更多问题请参考项目文档或提交Issue。