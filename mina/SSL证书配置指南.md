# SSL证书配置指南

## 问题分析

### ERR_SSL_VERSION_OR_CIPHER_MISMATCH 错误原因

1. **SSL/TLS版本不兼容**：微信小程序要求服务器支持TLS 1.2或更高版本
2. **加密套件不匹配**：服务器的加密套件与小程序客户端不兼容
3. **证书链问题**：SSL证书链不完整或配置错误
4. **域名不匹配**：证书绑定的域名与请求域名不一致

### 当前状态检测结果

通过curl测试 `https://api.membuddy.ravey.site`：
- ✅ SSL证书有效（Let's Encrypt颁发）
- ✅ 支持TLS 1.3协议
- ✅ 证书域名匹配
- ✅ 证书链完整
- ⚠️ 微信小程序真机环境可能存在兼容性问题

## 解决方案

### 1. 临时解决方案（已实施）

#### Mock数据模式
- 创建了 `utils/dev-config.js` 开发环境配置
- 修改了 `utils/api.js` 支持自动降级到Mock模式
- SSL错误时自动切换到离线模式，使用本地Mock数据

#### 使用方法
```javascript
// 在 dev-config.js 中设置
const isDev = true; // 开发模式

// API会自动检测SSL错误并切换到Mock模式
```

### 2. SSL证书优化建议

#### 服务器配置检查
```bash
# 检查TLS版本支持
openssl s_client -connect api.membuddy.ravey.site:443 -tls1_2
openssl s_client -connect api.membuddy.ravey.site:443 -tls1_3

# 检查加密套件
nmap --script ssl-enum-ciphers -p 443 api.membuddy.ravey.site
```

#### Nginx配置优化
```nginx
server {
    listen 443 ssl http2;
    server_name api.membuddy.ravey.site;
    
    # SSL证书配置
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # TLS版本配置
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # 加密套件配置（兼容微信小程序）
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256;
    ssl_prefer_server_ciphers on;
    
    # 其他SSL配置
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### 3. 微信小程序配置

#### project.config.json 设置
```json
{
  "setting": {
    "urlCheck": false,  // 开发环境跳过域名校验
    "es6": true,
    "enhance": true,
    "postcss": true,
    "minified": true
  }
}
```

#### 合法域名配置
1. 登录微信公众平台
2. 进入小程序管理后台
3. 开发 → 开发管理 → 开发设置 → 服务器域名
4. 添加 `https://api.membuddy.ravey.site` 到request合法域名

### 4. 调试和测试

#### 开发者工具测试
```javascript
// 在控制台测试网络请求
wx.request({
  url: 'https://api.membuddy.ravey.site/health',
  method: 'GET',
  success: (res) => {
    console.log('请求成功:', res);
  },
  fail: (err) => {
    console.error('请求失败:', err);
  }
});
```

#### 真机调试
1. 确保手机网络正常
2. 检查微信版本（建议最新版本）
3. 清除小程序缓存重新测试
4. 查看调试面板的网络请求详情

### 5. 监控和日志

#### 错误监控
```javascript
// 在 api.js 中添加错误监控
fail: (error) => {
  // 记录SSL相关错误
  if (error.errMsg && error.errMsg.includes('SSL')) {
    console.error('SSL错误详情:', {
      url: config.url,
      error: error.errMsg,
      timestamp: new Date().toISOString()
    });
    
    // 上报错误到监控系统
    wx.reportAnalytics('ssl_error', {
      url: config.url,
      error: error.errMsg
    });
  }
}
```

## 常见问题排查

### Q1: 开发者工具正常，真机报SSL错误
**A**: 真机环境的TLS实现可能更严格，建议：
- 检查服务器加密套件配置
- 确保证书链完整
- 使用Mock模式进行开发

### Q2: 证书有效但仍然报错
**A**: 可能是加密套件不兼容，建议：
- 更新服务器SSL配置
- 添加更多兼容的加密套件
- 检查中间证书是否正确安装

### Q3: 如何在生产环境禁用Mock模式
**A**: 修改 `dev-config.js`：
```javascript
const isDev = false; // 生产环境设置为false
```

## 最佳实践

1. **开发阶段**：使用Mock模式确保功能开发不受网络问题影响
2. **测试阶段**：逐步切换到真实API，测试网络兼容性
3. **生产环境**：确保SSL配置完全兼容，禁用Mock模式
4. **监控告警**：设置SSL错误监控，及时发现问题

## 相关工具

- [MySSL.com](https://myssl.com) - SSL证书检测
- [SSL Labs](https://www.ssllabs.com/ssltest/) - SSL配置评估
- [SSLeye](https://www.ssleye.com) - TLS版本检测
- 微信开发者工具 - 网络调试面板