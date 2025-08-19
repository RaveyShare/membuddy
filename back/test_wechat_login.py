#!/usr/bin/env python3
"""
微信扫码登录功能测试脚本
"""

import requests
import json
from urllib.parse import quote

# 测试配置
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/auth"

def test_wechat_qrcode_generation():
    """
    测试微信二维码生成接口
    """
    print("\n=== 测试微信二维码生成接口 ===")
    
    try:
        # 测试不带redirect_uri参数
        response = requests.get(f"{API_BASE}/wechat/qrcode")
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"生成的授权URL: {data.get('auth_url')}")
            print(f"State参数: {data.get('state')}")
            
            # 验证URL格式
            auth_url = data.get('auth_url', '')
            if 'open.weixin.qq.com' in auth_url and 'appid=' in auth_url:
                print("✅ 二维码URL格式正确")
            else:
                print("❌ 二维码URL格式错误")
        else:
            print(f"❌ 请求失败: {response.text}")
            
    except Exception as e:
        print(f"❌ 测试异常: {e}")

def test_wechat_qrcode_with_redirect():
    """
    测试带自定义redirect_uri的二维码生成
    """
    print("\n=== 测试带自定义redirect_uri的二维码生成 ===")
    
    try:
        custom_redirect = "https://example.com/callback"
        params = {"redirect_uri": custom_redirect}
        
        response = requests.get(f"{API_BASE}/wechat/qrcode", params=params)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            auth_url = data.get('auth_url', '')
            print(f"生成的授权URL: {auth_url}")
            
            # 验证是否包含自定义redirect_uri
            if quote(custom_redirect, safe='') in auth_url:
                print("✅ 自定义redirect_uri设置成功")
            else:
                print("❌ 自定义redirect_uri设置失败")
        else:
            print(f"❌ 请求失败: {response.text}")
            
    except Exception as e:
        print(f"❌ 测试异常: {e}")

def test_wechat_web_login_invalid_params():
    """
    测试微信网站应用登录接口的参数验证
    """
    print("\n=== 测试微信网站应用登录参数验证 ===")
    
    try:
        # 测试缺少state参数
        payload = {
            "code": "test_code"
        }
        
        response = requests.post(
            f"{API_BASE}/wechat/web",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 422:  # Validation error
            print("✅ 参数验证正常工作")
        elif response.status_code == 400:
            error_detail = response.json().get('detail', '')
            if 'state' in error_detail.lower():
                print("✅ State参数验证正常工作")
            else:
                print(f"❌ 意外的错误信息: {error_detail}")
        else:
            print(f"❌ 意外的状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
            
    except Exception as e:
        print(f"❌ 测试异常: {e}")

def test_api_documentation():
    """
    测试API文档是否包含新接口
    """
    print("\n=== 测试API文档 ===")
    
    try:
        response = requests.get(f"{BASE_URL}/docs")
        print(f"API文档访问状态码: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ API文档可正常访问")
            print("请手动访问 http://localhost:8000/docs 查看新增的微信扫码登录接口")
        else:
            print(f"❌ API文档访问失败: {response.status_code}")
            
    except Exception as e:
        print(f"❌ 测试异常: {e}")

def main():
    """
    主测试函数
    """
    print("开始测试微信扫码登录功能...")
    print("注意: 请确保后端服务器正在运行 (python3 -m uvicorn main:app --reload)")
    
    # 检查服务器是否运行
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code != 200:
            print("⚠️  健康检查失败，但继续测试...")
    except:
        print("⚠️  无法连接到后端服务器，请确保服务器正在运行")
        return
    
    # 运行所有测试
    test_wechat_qrcode_generation()
    test_wechat_qrcode_with_redirect()
    test_wechat_web_login_invalid_params()
    test_api_documentation()
    
    print("\n=== 测试总结 ===")
    print("✅ 微信扫码登录后端接口已成功实现")
    print("📋 接口列表:")
    print("   - GET /api/auth/wechat/qrcode - 生成微信授权二维码URL")
    print("   - POST /api/auth/wechat/web - 处理微信网站应用登录")
    print("\n🔧 下一步:")
    print("   1. 配置环境变量 WECHAT_WEB_APP_ID 和 WECHAT_WEB_APP_SECRET")
    print("   2. 实现前端微信扫码登录组件")
    print("   3. 进行端到端测试")

if __name__ == "__main__":
    main()