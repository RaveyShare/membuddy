#!/usr/bin/env python3
"""
测试通过HTTP请求调用Mock AI API
生成一个简单的JWT token用于测试
"""

import requests
import json
import jwt
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

def create_test_jwt():
    """创建一个测试用的JWT token"""
    # 使用环境变量中的JWT密钥，如果没有则使用默认值
    secret = os.getenv('SUPABASE_JWT_SECRET', 'test-secret-key')
    
    payload = {
        'sub': 'test-user-id',
        'email': 'test@example.com',
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=1)
    }
    
    token = jwt.encode(payload, secret, algorithm='HS256')
    return token

def test_http_api():
    """测试HTTP API调用"""
    print("开始测试HTTP API调用Mock AI功能...")
    
    # 创建测试token
    token = create_test_jwt()
    print(f"生成测试JWT token: {token[:50]}...")
    
    # API端点
    url = "http://localhost:8000/api/memory/generate"
    
    # 请求头
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    # 请求数据
    data = {
        "content": "测试HTTP API调用Mock AI功能"
    }
    
    try:
        print(f"发送请求到: {url}")
        print(f"请求数据: {json.dumps(data, ensure_ascii=False)}")
        
        response = requests.post(url, headers=headers, json=data, timeout=10)
        
        print(f"\n响应状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ HTTP API调用成功！")
            print(f"返回数据: {json.dumps(result, ensure_ascii=False, indent=2)}")
        else:
            print(f"\n❌ API调用失败")
            print(f"错误信息: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ 请求异常: {e}")
    except Exception as e:
        print(f"\n❌ 其他错误: {e}")

if __name__ == "__main__":
    test_http_api()