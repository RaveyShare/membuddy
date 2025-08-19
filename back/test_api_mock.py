#!/usr/bin/env python3
"""
测试Mock AI的API端点
直接调用路由函数，绕过认证
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 加载.env文件
from dotenv import load_dotenv
load_dotenv()

import asyncio
from routers.ai_generation import generate_memory_aids_endpoint
from schemas import MemoryGenerateRequest

async def test_api_mock():
    """测试API层面的Mock AI功能"""
    print("开始测试API层面的Mock AI功能...")
    
    # 检查环境变量
    use_mock = os.getenv("USE_MOCK_AI", "false")
    print(f"USE_MOCK_AI环境变量: {use_mock}")
    
    try:
        # 创建请求对象
        request = MemoryGenerateRequest(content="测试API层面的Mock AI功能")
        
        # 直接调用API函数（绕过认证）
        # 注意：这里需要模拟current_user参数
        mock_user = {"id": "test_user"}
        result = await generate_memory_aids_endpoint(request, mock_user)
        
        print("\n✅ API层面的Mock AI功能正常工作！")
        print(f"返回数据类型: {type(result)}")
        
        # 检查返回结果的结构
        if hasattr(result, 'mindMap') and hasattr(result, 'mnemonics') and hasattr(result, 'sensoryAssociations'):
            print(f"- 思维导图: {result.mindMap.label if hasattr(result.mindMap, 'label') else '有数据'}")
            print(f"- 助记符数量: {len(result.mnemonics)}")
            print(f"- 感官联想数量: {len(result.sensoryAssociations)}")
        else:
            print(f"返回结果: {result}")
            
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_api_mock())