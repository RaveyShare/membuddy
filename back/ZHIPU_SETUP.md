# 智谱AI配置指南

本文档介绍如何配置智谱AI作为MemBuddy的AI提供商，适用于国内用户。

## 🚀 快速开始

### 1. 注册智谱AI账号

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 点击「注册」创建账号
3. 完成手机号验证和实名认证
4. 新用户可获得免费的体验额度

### 2. 获取API密钥

1. 登录智谱AI开放平台
2. 点击右上角头像 → 「API Keys」
3. 点击「创建新的API Key」
4. 复制生成的API密钥（格式类似：`sk-xxxxxxxxxxxxxxxx`）

### 3. 配置环境变量

在 `back/.env` 文件中配置以下变量：

```bash
# AI 提供商配置
AI_PROVIDER=zhipu
REGION=china

# 智谱AI配置
ZHIPU_API_KEY=你的智谱AI密钥
ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4
ZHIPU_MODEL=glm-4
```

### 4. 重启服务

```bash
# 停止当前服务
# 在后端目录重新启动
cd back
python3 main.py
```

### 5. 测试配置

运行测试脚本验证配置：

```bash
cd back
python3 test_zhipu.py
```

## 📋 支持的模型

智谱AI提供多种模型，推荐配置：

- **glm-4**: 最新旗舰模型，综合能力强
- **glm-4-plus**: 增强版本，更高精度
- **glm-4-air**: 轻量版本，响应更快
- **glm-4-flash**: 极速版本，适合高并发

## 💰 计费说明

- **新用户福利**: 注册即送2000万tokens体验包
- **按量计费**: 根据实际使用的tokens数量计费
- **价格透明**: 详见[官方价格页面](https://open.bigmodel.cn/pricing)

## 🔧 高级配置

### 自定义参数

可以在代码中调整以下参数：

```python
# 在 ai_providers_china.py 中的 ZhipuProvider 类
data = {
    "model": self.model,
    "temperature": 0.7,      # 创造性控制 (0-1)
    "max_tokens": 4000,      # 最大输出长度
    "top_p": 0.9,           # 核采样参数
    "response_format": {"type": "json_object"}  # JSON格式输出
}
```

### 错误处理

系统已内置完善的错误处理机制：

- **API密钥无效**: 自动回退到默认响应
- **余额不足**: 显示警告并使用备用方案
- **网络超时**: 重试机制和友好提示
- **格式错误**: JSON解析失败时的容错处理

## 🐛 常见问题

### Q: 提示"余额不足"怎么办？
A: 需要在智谱AI平台充值或等待免费额度恢复。

### Q: API调用失败怎么办？
A: 检查网络连接、API密钥是否正确、是否有足够余额。

### Q: 如何切换回其他AI提供商？
A: 修改 `.env` 文件中的 `AI_PROVIDER` 为 `gemini` 或其他支持的提供商。

### Q: 生成的内容质量不满意？
A: 可以调整 `temperature` 参数或尝试不同的模型版本。

## 📞 技术支持

- [智谱AI官方文档](https://open.bigmodel.cn/dev/api)
- [智谱AI开发者社区](https://zhipu.ai/)
- [MemBuddy项目文档](../README.md)

## 🔄 版本更新

- **v1.0**: 基础智谱AI集成
- **v1.1**: 添加错误处理和默认响应
- **v1.2**: 支持多模型配置和参数调优

---

配置完成后，您就可以在MemBuddy中使用智谱AI来生成高质量的记忆辅助内容了！🎉