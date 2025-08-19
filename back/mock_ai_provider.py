"""Mock AI Provider
模拟AI提供商，用于开发和测试时快速返回预定义的响应
"""

import logging
import time
from typing import Dict, Any
from base_provider import BaseProvider

logger = logging.getLogger(__name__)

class MockAIProvider(BaseProvider):
    """Mock AI提供商，返回预定义的记忆辅助内容"""
    
    def __init__(self):
        super().__init__("MockAI", "mock-model-v1")
        self.logger.info("MockAIProvider initialized - 使用模拟数据快速返回")
    
    def generate_memory_aids(self, content: str) -> Dict[str, Any]:
        """生成模拟的记忆辅助内容"""
        self.logger.info(f"[MockAI] 生成记忆辅助内容 - 内容长度: {len(content)} 字符")
        self.logger.info(f"[MockAI] 使用Mock模式，快速返回预定义数据")
        
        # 模拟一些处理时间（可选）
        time.sleep(0.1)
        
        # 根据内容长度和关键词生成不同的mock数据
        content_lower = content.lower()
        
        # 基础mock数据结构
        mock_data = {
            "mindMap": {
                "id": "root",
                "label": content[:30] + "..." if len(content) > 30 else content,
                "children": [
                    {
                        "id": "main-concept",
                        "label": "核心概念",
                        "children": [
                            {"id": "detail-1", "label": "要点一"},
                            {"id": "detail-2", "label": "要点二"},
                            {"id": "detail-3", "label": "要点三"}
                        ]
                    },
                    {
                        "id": "application",
                        "label": "应用场景",
                        "children": [
                            {"id": "app-1", "label": "实际应用"},
                            {"id": "app-2", "label": "相关案例"}
                        ]
                    }
                ]
            },
            "mnemonics": [
                {
                    "id": "rhyme-1",
                    "title": "顺口溜记忆法",
                    "content": "这是一个简单易记的顺口溜，帮助记忆核心内容",
                    "type": "rhyme",
                    "explanation": "通过押韵的方式，让内容更容易记忆和回忆"
                },
                {
                    "id": "acronym-1",
                    "title": "首字母缩写法",
                    "content": "MOCK - Memory, Organization, Comprehension, Knowledge",
                    "type": "acronym",
                    "explanation": "将关键词的首字母组合成容易记忆的缩写"
                }
            ],
            "sensoryAssociations": [
                {
                    "id": "visual-1",
                    "title": "视觉联想",
                    "type": "visual",
                    "content": [
                        {
                            "dynasty": "现代",
                            "image": "🧠",
                            "color": "#3b82f6",
                            "association": "蓝色的大脑象征着智慧和记忆",
                            "feeling": "",
                            "texture": "",
                            "sound": "",
                            "rhythm": ""
                        }
                    ]
                },
                {
                    "id": "auditory-1",
                    "title": "听觉联想",
                    "type": "auditory",
                    "content": [
                        {
                            "dynasty": "现代",
                            "sound": "轻柔的钢琴声",
                            "rhythm": "4/4拍，缓慢而稳定",
                            "association": "平静的音乐有助于记忆巩固",
                            "image": "",
                            "color": "",
                            "feeling": "",
                            "texture": ""
                        }
                    ]
                }
            ]
        }
        
        # 根据内容关键词调整mock数据
        if any(keyword in content_lower for keyword in ['历史', 'history', '朝代', 'dynasty']):
            mock_data["sensoryAssociations"][0]["content"][0]["dynasty"] = "唐朝"
            mock_data["sensoryAssociations"][0]["content"][0]["association"] = "盛唐时期的繁荣景象"
            mock_data["mnemonics"][0]["content"] = "唐宋元明清，历史要记清"
        
        elif any(keyword in content_lower for keyword in ['数学', 'math', '公式', 'formula']):
            mock_data["mindMap"]["children"][0]["children"] = [
                {"id": "formula", "label": "公式推导"},
                {"id": "example", "label": "例题解析"},
                {"id": "application", "label": "实际应用"}
            ]
            mock_data["mnemonics"][0]["content"] = "数学公式要记牢，多做练习是王道"
        
        elif any(keyword in content_lower for keyword in ['英语', 'english', '单词', 'word']):
            mock_data["mnemonics"].append({
                "id": "word-association",
                "title": "词根记忆法",
                "content": "通过词根词缀来记忆单词含义",
                "type": "association",
                "explanation": "理解词根含义，举一反三记忆更多单词"
            })
        
        self.logger.info(f"[MockAI] 成功生成Mock数据 - mindMap: {len(mock_data['mindMap']['children'])} 个节点")
        self.logger.info(f"[MockAI] 成功生成Mock数据 - mnemonics: {len(mock_data['mnemonics'])} 个记忆法")
        self.logger.info(f"[MockAI] 成功生成Mock数据 - sensoryAssociations: {len(mock_data['sensoryAssociations'])} 个感官联想")
        
        return mock_data
    
    def generate_text(self, prompt: str) -> str:
        """生成模拟的文本内容"""
        self.logger.info(f"[MockAI] 生成文本内容 - 提示词长度: {len(prompt)} 字符")
        
        # 模拟一些处理时间
        time.sleep(0.05)
        
        # 简单的mock文本生成
        if "总结" in prompt or "summary" in prompt.lower():
            return "这是一个模拟的总结内容，包含了主要要点和关键信息。"
        elif "解释" in prompt or "explain" in prompt.lower():
            return "这是一个模拟的解释内容，详细说明了相关概念和原理。"
        else:
            return "这是一个模拟的AI生成文本内容，用于开发和测试目的。"

class MockAIProviderFactory:
    """Mock AI提供商工厂类"""
    
    @staticmethod
    def get_provider() -> MockAIProvider:
        """获取Mock AI提供商实例"""
        return MockAIProvider()