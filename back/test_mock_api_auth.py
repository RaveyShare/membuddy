#!/usr/bin/env python3

import requests
import json
from datetime import datetime, timedelta
import jwt
from dotenv import load_dotenv
import os

# 加载环境变量
load_dotenv()

def create_test_token():
    """创建测试用的JWT token"""
    secret = os.getenv('SUPABASE_JWT_SECRET')
    payload = {
        'sub': 'test-user-id',
        'email': 'test@example.com',
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(payload, secret, algorithm='HS256')

def test_mock_api():
    """测试Mock AI API"""
    try:
        # 创建JWT token
        token = create_test_token()
        
        # 设置请求头
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        # 请求数据
        data = {
            'content': '测试Mock AI模式 - 历史知识点'
        }
        
        # 发送请求
        response = requests.post(
            'http://localhost:8000/api/memory/generate',
            headers=headers,
            json=data,
            timeout=10
        )
        
        print(f"状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n=== Mock AI 响应成功 ===")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
            # 验证响应结构
            if 'mindMap' in result and 'mnemonics' in result and 'sensoryAssociations' in result:
                print("\n✅ Mock AI模式工作正常！")
                print(f"思维导图节点数: {len(result['mindMap'].get('children', []))}")
                print(f"助记符数量: {len(result['mnemonics'])}")
                print(f"感官联想数量: {len(result['sensoryAssociations'])}")
            else:
                print("\n❌ 响应结构不完整")
        else:
            print(f"\n❌ 请求失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            
    except Exception as e:
        print(f"\n❌ 测试失败: {str(e)}")

if __name__ == '__main__':
    print("开始测试Mock AI API...")
    test_mock_api()