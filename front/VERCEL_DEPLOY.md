# MemBuddy 前端 Vercel 部署指南

## 前置条件

- 后端 API 已部署到阿里云并获得访问地址
- Nginx 代理已部署到 Claw Cloud Run 并配置 Gemini API 代理
- GitHub 仓库已推送最新代码
- Vercel 账号已连接 GitHub

## 部署步骤

### 1. 在 Vercel 中导入项目

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择你的 GitHub 仓库
4. 设置项目根目录为 `front/`

### 2. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

```
NEXT_PUBLIC_API_URL=https://your-aliyun-backend-domain.com/api
```

**重要：** 将 `your-aliyun-backend-domain.com` 替换为你在阿里云部署的后端服务实际域名。

### 3. 部署配置

Vercel 会自动检测到 `vercel.json` 配置文件，包含以下设置：

- 构建命令：`pnpm build`
- 安装命令：`pnpm install`
- 输出目录：`.next`
- 框架：Next.js

### 4. 部署

1. 点击 "Deploy" 开始部署
2. 等待构建完成
3. 获得 Vercel 提供的域名

## 环境变量说明

### 开发环境

本地开发时，API 会自动使用 `http://localhost:8000/api`

### 生产环境

部署到 Vercel 时，需要设置 `NEXT_PUBLIC_API_URL` 环境变量指向你的阿里云后端 API 地址。

## 更新部署

当你推送新代码到 GitHub 主分支时，Vercel 会自动重新部署。

## 故障排除

### API 连接问题

1. 检查 `NEXT_PUBLIC_API_URL` 环境变量是否正确设置
2. 确认阿里云的后端 API 服务正在运行
3. 确认 Claw Cloud Run 的 Nginx 代理服务正在运行
4. 检查后端 CORS 配置是否允许 Vercel 域名访问

### 构建失败

1. 检查 `package.json` 中的依赖是否正确
2. 确认 TypeScript 类型检查通过
3. 查看 Vercel 构建日志获取详细错误信息

## 域名配置（可选）

如果你有自定义域名，可以在 Vercel 项目设置中添加自定义域名。

## 安全注意事项

- 确保 API 端点启用了 HTTPS
- 检查 CORS 配置只允许必要的域名
- 定期更新依赖包以修复安全漏洞