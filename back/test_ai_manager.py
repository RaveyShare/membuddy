"""
AI Manager测试类
测试AI管理器的各种功能和错误处理
"""

import unittest
import pytest
import asyncio
from unittest.mock import Mock, patch, MagicMock
import json
from datetime import datetime, timedelta
import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ai_manager import AIManager, AIError, ProviderError, TimeoutError, ConfigurationError, Region
from base_provider import BaseProvider


class TestAIManager(unittest.TestCase):
    """AI管理器测试类"""
    
    def setUp(self):
        """测试前设置"""
        # 设置测试环境变量
        os.environ['REGION'] = 'global'
        os.environ['LANGUAGE'] = 'en-US'
        os.environ['AI_PROVIDER'] = 'gemini'
        os.environ['GEMINI_API_KEY'] = 'test_gemini_key'
        os.environ['AI_REQUEST_TIMEOUT'] = '30'
        os.environ['AI_MAX_RETRIES'] = '3'
        
        # 创建AI管理器实例
        self.ai_manager = AIManager()
        
        # 清空指标
        self.ai_manager.clear_metrics()
    
    def tearDown(self):
        """测试后清理"""
        # 清理环境变量
        for key in ['REGION', 'LANGUAGE', 'AI_PROVIDER', 'GEMINI_API_KEY', 
                   'AI_REQUEST_TIMEOUT', 'AI_MAX_RETRIES']:
            if key in os.environ:
                del os.environ[key]
    
    def test_init_global_region(self):
        """测试全局区域初始化"""
        manager = AIManager('global')
        self.assertEqual(manager.region, Region.GLOBAL)
        self.assertEqual(manager.language, 'en-US')
    
    def test_init_china_region(self):
        """测试中国区域初始化"""
        with patch.dict(os.environ, {
            'REGION': 'china',
            'LANGUAGE': 'zh-CN'
        }):
            manager = AIManager('china')
            self.assertEqual(manager.region, Region.CHINA)
            self.assertEqual(manager.language, 'zh-CN')
    
    def test_init_default_values(self):
        """测试默认值设置"""
        with patch.dict(os.environ, {}, clear=True):
            manager = AIManager()
            self.assertEqual(manager.region, Region.GLOBAL)
            self.assertEqual(manager.language, 'en-US')
    
    @patch('ai_manager.GlobalAIProviderFactory.get_provider')
    def test_get_ai_provider_global(self, mock_get_provider):
        """测试获取全局AI提供商"""
        mock_provider = Mock()
        mock_get_provider.return_value = mock_provider
        
        provider = self.ai_manager.get_ai_provider()
        
        self.assertEqual(provider, mock_provider)
        mock_get_provider.assert_called_once()
    
    @patch('ai_manager.ChinaAIProviderFactory.get_provider')
    def test_get_ai_provider_china(self, mock_get_provider):
        """测试获取中国AI提供商"""
        with patch.dict(os.environ, {'REGION': 'china'}):
            manager = AIManager('china')
            mock_provider = Mock()
            mock_get_provider.return_value = mock_provider
            
            provider = manager.get_ai_provider()
            
            self.assertEqual(provider, mock_provider)
            mock_get_provider.assert_called_once()
    
    @patch('ai_manager.GlobalAIProviderFactory.get_provider')
    def test_get_ai_provider_error_handling(self, mock_get_provider):
        """测试AI提供商获取错误处理"""
        mock_get_provider.side_effect = Exception("Provider initialization failed")
        
        with self.assertRaises(ProviderError):
            self.ai_manager.get_ai_provider()
    
    def test_generate_memory_aids_empty_content(self):
        """测试空内容生成记忆辅助"""
        with self.assertRaises(ValueError):
            self.ai_manager.generate_memory_aids("")
    
    def test_generate_memory_aids_whitespace_content(self):
        """测试空白内容生成记忆辅助"""
        with self.assertRaises(ValueError):
            self.ai_manager.generate_memory_aids("   ")
    
    @patch('ai_manager.GlobalAIProviderFactory.get_provider')
    def test_generate_memory_aids_success(self, mock_get_provider):
        """测试成功生成记忆辅助"""
        # 模拟提供商
        mock_provider = Mock()
        mock_result = {
            "mindMap": {
                "id": "root",
                "label": "Test Content",
                "children": []
            },
            "mnemonics": [],
            "sensoryAssociations": []
        }
        mock_provider.generate_memory_aids.return_value = mock_result
        mock_get_provider.return_value = mock_provider
        
        # 测试生成
        result = self.ai_manager.generate_memory_aids("Test content")
        
        self.assertEqual(result, mock_result)
        mock_provider.generate_memory_aids.assert_called_once_with("Test content")
    
    @patch('ai_manager.GlobalAIProviderFactory.get_provider')
    def test_generate_memory_aids_retry_logic(self, mock_get_provider):
        """测试重试逻辑"""
        mock_provider = Mock()
        mock_result = {
            "mindMap": {"id": "root", "label": "Test", "children": []},
            "mnemonics": [],
            "sensoryAssociations": []
        }
        
        # 前两次调用失败，第三次成功
        mock_provider.generate_memory_aids.side_effect = [
            Exception("First error"),
            Exception("Second error"),
            mock_result
        ]
        mock_get_provider.return_value = mock_provider
        
        result = self.ai_manager.generate_memory_aids("Test content")
        
        self.assertEqual(result, mock_result)
        self.assertEqual(mock_provider.generate_memory_aids.call_count, 3)
    
    @patch('ai_manager.GlobalAIProviderFactory.get_provider')
    def test_generate_memory_aids_all_attempts_fail(self, mock_get_provider):
        """测试所有尝试都失败"""
        mock_provider = Mock()
        mock_provider.generate_memory_aids.side_effect = Exception("Always fails")
        mock_get_provider.return_value = mock_provider
        
        with self.assertRaises(AIError):
            self.ai_manager.generate_memory_aids("Test content")
        
        self.assertEqual(mock_provider.generate_memory_aids.call_count, 3)
    
    def test_synthesize_speech_empty_text(self):
        """测试空文本语音合成"""
        with self.assertRaises(ValueError):
            self.ai_manager.synthesize_speech("")
    
    @patch('ai_manager.GlobalAIProviderFactory.get_provider')
    def test_synthesize_speech_success(self, mock_get_provider):
        """测试成功语音合成"""
        mock_provider = Mock()
        mock_result = "Generated speech suggestions"
        mock_provider.generate_text.return_value = mock_result
        mock_get_provider.return_value = mock_provider
        
        result = self.ai_manager.synthesize_speech("Test text")
        
        self.assertIn('script', result)
        self.assertIn('suggestions', result)
        self.assertEqual(result['script'], "Test text")
        self.assertEqual(result['suggestions'], mock_result)
    
    def test_get_supported_languages_global(self):
        """测试获取支持的语言（全局）"""
        languages = self.ai_manager.get_supported_languages()
        self.assertIn('en-US', languages)
        self.assertIn('en-GB', languages)
    
    def test_get_supported_languages_china(self):
        """测试获取支持的语言（中国）"""
        with patch.dict(os.environ, {'REGION': 'china'}):
            manager = AIManager('china')
            languages = manager.get_supported_languages()
            self.assertIn('zh-CN', languages)
            self.assertIn('zh-TW', languages)
    
    def test_get_supported_voices_global(self):
        """测试获取支持的语音（全局）"""
        voices = self.ai_manager.get_supported_voices()
        self.assertIn('en-US', voices)
        self.assertIn('en-GB', voices)
    
    def test_get_supported_voices_china(self):
        """测试获取支持的语音（中国）"""
        with patch.dict(os.environ, {'REGION': 'china'}):
            manager = AIManager('china')
            voices = manager.get_supported_voices()
            self.assertIn('zh-CN', voices)
    
    def test_get_region_info(self):
        """测试获取区域信息"""
        info = self.ai_manager.get_region_info()
        
        self.assertIn('region', info)
        self.assertIn('language', info)
        self.assertIn('ai_provider', info)
        self.assertIn('tts_provider', info)
        self.assertIn('supported_languages', info)
        self.assertIn('supported_voices', info)
        
        self.assertEqual(info['region'], 'global')
        self.assertEqual(info['language'], 'en-US')
    
    def test_generate_review_schedule_from_ebbinghaus(self):
        """测试艾宾浩斯复习计划生成"""
        schedule = self.ai_manager.generate_review_schedule_from_ebbinghaus()
        
        self.assertIn('review_dates', schedule)
        self.assertIsInstance(schedule['review_dates'], list)
        self.assertEqual(len(schedule['review_dates']), 9)  # 预期9个复习时间点
        
        # 检查时间间隔是否合理
        dates = [datetime.fromisoformat(date_str) for date_str in schedule['review_dates']]
        now = datetime.now()
        
        for i, date in enumerate(dates):
            self.assertGreaterEqual(date, now)
            if i > 0:
                self.assertGreater(date, dates[i-1])
    
    @patch('ai_manager.GlobalAIProviderFactory.get_provider')
    def test_generate_image_success(self, mock_get_provider):
        """测试成功生成图像提示词"""
        mock_provider = Mock()
        mock_result = "Generated image prompt"
        mock_provider.generate_text.return_value = mock_result
        mock_get_provider.return_value = mock_provider
        
        # 测试异步函数
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(
                self.ai_manager.generate_image("Test content", "Test context")
            )
            
            self.assertIn('prompt', result)
            self.assertIn('message', result)
            self.assertIn('status', result)
            self.assertEqual(result['prompt'], mock_result)
            self.assertEqual(result['status'], 'prompt_generated')
        finally:
            loop.close()
    
    @patch('ai_manager.GlobalAIProviderFactory.get_provider')
    def test_generate_audio_success(self, mock_get_provider):
        """测试成功生成音频提示词"""
        mock_provider = Mock()
        mock_result = "Generated audio suggestions"
        mock_provider.generate_text.return_value = mock_result
        mock_get_provider.return_value = mock_provider
        
        # 测试异步函数
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(
                self.ai_manager.generate_audio("Test content", "Test context")
            )
            
            self.assertIn('script', result)
            self.assertIn('suggestions', result)
            self.assertIn('message', result)
            self.assertIn('status', result)
            self.assertEqual(result['script'], "Test content")
            self.assertEqual(result['suggestions'], mock_result)
            self.assertEqual(result['status'], 'prompt_generated')
        finally:
            loop.close()
    
    def test_metrics_collection(self):
        """测试指标收集"""
        # 添加一些指标
        initial_metrics = len(self.ai_manager.get_metrics())
        
        # 模拟一个成功的请求
        with patch('ai_manager.GlobalAIProviderFactory.get_provider') as mock_get_provider:
            mock_provider = Mock()
            mock_result = {"mindMap": {"id": "root"}, "mnemonics": [], "sensoryAssociations": []}
            mock_provider.generate_memory_aids.return_value = mock_result
            mock_get_provider.return_value = mock_provider
            
            self.ai_manager.generate_memory_aids("Test content")
        
        # 检查指标是否被收集
        metrics = self.ai_manager.get_metrics()
        self.assertEqual(len(metrics), initial_metrics + 1)
        
        # 检查最后一个指标
        last_metric = metrics[-1]
        self.assertTrue(last_metric.success)
        self.assertIsNotNone(last_metric.duration())
    
    def test_performance_stats(self):
        """测试性能统计"""
        # 清空指标
        self.ai_manager.clear_metrics()
        
        # 获取空指标统计
        stats = self.ai_manager.get_performance_stats()
        self.assertEqual(stats['total_requests'], 0)
        
        # 添加一些测试指标
        with patch('ai_manager.GlobalAIProviderFactory.get_provider') as mock_get_provider:
            mock_provider = Mock()
            mock_result = {"mindMap": {"id": "root"}, "mnemonics": [], "sensoryAssociations": []}
            mock_provider.generate_memory_aids.return_value = mock_result
            mock_get_provider.return_value = mock_provider
            
            # 生成一些成功的请求
            self.ai_manager.generate_memory_aids("Test content 1")
            self.ai_manager.generate_memory_aids("Test content 2")
        
        # 检查性能统计
        stats = self.ai_manager.get_performance_stats()
        self.assertEqual(stats['total_requests'], 2)
        self.assertEqual(stats['successful_requests'], 2)
        self.assertEqual(stats['failed_requests'], 0)
        self.assertEqual(stats['success_rate'], 100.0)
        self.assertGreater(stats['average_duration'], 0)
    
    def test_clear_metrics(self):
        """测试清空指标"""
        # 先添加一些指标
        with patch('ai_manager.GlobalAIProviderFactory.get_provider') as mock_get_provider:
            mock_provider = Mock()
            mock_result = {"mindMap": {"id": "root"}, "mnemonics": [], "sensoryAssociations": []}
            mock_provider.generate_memory_aids.return_value = mock_result
            mock_get_provider.return_value = mock_provider
            
            self.ai_manager.generate_memory_aids("Test content")
        
        # 确保指标不为空
        self.assertGreater(len(self.ai_manager.get_metrics()), 0)
        
        # 清空指标
        self.ai_manager.clear_metrics()
        
        # 确保指标为空
        self.assertEqual(len(self.ai_manager.get_metrics()), 0)


class TestAIManagerIntegration(unittest.TestCase):
    """AI管理器集成测试"""
    
    def setUp(self):
        """设置测试环境"""
        # 使用真实的配置，但跳过实际的API调用
        os.environ['REGION'] = 'global'
        os.environ['AI_PROVIDER'] = 'gemini'
        os.environ['GEMINI_API_KEY'] = 'test_key_for_integration'
    
    def tearDown(self):
        """清理测试环境"""
        for key in ['REGION', 'AI_PROVIDER', 'GEMINI_API_KEY']:
            if key in os.environ:
                del os.environ[key]
    
    @patch('ai_manager.GlobalAIProviderFactory.get_provider')
    def test_full_workflow(self, mock_get_provider):
        """测试完整工作流程"""
        # 模拟提供商
        mock_provider = Mock()
        mock_result = {
            "mindMap": {
                "id": "root",
                "label": "Integration Test Content",
                "children": [
                    {
                        "id": "main",
                        "label": "Main Content",
                        "children": []
                    }
                ]
            },
            "mnemonics": [
                {
                    "id": "test",
                    "title": "Test Mnemonic",
                    "content": "Test content for memory",
                    "type": "test"
                }
            ],
            "sensoryAssociations": []
        }
        mock_provider.generate_memory_aids.return_value = mock_result
        mock_provider.generate_text.return_value = "Generated text"
        mock_get_provider.return_value = mock_provider
        
        # 创建管理器
        manager = AIManager()
        
        # 测试记忆辅助生成
        memory_aids = manager.generate_memory_aids("Integration test content")
        self.assertEqual(memory_aids, mock_result)
        
        # 测试语音合成
        speech_result = manager.synthesize_speech("Test speech")
        self.assertIn('script', speech_result)
        self.assertIn('suggestions', speech_result)
        
        # 测试区域信息
        region_info = manager.get_region_info()
        self.assertEqual(region_info['region'], 'global')
        
        # 测试复习计划
        schedule = manager.generate_review_schedule_from_ebbinghaus()
        self.assertIn('review_dates', schedule)
        self.assertIsInstance(schedule['review_dates'], list)


if __name__ == '__main__':
    # 运行测试
    unittest.main(verbosity=2)