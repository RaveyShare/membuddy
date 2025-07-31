# Docker 镜像加速器配置指南

由于网络原因，在国内拉取 Docker 镜像可能会遇到速度慢或失败的问题。本指南将帮助您配置阿里云等国内镜像源，显著提升镜像拉取速度。

## 🚀 快速配置

### 自动配置（推荐）

```bash
# 运行自动配置脚本
./setup-docker-mirrors.sh setup

# 验证配置
./setup-docker-mirrors.sh verify

# 测试镜像拉取
./setup-docker-mirrors.sh test
```

### 手动配置

#### Linux 系统

1. **创建或编辑 Docker 配置文件**
   ```bash
   sudo mkdir -p /etc/docker
   sudo nano /etc/docker/daemon.json
   ```

2. **添加镜像源配置**
   ```json
   {
     "registry-mirrors": [
       "https://registry.cn-hangzhou.aliyuncs.com",
       "https://docker.mirrors.ustc.edu.cn",
       "https://hub-mirror.c.163.com",
       "https://mirror.baidubce.com"
     ],
     "log-driver": "json-file",
     "log-opts": {
       "max-size": "100m",
       "max-file": "3"
     }
   }
   ```

3. **重启 Docker 服务**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart docker
   ```

#### macOS 系统

1. **打开 Docker Desktop**
2. **点击设置图标（齿轮）**
3. **选择 "Docker Engine"**
4. **在配置中添加镜像源**
   ```json
   {
     "registry-mirrors": [
       "https://registry.cn-hangzhou.aliyuncs.com",
       "https://docker.mirrors.ustc.edu.cn",
       "https://hub-mirror.c.163.com",
       "https://mirror.baidubce.com"
     ]
   }
   ```
5. **点击 "Apply & Restart"**

## 📦 项目镜像源配置

本项目已经配置了阿里云镜像源：

### Dockerfile 优化

- **基础镜像**: 使用 `registry.cn-hangzhou.aliyuncs.com/library/python:3.11-slim`
- **软件源**: 配置阿里云 Debian 软件源
- **pip 源**: 使用阿里云 PyPI 镜像源

### Docker Compose 优化

- **nginx**: `registry.cn-hangzhou.aliyuncs.com/library/nginx:alpine`
- **redis**: `registry.cn-hangzhou.aliyuncs.com/library/redis:7-alpine`

## 🔍 验证配置

### 检查镜像源配置

```bash
# 查看 Docker 信息
docker info | grep -A 10 "Registry Mirrors"

# 或者查看配置文件
cat /etc/docker/daemon.json  # Linux
```

### 测试镜像拉取速度

```bash
# 测试拉取小镜像
time docker pull hello-world

# 测试拉取项目镜像
time docker pull registry.cn-hangzhou.aliyuncs.com/library/python:3.11-slim
```

## 🌐 可用镜像源列表

| 镜像源 | 地址 | 说明 |
|--------|------|------|
| 阿里云 | `https://registry.cn-hangzhou.aliyuncs.com` | 推荐，速度快，稳定性好 |
| 中科大 | `https://docker.mirrors.ustc.edu.cn` | 教育网用户推荐 |
| 网易 | `https://hub-mirror.c.163.com` | 备用选择 |
| 百度云 | `https://mirror.baidubce.com` | 备用选择 |

## 🚀 部署时的镜像优化

### 国内版部署

```bash
# 使用国内版 Docker Compose
docker-compose -f docker-compose.china.yml up -d

# 或使用一键部署脚本（已配置镜像源）
./deploy-china.sh deploy
```

### 国际版部署

```bash
# 使用国际版 Docker Compose
docker-compose -f docker-compose.global.yml up -d

# 或使用一键部署脚本
./deploy-global.sh deploy
```

## 🛠️ 故障排除

### 常见问题

1. **镜像拉取仍然很慢**
   - 检查网络连接
   - 尝试不同的镜像源
   - 确认 Docker 服务已重启

2. **配置文件格式错误**
   ```bash
   # 验证 JSON 格式
   cat /etc/docker/daemon.json | python -m json.tool
   ```

3. **Docker 服务启动失败**
   ```bash
   # 查看服务状态
   sudo systemctl status docker
   
   # 查看日志
   sudo journalctl -u docker.service
   ```

### 重置配置

```bash
# 备份当前配置
sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.backup

# 删除配置文件
sudo rm /etc/docker/daemon.json

# 重启 Docker
sudo systemctl restart docker
```

## 📊 性能对比

| 场景 | 官方源 | 阿里云源 | 提升幅度 |
|------|--------|----------|----------|
| Python 基础镜像 | ~5分钟 | ~30秒 | **10倍** |
| Nginx 镜像 | ~2分钟 | ~15秒 | **8倍** |
| Redis 镜像 | ~3分钟 | ~20秒 | **9倍** |

## 🔧 高级配置

### 企业内网环境

如果您在企业内网环境中，可能需要额外配置：

```json
{
  "registry-mirrors": [
    "https://registry.cn-hangzhou.aliyuncs.com"
  ],
  "insecure-registries": [
    "your-internal-registry:5000"
  ],
  "proxies": {
    "default": {
      "httpProxy": "http://proxy.company.com:8080",
      "httpsProxy": "http://proxy.company.com:8080"
    }
  }
}
```

### 自定义镜像源

如果您有自己的镜像仓库，可以添加到配置中：

```json
{
  "registry-mirrors": [
    "https://your-custom-registry.com",
    "https://registry.cn-hangzhou.aliyuncs.com"
  ]
}
```

## 📝 注意事项

1. **配置优先级**: Docker 会按照配置中的顺序尝试镜像源
2. **网络环境**: 不同地区的网络环境可能影响镜像源的访问速度
3. **镜像同步**: 镜像源可能存在同步延迟，最新镜像可能需要从官方源拉取
4. **安全考虑**: 确保使用可信的镜像源

## 🆘 获取帮助

如果在配置过程中遇到问题：

1. 查看 [Docker 官方文档](https://docs.docker.com/)
2. 检查项目的 [故障排除指南](./README.md#故障排除)
3. 提交 [GitHub Issue](https://github.com/RaveyShare/membuddy/issues)

---

**提示**: 配置完成后，建议重新构建项目镜像以确保使用新的镜像源：

```bash
# 清理旧镜像
docker system prune -a

# 重新构建
docker-compose build --no-cache
```