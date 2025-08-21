# API配置说明

## 为什么使用Mock数据？

之前小程序使用Mock数据而不是真实服务器调用的原因：

### 1. SSL证书问题
- 真机调试时出现 `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` 错误
- 这是由于服务器SSL证书配置不兼容微信小程序的安全要求
- 为了不阻塞开发进度，临时启用了Mock数据模式

### 2. 开发环境配置
- `dev-config.js` 中的 `isDev` 被设置为 `true`
- `shouldUseMock()` 函数在开发环境下返回 `true`
- 所有API请求被重定向到Mock数据响应

## 如何切换到真实服务器？

### 方案一：直接修改配置（已实施）

1. 修改 `mina/utils/dev-config.js` 文件：
```javascript
// 将 isDev 设置为 false
const isDev = false;
```

2. 这样配置后：
   - `shouldUseMock()` 返回 `false`
   - API请求将发送到真实服务器：`https://api.membuddy.ravey.site`
   - 不再使用Mock数据

### 方案二：环境变量控制（可选）

如果需要灵活切换Mock和真实服务器，可以使用环境变量：

```javascript
// 在 dev-config.js 中
const isDev = process.env.NODE_ENV === 'development' || false;
```

然后通过设置环境变量来控制：
- 开发时使用Mock：`NODE_ENV=development`
- 生产时使用真实服务器：`NODE_ENV=production`

## 注意事项

### 1. SSL证书问题
切换到真实服务器前，请确保：
- SSL证书来自可信的CA机构
- 支持TLS 1.2及以上版本
- 证书绑定的域名与API域名一致
- 可以使用 [MySSL.com](https://myssl.com) 检测证书状态

### 2. 服务器状态
- 确保 `https://api.membuddy.ravey.site` 服务器正常运行
- API接口可以正常响应
- 网络连接稳定

### 3. 小程序域名配置
- 在微信公众平台配置服务器域名
- 将 `api.membuddy.ravey.site` 添加到request合法域名
- 参考：`小程序域名配置指南.md`

## 当前状态

✅ **已切换到真实服务器模式**
- `isDev = false`
- API请求将发送到：`https://api.membuddy.ravey.site`
- 不再使用Mock数据

## 测试建议

1. **重新编译小程序**：
   ```bash
   # 在 mina 目录下
   npm run dev
   ```

2. **测试登录功能**：
   - 尝试微信登录
   - 检查网络请求是否发送到真实服务器
   - 确认用户信息正确获取

3. **如果遇到问题**：
   - 检查控制台错误信息
   - 确认服务器状态
   - 必要时可以临时切换回Mock模式进行开发

## 快速切换命令

```bash
# 切换到真实服务器（当前状态）
sed -i '' 's/const isDev = true/const isDev = false/' mina/utils/dev-config.js

# 切换到Mock模式（如果需要）
sed -i '' 's/const isDev = false/const isDev = true/' mina/utils/dev-config.js
```