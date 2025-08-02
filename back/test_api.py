"""
API端点测试类
测试FastAPI应用的各种端点和功能
"""

import unittest
import pytest
from unittest.mock import Mock, patch, MagicMock
import json
import uuid
import asyncio
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app
from schemas import UserCreate, UserLogin, MemoryItemCreate, MemoryGenerateRequest
from ai_manager import AIManager


class TestMainApp(unittest.TestCase):
    """主应用测试类"""
    
    def setUp(self):
        """测试前设置"""
        self.client = TestClient(app)
        
        # 设置测试环境变量
        os.environ['SUPABASE_URL'] = 'https://test.supabase.co'
        os.environ['SUPABASE_KEY'] = 'test_supabase_key'
        os.environ['SUPABASE_JWT_SECRET'] = 'test_jwt_secret'
        os.environ['GEMINI_API_KEY'] = 'test_gemini_key'
        os.environ['AI_PROVIDER'] = 'gemini'
        os.environ['REGION'] = 'global'
        
        # 创建测试用户
        self.test_user = {
            'email': 'test@example.com',
            'password': 'testpassword',
            'full_name': 'Test User'
        }
        
        # 创建测试token
        self.test_token = self._create_test_token()
    
    def tearDown(self):
        """测试后清理"""
        # 清理环境变量
        for key in ['SUPABASE_URL', 'SUPABASE_KEY', 'SUPABASE_JWT_SECRET', 
                   'GEMINI_API_KEY', 'AI_PROVIDER', 'REGION']:
            if key in os.environ:
                del os.environ[key]
    
    def _create_test_token(self):
        """创建测试JWT token"""
        import jwt
        payload = {
            'sub': 'test_user_id',
            'email': 'test@example.com',
            'full_name': 'Test User',
            'exp': datetime.utcnow() + timedelta(days=1)
        }
        return jwt.encode(payload, 'test_jwt_secret', algorithm='HS256')
    
    def _get_auth_headers(self):
        """获取认证头"""
        return {'Authorization': f'Bearer {self.test_token}'}
    
    def test_health_check(self):
        """测试健康检查端点"""
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('status', data)
        self.assertEqual(data['status'], 'healthy')
        self.assertIn('timestamp', data)
    
    def test_health_check_cors(self):
        """测试健康检查端点的CORS"""
        response = self.client.get('/health', headers={'Origin': 'http://localhost:3000'})
        self.assertEqual(response.status_code, 200)
        
        # 检查CORS头
        self.assertIn('access-control-allow-origin', response.headers)
    
    @patch('main.get_anon_supabase')
    def test_register_user_success(self, mock_get_supabase):
        """测试成功用户注册"""
        # 模拟Supabase响应
        mock_supabase = Mock()
        mock_response = Mock()
        mock_response.user = Mock()
        mock_response.user.id = 'test_user_id'
        mock_response.user.email = 'test@example.com'
        mock_response.user.user_metadata = {'full_name': 'Test User'}
        mock_supabase.auth.sign_up.return_value = mock_response
        mock_get_supabase.return_value = mock_supabase
        
        response = self.client.post('/api/auth/register', json=self.test_user)
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('id', data)
        self.assertIn('email', data)
        self.assertIn('full_name', data)
        self.assertEqual(data['email'], 'test@example.com')
    
    @patch('main.get_anon_supabase')
    def test_register_user_failure(self, mock_get_supabase):
        """测试用户注册失败"""
        mock_supabase = Mock()
        mock_supabase.auth.sign_up.side_effect = Exception("Registration failed")
        mock_get_supabase.return_value = mock_supabase
        
        response = self.client.post('/api/auth/register', json=self.test_user)
        
        self.assertEqual(response.status_code, 400)
    
    @patch('main.get_anon_supabase')
    def test_login_success(self, mock_get_supabase):
        """测试成功登录"""
        # 模拟Supabase响应
        mock_supabase = Mock()
        mock_response = Mock()
        mock_response.user = Mock()
        mock_response.user.id = 'test_user_id'
        mock_response.user.email = 'test@example.com'
        mock_response.user.user_metadata = {'full_name': 'Test User'}
        mock_response.session = Mock()
        mock_response.session.expires_at = int((datetime.utcnow() + timedelta(days=1)).timestamp())
        mock_supabase.auth.sign_in_with_password.return_value = mock_response
        mock_get_supabase.return_value = mock_supabase
        
        login_data = {
            'email': 'test@example.com',
            'password': 'testpassword'
        }
        
        response = self.client.post('/api/auth/login', json=login_data)
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('access_token', data)
        self.assertIn('token_type', data)
        self.assertEqual(data['token_type'], 'bearer')
    
    @patch('main.get_anon_supabase')
    def test_login_failure(self, mock_get_supabase):
        """测试登录失败"""
        mock_supabase = Mock()
        mock_supabase.auth.sign_in_with_password.side_effect = Exception("Login failed")
        mock_get_supabase.return_value = mock_supabase
        
        login_data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        
        response = self.client.post('/api/auth/login', json=login_data)
        
        self.assertEqual(response.status_code, 400)
    
    def test_forgot_password(self):
        """测试忘记密码"""
        forgot_data = {'email': 'test@example.com'}
        
        with patch('main.get_anon_supabase') as mock_get_supabase:
            mock_supabase = Mock()
            mock_supabase.auth.reset_password_for_email.return_value = None
            mock_get_supabase.return_value = mock_supabase
            
            response = self.client.post('/api/auth/forgot-password', json=forgot_data)
            
            self.assertEqual(response.status_code, 200)
            
            data = response.json()
            self.assertIn('message', data)
    
    def test_unauthorized_access(self):
        """测试未授权访问"""
        # 测试需要认证的端点
        endpoints = [
            ('/api/memory_items', 'GET'),
            ('/api/memory_items', 'POST'),
            ('/api/memory/generate', 'POST'),
            ('/api/generate/image', 'POST'),
            ('/api/generate/audio', 'POST'),
        ]
        
        for endpoint, method in endpoints:
            with self.subTest(endpoint=endpoint, method=method):
                if method == 'GET':
                    response = self.client.get(endpoint)
                else:
                    response = self.client.post(endpoint, json={})
                
                self.assertEqual(response.status_code, 401)
    
    def test_invalid_token(self):
        """测试无效token"""
        invalid_headers = {'Authorization': 'Bearer invalid_token'}
        
        response = self.client.get('/api/memory_items', headers=invalid_headers)
        self.assertEqual(response.status_code, 401)
    
    def test_missing_token(self):
        """测试缺失token"""
        response = self.client.get('/api/memory_items')
        self.assertEqual(response.status_code, 401)
    
    @patch('main.get_supabase_authed')
    @patch('main.get_current_user')
    def test_get_memory_items_success(self, mock_get_user, mock_get_supabase):
        """测试成功获取记忆项目"""
        # 模拟用户认证
        mock_get_user.return_value = {
            'id': 'test_user_id',
            'email': 'test@example.com',
            'full_name': 'Test User',
            'token': self.test_token
        }
        
        # 模拟Supabase响应
        mock_supabase = Mock()
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = Mock(
            data=[
                {
                    'id': 'test_item_id',
                    'user_id': 'test_user_id',
                    'title': 'Test Item',
                    'content': 'Test content',
                    'created_at': datetime.utcnow().isoformat(),
                    'updated_at': datetime.utcnow().isoformat()
                }
            ]
        )
        
        # 模拟memory aids查询
        mock_supabase.table.return_value.select.return_value.in_.return_value.execute.return_value = Mock(
            data=[
                {
                    'memory_item_id': 'test_item_id',
                    'mind_map_data': '{}',
                    'mnemonics_data': '[]',
                    'sensory_associations_data': '[]'
                }
            ]
        )
        
        mock_get_supabase.return_value = mock_supabase
        
        response = self.client.get('/api/memory_items', headers=self._get_auth_headers())
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIsInstance(data, list)
        if data:
            self.assertIn('id', data[0])
            self.assertIn('title', data[0])
            self.assertIn('content', data[0])
    
    @patch('main.get_supabase_authed')
    @patch('main.get_current_user')
    @patch('main.AIManager')
    def test_create_memory_item_success(self, mock_ai_manager, mock_get_user, mock_get_supabase):
        """测试成功创建记忆项目"""
        # 模拟用户认证
        mock_get_user.return_value = {
            'id': 'test_user_id',
            'email': 'test@example.com',
            'full_name': 'Test User',
            'token': self.test_token
        }
        
        # 模拟Supabase响应
        mock_supabase = Mock()
        mock_supabase.table.return_value.insert.return_value.execute.return_value = Mock(
            data=[
                {
                    'id': 'test_item_id',
                    'user_id': 'test_user_id',
                    'title': 'Test Item',
                    'content': 'Test content',
                    'created_at': datetime.utcnow().isoformat(),
                    'updated_at': datetime.utcnow().isoformat()
                }
            ]
        )
        
        # 模拟AI管理器
        mock_manager = Mock()
        mock_manager.generate_memory_aids.return_value = {
            'mindMap': {'id': 'root', 'label': 'Test', 'children': []},
            'mnemonics': [],
            'sensoryAssociations': []
        }
        mock_manager.generate_review_schedule_from_ebbinghaus.return_value = {
            'review_dates': [datetime.utcnow().isoformat()]
        }
        mock_ai_manager.return_value = mock_manager
        
        mock_get_supabase.return_value = mock_supabase
        
        item_data = {
            'title': 'Test Item',
            'content': 'Test content for memory',
            'category': 'test'
        }
        
        response = self.client.post('/api/memory_items', 
                                   json=item_data, 
                                   headers=self._get_auth_headers())
        
        self.assertEqual(response.status_code, 201)
        
        data = response.json()
        self.assertIn('id', data)
        self.assertIn('title', data)
        self.assertIn('content', data)
    
    @patch('main.AIManager')
    def test_generate_memory_aids_success(self, mock_ai_manager):
        """测试成功生成记忆辅助"""
        # 模拟AI管理器
        mock_manager = Mock()
        mock_manager.generate_memory_aids.return_value = {
            'mindMap': {'id': 'root', 'label': 'Test', 'children': []},
            'mnemonics': [
                {
                    'id': 'test',
                    'title': 'Test Mnemonic',
                    'content': 'Test content',
                    'type': 'rhyme'
                }
            ],
            'sensoryAssociations': []
        }
        mock_ai_manager.return_value = mock_manager
        
        request_data = {
            'content': 'Test content for memory aids generation'
        }
        
        response = self.client.post('/api/memory/generate', 
                                   json=request_data, 
                                   headers=self._get_auth_headers())
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('mindMap', data)
        self.assertIn('mnemonics', data)
        self.assertIn('sensoryAssociations', data)
    
    @patch('main.AIManager')
    def test_generate_memory_aids_ai_error(self, mock_ai_manager):
        """测试AI服务错误处理"""
        from ai_manager import AIError
        
        # 模拟AI管理器抛出错误
        mock_manager = Mock()
        mock_manager.generate_memory_aids.side_effect = AIError("AI service error")
        mock_ai_manager.return_value = mock_manager
        
        request_data = {
            'content': 'Test content for memory aids generation'
        }
        
        response = self.client.post('/api/memory/generate', 
                                   json=request_data, 
                                   headers=self._get_auth_headers())
        
        self.assertEqual(response.status_code, 502)
    
    @patch('main.AIManager')
    async def test_generate_image_success(self, mock_ai_manager):
        """测试成功生成图像提示词"""
        # 模拟AI管理器
        mock_manager = Mock()
        mock_manager.generate_image.return_value = {
            'prompt': 'Generated image prompt',
            'message': 'Image generation feature is under development',
            'status': 'prompt_generated'
        }
        mock_ai_manager.return_value = mock_manager
        
        request_data = {
            'content': 'Test content for image generation',
            'context': 'Visual association'
        }
        
        response = self.client.post('/api/generate/image', 
                                   json=request_data, 
                                   headers=self._get_auth_headers())
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('prompt', data)
        self.assertIn('message', data)
        self.assertIn('status', data)
        self.assertEqual(data['status'], 'prompt_generated')
    
    @patch('main.AIManager')
    async def test_generate_audio_success(self, mock_ai_manager):
        """测试成功生成音频提示词"""
        # 模拟AI管理器
        mock_manager = Mock()
        mock_manager.generate_audio.return_value = {
            'script': 'Test script',
            'suggestions': 'Generated audio suggestions',
            'message': 'Audio generation feature is under development',
            'status': 'prompt_generated'
        }
        mock_ai_manager.return_value = mock_manager
        
        request_data = {
            'content': 'Test content for audio generation',
            'context': 'Auditory association'
        }
        
        response = self.client.post('/api/generate/audio', 
                                   json=request_data, 
                                   headers=self._get_auth_headers())
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('script', data)
        self.assertIn('suggestions', data)
        self.assertIn('message', data)
        self.assertIn('status', data)
        self.assertEqual(data['status'], 'prompt_generated')
    
    def test_error_handling(self):
        """测试错误处理"""
        # 测试无效的JSON
        response = self.client.post('/api/auth/register', 
                                   data='invalid json', 
                                   headers={'Content-Type': 'application/json'})
        self.assertEqual(response.status_code, 422)
        
        # 测试缺少必需字段
        response = self.client.post('/api/auth/register', 
                                   json={'email': 'test@example.com'})
        self.assertEqual(response.status_code, 422)
    
    def test_cors_configuration(self):
        """测试CORS配置"""
        # 测试允许的源
        allowed_origins = [
            'http://localhost:3000',
            'http://localhost:8000',
            'https://membuddy.ravey.site'
        ]
        
        for origin in allowed_origins:
            response = self.client.get('/health', headers={'Origin': origin})
            self.assertEqual(response.status_code, 200)
            self.assertIn('access-control-allow-origin', response.headers)
    
    def test_rate_limiting_simulation(self):
        """测试速率限制模拟"""
        # 快速发送多个请求
        for i in range(10):
            response = self.client.get('/health')
            self.assertEqual(response.status_code, 200)
    
    @patch('main.get_supabase_authed')
    @patch('main.get_current_user')
    def test_get_memory_item_by_id(self, mock_get_user, mock_get_supabase):
        """测试根据ID获取记忆项目"""
        # 模拟用户认证
        mock_get_user.return_value = {
            'id': 'test_user_id',
            'email': 'test@example.com',
            'full_name': 'Test User',
            'token': self.test_token
        }
        
        # 模拟Supabase响应
        mock_supabase = Mock()
        test_item_id = str(uuid.uuid4())
        
        # 模拟主项目查询
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = Mock(
            data={
                'id': test_item_id,
                'user_id': 'test_user_id',
                'title': 'Test Item',
                'content': 'Test content',
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
        )
        
        # 模拟memory aids查询
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = Mock(
            data=[
                {
                    'memory_item_id': test_item_id,
                    'mind_map_data': '{}',
                    'mnemonics_data': '[]',
                    'sensory_associations_data': '[]'
                }
            ]
        )
        
        mock_get_supabase.return_value = mock_supabase
        
        response = self.client.get(f'/api/memory_items/{test_item_id}', 
                                   headers=self._get_auth_headers())
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('id', data)
        self.assertEqual(data['id'], test_item_id)
    
    @patch('main.get_supabase_authed')
    @patch('main.get_current_user')
    def test_delete_memory_item(self, mock_get_user, mock_get_supabase):
        """测试删除记忆项目"""
        # 模拟用户认证
        mock_get_user.return_value = {
            'id': 'test_user_id',
            'email': 'test@example.com',
            'full_name': 'Test User',
            'token': self.test_token
        }
        
        # 模拟Supabase响应
        mock_supabase = Mock()
        test_item_id = str(uuid.uuid4())
        
        mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = Mock(
            data=None
        )
        
        mock_get_supabase.return_value = mock_supabase
        
        response = self.client.delete(f'/api/memory_items/{test_item_id}', 
                                     headers=self._get_auth_headers())
        
        self.assertEqual(response.status_code, 204)
    
    def test_exception_handlers(self):
        """测试异常处理器"""
        # 测试404错误
        response = self.client.get('/nonexistent-endpoint')
        self.assertEqual(response.status_code, 404)
        
        # 测试方法不允许
        response = self.client.patch('/health')
        self.assertEqual(response.status_code, 405)


class TestAPISecurity(unittest.TestCase):
    """API安全测试类"""
    
    def setUp(self):
        """测试前设置"""
        self.client = TestClient(app)
    
    def test_sql_injection_prevention(self):
        """测试SQL注入防护"""
        malicious_input = "test'; DROP TABLE users; --"
        
        # 测试登录端点
        response = self.client.post('/api/auth/login', 
                                   json={
                                       'email': malicious_input,
                                       'password': 'testpassword'
                                   })
        
        # 应该返回422（验证错误）或400（认证失败），而不是500
        self.assertIn(response.status_code, [400, 422])
    
    def test_xss_prevention(self):
        """测试XSS防护"""
        xss_payload = '<script>alert("xss")</script>'
        
        response = self.client.post('/api/auth/register', 
                                   json={
                                       'email': 'test@example.com',
                                       'password': 'testpassword',
                                       'full_name': xss_payload
                                   })
        
        # 应该正常处理，而不是执行脚本
        self.assertIn(response.status_code, [200, 400, 422])
    
    def test_large_payload_handling(self):
        """测试大负载处理"""
        # 创建一个很大的payload
        large_content = 'A' * 10000  # 10KB
        
        response = self.client.post('/api/auth/register', 
                                   json={
                                       'email': 'test@example.com',
                                       'password': 'testpassword',
                                       'full_name': large_content
                                   })
        
        # 应该处理大负载而不崩溃
        self.assertIn(response.status_code, [200, 400, 422, 413])
    
    def test_request_timeout_simulation(self):
        """测试请求超时模拟"""
        # 这个测试需要模拟超时情况
        # 在实际环境中，这需要更复杂的设置
        pass


class TestAPIPerformance(unittest.TestCase):
    """API性能测试类"""
    
    def setUp(self):
        """测试前设置"""
        self.client = TestClient(app)
    
    def test_response_time(self):
        """测试响应时间"""
        import time
        
        start_time = time.time()
        response = self.client.get('/health')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        self.assertEqual(response.status_code, 200)
        self.assertLess(response_time, 1.0)  # 响应时间应该小于1秒
    
    def test_concurrent_requests(self):
        """测试并发请求"""
        import threading
        import time
        
        results = []
        
        def make_request():
            response = self.client.get('/health')
            results.append(response.status_code)
        
        # 创建多个并发请求
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 所有请求都应该成功
        self.assertEqual(len(results), 10)
        self.assertTrue(all(status == 200 for status in results))


if __name__ == '__main__':
    # 运行测试
    unittest.main(verbosity=2)