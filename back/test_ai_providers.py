"""
AI Provider测试类
测试各个AI提供商的功能和错误处理
"""

import unittest
import pytest
import os
from unittest.mock import Mock, patch
from .ai_providers_china import QwenProvider, ErnieProvider
from .ai_providers_global import OpenAIProvider, ClaudeProvider
import json
import requests
import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from base_provider import BaseProvider, BaseHTTPProvider, BaseAsyncProvider
from ai_providers_global import GeminiProvider, OpenAIProvider, ClaudeProvider, GlobalAIProviderFactory
from ai_providers_china import QwenProvider, ZhipuProvider, ChinaAIProviderFactory


class TestBaseProvider(unittest.TestCase):
    """基础提供商测试类"""
    
    def setUp(self):
        """测试前设置"""
        self.provider = BaseProvider("test_provider", "test_model")
    
    def test_init(self):
        """测试初始化"""
        self.assertEqual(self.provider.name, "test_provider")
        self.assertEqual(self.provider.model, "test_model")
        self.assertEqual(self.provider.timeout, 30)
        self.assertEqual(self.provider.max_retries, 3)
    
    def test_clean_json_response(self):
        """测试JSON响应清理"""
        # 测试正常JSON
        json_text = '{"key": "value"}'
        cleaned = self.provider._clean_json_response(json_text)
        self.assertEqual(cleaned, json_text)
        
        # 测试带代码块的JSON
        json_with_code = """```json
{"key": "value"}
```"""
        cleaned = self.provider._clean_json_response(json_with_code)
        self.assertEqual(cleaned, '{"key": "value"}')
        
        # 测试带markdown的JSON
        json_with_markdown = "Some text ```json\n{\"key\": \"value\"}\n``` more text"
        cleaned = self.provider._clean_json_response(json_with_markdown)
        self.assertEqual(cleaned, '{"key": "value"}')
    
    def test_get_default_memory_aids(self):
        """测试获取默认记忆辅助结构"""
        default = self.provider._get_default_memory_aids("Test content")
        
        self.assertIn('mindMap', default)
        self.assertIn('mnemonics', default)
        self.assertIn('sensoryAssociations', default)
        
        # 检查结构
        self.assertEqual(default['mindMap']['id'], 'root')
        self.assertIsInstance(default['mnemonics'], list)
        self.assertIsInstance(default['sensoryAssociations'], list)
    
    def test_log_methods(self):
        """测试日志方法"""
        # 这些方法主要是为了测试不会抛出异常
        try:
            self.provider._log_request("test_method", 100, extra_param="test")
            self.provider._log_response("test_method", 200, status_code=200)
            self.provider._log_error("test_method", Exception("test error"), context="test")
        except Exception as e:
            self.fail(f"Log methods should not raise exceptions: {e}")


class TestBaseHTTPProvider(unittest.TestCase):
    """HTTP基础提供商测试类"""
    
    def setUp(self):
        """测试前设置"""
        self.provider = BaseHTTPProvider("test_http_provider", "test_model", "https://api.test.com")
    
    def test_init(self):
        """测试初始化"""
        self.assertEqual(self.provider.name, "test_http_provider")
        self.assertEqual(self.provider.model, "test_model")
        self.assertEqual(self.provider.base_url, "https://api.test.com")
    
    def test_get_headers(self):
        """测试获取请求头"""
        headers = self.provider._get_headers()
        
        self.assertIn('Content-Type', headers)
        self.assertEqual(headers['Content-Type'], 'application/json')
        self.assertIn('User-Agent', headers)
        self.assertIn('MemBuddy', headers['User-Agent'])
    
    def test_handle_response_success(self):
        """测试成功响应处理"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"result": "success"}
        
        result = self.provider._handle_response(mock_response, "test_method")
        
        self.assertEqual(result, {"result": "success"})
    
    def test_handle_response_error(self):
        """测试错误响应处理"""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.text = "Bad Request"
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("400 Client Error")
        
        with self.assertRaises(requests.exceptions.HTTPError):
            self.provider._handle_response(mock_response, "test_method")


class TestGeminiProvider(unittest.TestCase):
    """Gemini提供商测试类"""
    
    def setUp(self):
        """测试前设置"""
        os.environ['GEMINI_API_KEY'] = 'test_gemini_key'
        os.environ['GEMINI_BASE_URL'] = 'https://generativelanguage.googleapis.com'
        os.environ['GEMINI_MODEL'] = 'gemini-pro'
        
        self.provider = GeminiProvider()
    
    def tearDown(self):
        """测试后清理"""
        for key in ['GEMINI_API_KEY', 'GEMINI_BASE_URL', 'GEMINI_MODEL']:
            if key in os.environ:
                del os.environ[key]
    
    def test_init(self):
        """测试初始化"""
        self.assertEqual(self.provider.api_key, 'test_gemini_key')
        self.assertEqual(self.provider.base_url, 'https://generativelanguage.googleapis.com')
        self.assertEqual(self.provider.model, 'gemini-pro')
    
    @patch('ai_providers_global.genai.configure')
    @patch('ai_providers_global.genai.GenerativeModel')
    def test_generate_memory_aids_direct_api_success(self, mock_model_class, mock_configure):
        """测试直接API成功生成记忆辅助"""
        # 设置mock
        mock_model = Mock()
        mock_response = Mock()
        mock_response.text = '{"mindMap": {"id": "root"}, "mnemonics": [], "sensoryAssociations": []}'
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model
        
        result = self.provider.generate_memory_aids("Test content")
        
        self.assertIn('mindMap', result)
        mock_configure.assert_called_once_with(api_key='test_gemini_key')
        mock_model.generate_content.assert_called_once()
    
    @patch('ai_providers_global.requests.post')
    def test_generate_memory_aids_proxy_success(self, mock_post):
        """测试代理API成功生成记忆辅助"""
        # 使用代理URL
        os.environ['GEMINI_BASE_URL'] = 'https://proxy.example.com'
        provider = GeminiProvider()
        
        # 设置mock响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": '{"mindMap": {"id": "root"}, "mnemonics": [], "sensoryAssociations": []}'
                }
            }]
        }
        mock_post.return_value = mock_response
        
        result = provider.generate_memory_aids("Test content")
        
        self.assertIn('mindMap', result)
        mock_post.assert_called_once()
    
    def test_generate_memory_aids_error_handling(self):
        """测试错误处理"""
        # 使用代理URL但模拟失败
        os.environ['GEMINI_BASE_URL'] = 'https://proxy.example.com'
        provider = GeminiProvider()
        
        with patch('ai_providers_global.requests.post') as mock_post:
            mock_response = Mock()
            mock_response.raise_for_status.side_effect = requests.exceptions.RequestException("API Error")
            mock_post.return_value = mock_response
            
            result = provider.generate_memory_aids("Test content")
            
            # 应该返回默认响应
            self.assertIn('mindMap', result)
            self.assertIn('mnemonics', result)
    
    def test_get_default_response(self):
        """测试获取默认响应"""
        default = self.provider._get_default_response("Test content")
        
        self.assertIn('mindMap', default)
        self.assertIn('mnemonics', default)
        self.assertIn('sensoryAssociations', default)
        
        # 检查内容是否包含原始内容的截断
        self.assertIn('Test content', default['mindMap']['children'][0]['label'])


class TestQwenProvider(unittest.TestCase):
    """通义千问提供商测试类"""
    
    def setUp(self):
        """测试前设置"""
        os.environ['QWEN_API_KEY'] = 'test_qwen_key'
        os.environ['QWEN_BASE_URL'] = 'https://dashscope.aliyuncs.com/api/v1'
        os.environ['QWEN_MODEL'] = 'qwen-turbo'
        
        self.provider = QwenProvider()
    
    def tearDown(self):
        """测试后清理"""
        for key in ['QWEN_API_KEY', 'QWEN_BASE_URL', 'QWEN_MODEL']:
            if key in os.environ:
                del os.environ[key]
    
    def test_init(self):
        """测试初始化"""
        self.assertEqual(self.provider.api_key, 'test_qwen_key')
        self.assertEqual(self.provider.base_url, 'https://dashscope.aliyuncs.com/api/v1')
        self.assertEqual(self.provider.model, 'qwen-turbo')
    
    def test_init_missing_api_key(self):
        """测试缺少API密钥"""
        if 'QWEN_API_KEY' in os.environ:
            del os.environ['QWEN_API_KEY']
        
        with self.assertRaises(ValueError):
            QwenProvider()
    
    @patch('ai_providers_china.requests.post')
    def test_generate_memory_aids_success(self, mock_post):
        """测试成功生成记忆辅助"""
        # 设置mock响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {
                "text": '{"mindMap": {"id": "root"}, "mnemonics": [], "sensoryAssociations": []}'
            }
        }
        mock_post.return_value = mock_response
        
        result = self.provider.generate_memory_aids("Test content")
        
        self.assertIn('mindMap', result)
        mock_post.assert_called_once()
        
        # 验证调用参数
        call_args = mock_post.call_args
        self.assertIn('headers', call_args[1])
        self.assertIn('json', call_args[1])
        self.assertEqual(call_args[1]['json']['model'], 'qwen-turbo')
    
    @patch('ai_providers_china.requests.post')
    def test_generate_memory_aids_api_error(self, mock_post):
        """测试API错误处理"""
        mock_response = Mock()
        mock_response.raise_for_status.side_effect = requests.exceptions.RequestException("API Error")
        mock_post.return_value = mock_response
        
        result = self.provider.generate_memory_aids("Test content")
        
        # 应该返回默认响应
        self.assertIn('mindMap', result)
        self.assertIn('mnemonics', result)
    
    @patch('ai_providers_china.requests.post')
    def test_generate_text_success(self, mock_post):
        """测试成功生成文本"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {
                "text": "Generated text response"
            }
        }
        mock_post.return_value = mock_response
        
        result = self.provider.generate_text("Test prompt")
        
        self.assertEqual(result, "Generated text response")
        mock_post.assert_called_once()


class TestZhipuProvider(unittest.TestCase):
    """智谱AI提供商测试类"""
    
    def setUp(self):
        """测试前设置"""
        os.environ['ZHIPU_API_KEY'] = 'test_zhipu_key'
        os.environ['ZHIPU_BASE_URL'] = 'https://open.bigmodel.cn/api/paas/v4'
        os.environ['ZHIPU_MODEL'] = 'glm-4'
        
        self.provider = ZhipuProvider()
    
    def tearDown(self):
        """测试后清理"""
        for key in ['ZHIPU_API_KEY', 'ZHIPU_BASE_URL', 'ZHIPU_MODEL']:
            if key in os.environ:
                del os.environ[key]
    
    def test_init(self):
        """测试初始化"""
        self.assertEqual(self.provider.api_key, 'test_zhipu_key')
        self.assertEqual(self.provider.base_url, 'https://open.bigmodel.cn/api/paas/v4')
        self.assertEqual(self.provider.model, 'glm-4')
    
    def test_init_missing_api_key(self):
        """测试缺少API密钥"""
        if 'ZHIPU_API_KEY' in os.environ:
            del os.environ['ZHIPU_API_KEY']
        
        with self.assertRaises(ValueError):
            ZhipuProvider()
    
    @patch('ai_providers_china.requests.post')
    def test_generate_memory_aids_success(self, mock_post):
        """测试成功生成记忆辅助"""
        # 设置mock响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": '{"mindMap": {"id": "root"}, "mnemonics": [], "sensoryAssociations": []}'
                }
            }]
        }
        mock_post.return_value = mock_response
        
        result = self.provider.generate_memory_aids("Test content")
        
        self.assertIn('mindMap', result)
        mock_post.assert_called_once()
        
        # 验证调用参数
        call_args = mock_post.call_args
        self.assertIn('headers', call_args[1])
        self.assertIn('json', call_args[1])
        self.assertEqual(call_args[1]['json']['model'], 'glm-4')
        self.assertEqual(call_args[1]['json']['response_format'], {"type": "json_object"})


class TestGlobalAIProviderFactory(unittest.TestCase):
    """全局AI提供商工厂测试类"""
    
    def setUp(self):
        """测试前设置"""
        os.environ['AI_PROVIDER'] = 'gemini'
        os.environ['GEMINI_API_KEY'] = 'test_key'
    
    def tearDown(self):
        """测试后清理"""
        for key in ['AI_PROVIDER', 'GEMINI_API_KEY']:
            if key in os.environ:
                del os.environ[key]
    
    def test_get_gemini_provider(self):
        """测试获取Gemini提供商"""
        with patch.dict(os.environ, {'AI_PROVIDER': 'gemini'}):
            provider = GlobalAIProviderFactory.get_provider()
            self.assertIsInstance(provider, GeminiProvider)
    
    def test_get_openai_provider(self):
        """测试获取OpenAI提供商"""
        with patch.dict(os.environ, {'AI_PROVIDER': 'openai', 'OPENAI_API_KEY': 'test_key'}):
            provider = GlobalAIProviderFactory.get_provider()
            self.assertIsInstance(provider, OpenAIProvider)
    
    def test_get_claude_provider(self):
        """测试获取Claude提供商"""
        with patch.dict(os.environ, {'AI_PROVIDER': 'claude', 'CLAUDE_API_KEY': 'test_key'}):
            provider = GlobalAIProviderFactory.get_provider()
            self.assertIsInstance(provider, ClaudeProvider)
    
    def test_get_default_provider(self):
        """测试获取默认提供商"""
        provider = GlobalAIProviderFactory.get_provider()
        self.assertIsInstance(provider, GeminiProvider)
    
    def test_unsupported_provider(self):
        """测试不支持的提供商"""
        with patch.dict(os.environ, {'AI_PROVIDER': 'unsupported'}):
            with self.assertRaises(ValueError):
                GlobalAIProviderFactory.get_provider()


class TestChinaAIProviderFactory(unittest.TestCase):
    """中国AI提供商工厂测试类"""
    
    def setUp(self):
        """测试前设置"""
        os.environ['AI_PROVIDER'] = 'qwen'
        os.environ['QWEN_API_KEY'] = 'test_key'
    
    def tearDown(self):
        """测试后清理"""
        for key in ['AI_PROVIDER', 'QWEN_API_KEY']:
            if key in os.environ:
                del os.environ[key]
    
    def test_get_qwen_provider(self):
        """测试获取通义千问提供商"""
        with patch.dict(os.environ, {'AI_PROVIDER': 'qwen'}):
            provider = ChinaAIProviderFactory.get_provider()
            self.assertIsInstance(provider, QwenProvider)
    
    def test_get_zhipu_provider(self):
        """测试获取智谱AI提供商"""
        with patch.dict(os.environ, {'AI_PROVIDER': 'zhipu', 'ZHIPU_API_KEY': 'test_key'}):
            provider = ChinaAIProviderFactory.get_provider()
            self.assertIsInstance(provider, ZhipuProvider)
    
    def test_get_default_provider(self):
        """测试获取默认提供商"""
        provider = ChinaAIProviderFactory.get_provider()
        self.assertIsInstance(provider, QwenProvider)
    
    def test_unsupported_provider(self):
        """测试不支持的提供商"""
        with patch.dict(os.environ, {'AI_PROVIDER': 'unsupported'}):
            with self.assertRaises(ValueError):
                ChinaAIProviderFactory.get_provider()


class TestProviderIntegration(unittest.TestCase):
    """提供商集成测试"""
    
    def test_provider_interface_consistency(self):
        """测试提供商接口一致性"""
        # 测试所有提供商都有必需的方法
        providers = [
            GeminiProvider,
            QwenProvider,
            ZhipuProvider,
        ]
        
        for provider_class in providers:
            with self.subTest(provider=provider_class.__name__):
                # 检查必需的方法
                self.assertTrue(hasattr(provider_class, 'generate_memory_aids'))
                self.assertTrue(hasattr(provider_class, 'generate_text'))
                
                # 检查方法签名
                import inspect
                generate_memory_aids_sig = inspect.signature(provider_class.generate_memory_aids)
                generate_text_sig = inspect.signature(provider_class.generate_text)
                
                self.assertEqual(len(generate_memory_aids_sig.parameters), 2)  # self + content
                self.assertEqual(len(generate_text_sig.parameters), 2)  # self + prompt
    
    def test_error_handling_consistency(self):
        """测试错误处理一致性"""
        # 测试所有提供商在错误情况下都能返回有效的默认响应
        providers = [
            GeminiProvider,
            QwenProvider,
            ZhipuProvider,
        ]
        
        for provider_class in providers:
            with self.subTest(provider=provider_class.__name__):
                try:
                    # 尝试创建实例（可能会因为缺少API密钥而失败）
                    if provider_class == GeminiProvider:
                        os.environ['GEMINI_API_KEY'] = 'test_key'
                        os.environ['GEMINI_BASE_URL'] = 'https://generativelanguage.googleapis.com'
                    elif provider_class == QwenProvider:
                        os.environ['QWEN_API_KEY'] = 'test_key'
                        os.environ['QWEN_BASE_URL'] = 'https://dashscope.aliyuncs.com/api/v1'
                    elif provider_class == ZhipuProvider:
                        os.environ['ZHIPU_API_KEY'] = 'test_key'
                        os.environ['ZHIPU_BASE_URL'] = 'https://open.bigmodel.cn/api/paas/v4'
                    
                    provider = provider_class()
                    
                    # 测试默认响应结构
                    if hasattr(provider, '_get_default_memory_aids'):
                        default = provider._get_default_memory_aids("Test content")
                        self.assertIn('mindMap', default)
                        self.assertIn('mnemonics', default)
                        self.assertIn('sensoryAssociations', default)
                    
                    if hasattr(provider, '_get_default_response'):
                        default = provider._get_default_response("Test content")
                        self.assertIn('mindMap', default)
                        self.assertIn('mnemonics', default)
                        
                except Exception as e:
                    # 如果创建失败，确保是有意义的错误
                    self.assertIsInstance(e, (ValueError, KeyError))


if __name__ == '__main__':
    # 运行测试
    unittest.main(verbosity=2)