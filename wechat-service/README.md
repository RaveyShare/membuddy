# 微信认证服务

这是一个独立的微信认证服务，专门用于处理微信公众号和小程序的登录认证。

## 功能特性

- 🔐 微信公众号网页授权登录
- 📱 微信小程序登录
- 🚀 FastAPI 高性能框架
- 🐳 Docker 容器化部署
- 📝 详细的日志记录
- 🔧 健康检查接口

## 快速开始

### 1. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑.env文件，填入你的微信配置
vim .env
```

### 2. 本地运行

#### 方式一：直接运行
```bash
# 安装依赖
pip install -r requirements.txt

# 启动服务
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 方式二：使用启动脚本
```bash
./start.sh
```

#### 方式三：Docker运行
```bash
# 构建镜像
docker build -t wechat-service .

# 运行容器
docker run -p 8000:8000 --env-file .env wechat-service
```

#### 方式四：Docker Compose
```bash
docker-compose up -d
```

## API 接口

### 健康检查
```
GET /health
```

### 微信公众号登录
```
POST /auth/wechat/mp
Content-Type: application/json

{
  "code": "微信授权码"
}
```

### 微信小程序登录
```
POST /auth/wechat/mini
Content-Type: application/json

{
  "code": "微信授权码"
}
```

## 环境变量配置

| 变量名 | 说明 | 必填 |
|--------|------|------|
| WECHAT_APP_ID | 微信公众号AppID | 是 |
| WECHAT_APP_SECRET | 微信公众号AppSecret | 是 |
| WECHAT_MINI_APP_ID | 微信小程序AppID | 是 |
| WECHAT_MINI_APP_SECRET | 微信小程序AppSecret | 是 |

## 微信配置要求

### 公众号配置
1. 在微信公众平台配置授权回调域名
2. 域名必须是已备案的域名（如阿里云备案域名）
3. 不支持IP地址、端口号
4. 需要上传域名验证文件

### 小程序配置
1. 在微信小程序后台配置服务器域名
2. 将此服务的域名添加到request合法域名

## 部署到阿里云

### 1. 服务器准备
```bash
# 安装Docker
curl -fsSL https://get.docker.com | bash
sudo systemctl start docker
sudo systemctl enable docker

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. 部署服务
```bash
# 上传代码到服务器
scp -r wechat-service/ user@your-server:/path/to/

# 在服务器上启动
cd /path/to/wechat-service
cp .env.example .env
vim .env  # 配置环境变量
docker-compose up -d
```

### 3. Nginx配置（可选）
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 测试接口

### 使用curl测试
```bash
# 健康检查
curl http://localhost:8000/health

# 测试微信公众号登录
curl -X POST http://localhost:8000/auth/wechat/mp \
  -H "Content-Type: application/json" \
  -d '{"code":"your_wechat_code"}'
```

### 使用Postman测试
导入以下请求到Postman：

1. **健康检查**
   - Method: GET
   - URL: `http://your-domain.com/health`

2. **微信公众号登录**
   - Method: POST
   - URL: `http://your-domain.com/auth/wechat/mp`
   - Headers: `Content-Type: application/json`
   - Body: `{"code": "your_code"}`

## 日志查看

```bash
# Docker Compose方式查看日志
docker-compose logs -f

# Docker方式查看日志
docker logs -f container_name
```

## 故障排除

1. **服务无法启动**
   - 检查.env文件是否正确配置
   - 检查端口8000是否被占用

2. **微信登录失败**
   - 检查微信AppID和AppSecret是否正确
   - 检查微信后台域名配置
   - 查看服务日志获取详细错误信息

3. **域名访问问题**
   - 确保域名已正确解析到服务器IP
   - 检查防火墙设置
   - 确保服务正在运行

## 许可证

MIT License