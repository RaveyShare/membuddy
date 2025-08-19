#!/usr/bin/env python3
"""
测试mock AI功能的简单脚本
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 加载.env文件
from dotenv import load_dotenv
load_dotenv()

from ai_manager import AIManager
import json

def test_mock_ai():
    """测试mock AI功能"""
    print("开始测试Mock AI功能...")
    
    # 检查环境变量
    import os
    use_mock = os.getenv("USE_MOCK_AI", "false")
    print(f"USE_MOCK_AI环境变量: {use_mock}")
    print(f"AI_PROVIDER环境变量: {os.getenv('AI_PROVIDER', 'not set')}")
    print(f"REGION环境变量: {os.getenv('REGION', 'not set')}")
    
    try:
        # 创建AI管理器实例
        ai_manager = AIManager()
        
        # 测试生成记忆辅助
        test_content = "测试mock AI功能"
        print(f"测试内容: {test_content}")
        
        result = ai_manager.generate_memory_aids(test_content)
        
        print("\n=== Mock AI 响应结果 ===")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        # 验证结果结构
        if result and 'mindMap' in result and 'mnemonics' in result and 'sensoryAssociations' in result:
            print("\n✅ Mock AI功能正常工作！")
            print(f"- 思维导图节点数: {len(result['mindMap']['children'])}")
            print(f"- 助记符数量: {len(result['mnemonics'])}")
            print(f"- 感官联想数量: {len(result['sensoryAssociations'])}")
        else:
            print("\n❌ Mock AI返回的数据结构不完整")
            
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_mock_ai()