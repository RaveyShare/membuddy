# MemBuddy 本地部署指南

本文档介绍如何使用修改后的 `deploy-aliyun.sh` 脚本进行本地部署（非 Docker 方式）。

## 主要变化

### 从 Docker 部署改为本地部署
- ❌ 不再使用 Docker 容器
- ✅ 使用 Python 虚拟环境
- ✅ 使用 systemd 服务管理
- ✅ 直接在系统上运行应用

### 新增功能
- 🔧 自动安装 Python 3.11 和 uv 包管理器
- 🔧 自动创建和管理 Python 虚拟环境
- 🔧 使用 systemd 服务确保应用自动重启
- 🔧 改进的 Nginx 配置管理
- 🔧 更好的日志和状态检查

## 使用方法

### 1. 初始化环境
```bash
./deploy-aliyun.sh init
```

这将安装：
- Python 3.11 和相关工具
- uv 包管理器（更快的 pip 替代品）
- Nginx 和 Certbot
- 创建应用目录

### 2. 部署应用
```bash
./deploy-aliyun.sh deploy
```

这将：
- 克隆/更新代码仓库
- 配置环境变量
- 创建 Python 虚拟环境
- 安装依赖
- 创建 systemd 服务
- 配置 Nginx 反向代理
- 可选配置 SSL 证书

### 3. 其他命令
```bash
# 检查服务状态
./deploy-aliyun.sh status

# 查看应用日志
./deploy-aliyun.sh logs

# 更新部署
./deploy-aliyun.sh update

# 停止应用服务
./deploy-aliyun.sh stop

# 显示帮助
./deploy-aliyun.sh help
```

## 服务管理

### systemd 服务
应用作为 systemd 服务运行，服务名为 `membuddy-api`：

```bash
# 查看服务状态
sudo systemctl status membuddy-api

# 启动服务
sudo systemctl start membuddy-api

# 停止服务
sudo systemctl stop membuddy-api

# 重启服务
sudo systemctl restart membuddy-api

# 查看日志
sudo journalctl -u membuddy-api -f
```

### Python 虚拟环境
虚拟环境位于 `/opt/membuddy/back/.venv`：

```bash
# 激活虚拟环境
cd /opt/membuddy/back
source .venv/bin/activate

# 手动安装依赖
pip install -r requirements.txt
# 或使用 uv（更快）
uv pip install -r requirements.txt
```

## Nginx 配置

### 配置文件位置
- 模板文件：`nginx/local-deploy.conf`
- 实际配置：`/etc/nginx/sites-available/membuddy-api`
- 启用配置：`/etc/nginx/sites-enabled/membuddy-api`

### 自定义配置
你可以修改 `nginx/local-deploy.conf` 模板文件来自定义 Nginx 配置，然后重新运行部署脚本。

### 手动管理 Nginx
```bash
# 测试配置
sudo nginx -t

# 重新加载配置
sudo systemctl reload nginx

# 查看 Nginx 状态
sudo systemctl status nginx
```

## 目录结构

```
/opt/membuddy/
├── back/
│   ├── .venv/          # Python 虚拟环境
│   ├── .env            # 环境变量配置
│   ├── main.py         # 应用入口
│   ├── requirements.txt # Python 依赖
│   └── ...
├── nginx/
│   └── local-deploy.conf # Nginx 配置模板
└── ...
```

## 环境变量配置

环境变量文件位于 `/opt/membuddy/back/.env`，基于 `.env.aliyun.example` 创建。

主要配置项：
- 数据库连接
- API 密钥
- 服务端口（默认 8000）
- 其他应用配置

## 日志文件

- 应用日志：`sudo journalctl -u membuddy-api`
- Nginx 访问日志：`/var/log/nginx/membuddy_access.log`
- Nginx 错误日志：`/var/log/nginx/membuddy_error.log`

## 故障排除

### 服务启动失败
```bash
# 查看详细错误信息
sudo systemctl status membuddy-api
sudo journalctl -u membuddy-api --no-pager

# 检查虚拟环境
cd /opt/membuddy/back
source .venv/bin/activate
python main.py  # 手动测试
```

### Nginx 配置错误
```bash
# 测试配置语法
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

### 端口占用
```bash
# 检查端口 8000 是否被占用
sudo netstat -tlnp | grep :8000
sudo lsof -i :8000
```

## 优势

1. **更轻量**：不需要 Docker，减少资源占用
2. **更直接**：直接在系统上运行，便于调试
3. **更灵活**：可以更容易地修改配置和代码
4. **更快速**：启动时间更短，部署更快
5. **更简单**：减少了 Docker 相关的复杂性

## 注意事项

1. 确保服务器有足够的权限安装系统包
2. 建议使用非 root 用户运行部署脚本
3. 定期备份环境变量文件和数据
4. 监控服务状态和日志
5. 及时更新依赖和安全补丁

## 迁移指南

如果你之前使用 Docker 部署，迁移到本地部署：

1. 停止并删除 Docker 容器
2. 备份环境变量和数据
3. 运行新的部署脚本
4. 恢复环境变量配置
5. 测试应用功能

```bash
# 停止 Docker 容器（如果有）
docker stop membuddy-api
docker rm membuddy-api

# 运行新部署
./deploy-aliyun.sh init
./deploy-aliyun.sh deploy
```