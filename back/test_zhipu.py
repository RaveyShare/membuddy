#!/usr/bin/env python3
"""
智谱AI配置测试脚本
用于验证智谱AI API是否正确配置和工作
"""

import os
import sys
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def test_zhipu_config():
    """测试智谱AI配置"""
    print("=== 智谱AI配置测试 ===")
    
    # 检查环境变量
    api_key = os.getenv("ZHIPU_API_KEY")
    base_url = os.getenv("ZHIPU_BASE_URL")
    model = os.getenv("ZHIPU_MODEL")
    ai_provider = os.getenv("AI_PROVIDER")
    region = os.getenv("REGION")
    
    print(f"AI_PROVIDER: {ai_provider}")
    print(f"REGION: {region}")
    print(f"ZHIPU_API_KEY: {'已配置' if api_key and api_key != 'your-zhipu-api-key-here' else '未配置或使用默认值'}")
    print(f"ZHIPU_BASE_URL: {base_url}")
    print(f"ZHIPU_MODEL: {model}")
    
    if not api_key or api_key == "your-zhipu-api-key-here":
        print("\n⚠️  警告: 智谱AI API密钥未正确配置!")
        print("请按以下步骤配置:")
        print("1. 访问 https://open.bigmodel.cn/ 注册账号")
        print("2. 获取API密钥")
        print("3. 在 .env 文件中设置 ZHIPU_API_KEY=你的密钥")
        return False
    
    # 测试AI提供商加载
    try:
        from ai_manager import AIManager
        
        ai_manager = AIManager(region="china")
        provider = ai_manager.get_ai_provider()
        
        print(f"\n✅ AI提供商加载成功: {type(provider).__name__}")
        
        # 测试生成记忆辅助 (使用默认响应，因为API密钥可能未配置)
        test_content = "测试内容：学习Python编程的基本概念"
        print(f"\n🧪 测试生成记忆辅助...")
        print(f"测试内容: {test_content}")
        
        result = provider.generate_memory_aids(test_content)
        
        if result and "mindMap" in result:
            print("✅ 记忆辅助生成成功!")
            print(f"思维导图主题: {result['mindMap']['label']}")
            print(f"记忆口诀数量: {len(result.get('mnemonics', []))}")
            print(f"感官联想数量: {len(result.get('sensoryAssociations', []))}")
            return True
        else:
            print("❌ 记忆辅助生成失败")
            return False
            
    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        return False

def main():
    """主函数"""
    success = test_zhipu_config()
    
    if success:
        print("\n🎉 智谱AI配置测试通过!")
        print("\n📝 下一步:")
        print("1. 确保已配置真实的智谱AI API密钥")
        print("2. 在前端测试记忆辅助生成功能")
        print("3. 检查生成的内容质量")
    else:
        print("\n❌ 智谱AI配置测试失败，请检查配置")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())