"""基础Provider抽象类
定义所有AI提供商的通用接口和功能
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
import logging
import json
import re
from datetime import datetime

logger = logging.getLogger(__name__)

class BaseProvider(ABC):
    """AI提供商基础抽象类"""
    
    def __init__(self, name: str, model: str = None):
        self.name = name
        self.model = model
        self.timeout = 90  # 增加超时时间到90秒
        self.max_retries = 3
        self.logger = logging.getLogger(f"{__name__}.{name}")
        
    @abstractmethod
    def generate_memory_aids(self, content: str) -> Dict[str, Any]:
        """生成记忆辅助内容"""
        pass
    
    @abstractmethod
    def generate_text(self, prompt: str) -> str:
        """生成文本内容"""
        pass
    
    def _clean_json_response(self, text: str) -> str:
        """清理JSON响应，移除代码块标记"""
        if not text:
            return text
            
        # 移除 ```json 和 ``` 标记
        cleaned = re.sub(r'```json\n?|```', '', text)
        
        # 移除首尾空白字符
        cleaned = cleaned.strip()
        
        # 尝试修复常见的JSON格式问题
        try:
            json.loads(cleaned)
            return cleaned
        except json.JSONDecodeError:
            # 尝试修复常见的格式问题
            # 移除可能的markdown格式
            cleaned = re.sub(r'^.*?{', '{', cleaned, flags=re.DOTALL)
            cleaned = re.sub(r'}.*?$', '}', cleaned, flags=re.DOTALL)
            
            # 修复可能的换行符问题
            cleaned = cleaned.replace('\n', '\\n')
            
            try:
                json.loads(cleaned)
                return cleaned
            except json.JSONDecodeError:
                self.logger.warning(f"Failed to clean JSON response: {text[:100]}...")
                return text
    
    def _get_default_memory_aids(self, content: str) -> Dict[str, Any]:
        """获取默认的记忆辅助内容结构"""
        return {
            "mindMap": {
                "id": "root",
                "label": content[:50] + "..." if len(content) > 50 else content,
                "children": [
                    {
                        "id": "main",
                        "label": "主要内容",
                        "children": [
                            {"id": "detail1", "label": "关键点1"},
                            {"id": "detail2", "label": "关键点2"}
                        ]
                    }
                ]
            },
            "mnemonics": [
                {
                    "id": "rhyme",
                    "title": "顺口溜记忆法",
                    "content": "系统正在处理中，请稍后重试",
                    "type": "rhyme"
                }
            ],
            "sensoryAssociations": [
                {
                    "id": "visual",
                    "title": "视觉联想",
                    "type": "visual",
                    "content": [
                        {
                            "dynasty": "内容",
                            "image": "🧠",
                            "color": "#3b82f6",
                            "association": "记忆联想",
                            "feeling": "",
                            "texture": "",
                            "sound": "",
                            "rhythm": ""
                        }
                    ]
                }
            ]
        }
    
    def _log_request(self, method: str, content_length: int, **kwargs):
        """记录请求日志"""
        self.logger.info(f"[{method}] Request - Content length: {content_length}")
        for key, value in kwargs.items():
            self.logger.info(f"[{method}] Request - {key}: {value}")
    
    def _log_response(self, method: str, response_length: int, **kwargs):
        """记录响应日志"""
        self.logger.info(f"[{method}] Response - Content length: {response_length}")
        for key, value in kwargs.items():
            self.logger.info(f"[{method}] Response - {key}: {value}")
    
    def _log_error(self, method: str, error: Exception, **kwargs):
        """记录错误日志"""
        self.logger.error(f"[{method}] Error: {error}")
        for key, value in kwargs.items():
            self.logger.error(f"[{method}] Error context - {key}: {value}")

class BaseHTTPProvider(BaseProvider):
    """基于HTTP的Provider基类"""
    
    def __init__(self, name: str, model: str = None, base_url: str = None):
        super().__init__(name, model)
        self.base_url = base_url
        self.session = None
        
    def _get_headers(self) -> Dict[str, str]:
        """获取请求头"""
        return {
            "Content-Type": "application/json",
            "User-Agent": f"MemBuddy/{self.name}"
        }
    
    def _handle_response(self, response, method: str = "HTTP Request") -> Dict[str, Any]:
        """处理HTTP响应"""
        try:
            response.raise_for_status()
            result = response.json()
            
            self._log_response(method, len(str(result)), 
                              status_code=response.status_code)
            
            return result
        except Exception as e:
            self._log_error(method, e, 
                           status_code=response.status_code,
                           response_text=response.text)
            raise

class BaseAsyncProvider(BaseProvider):
    """异步Provider基类"""
    
    async def generate_memory_aids_async(self, content: str) -> Dict[str, Any]:
        """异步生成记忆辅助内容"""
        return self.generate_memory_aids(content)
    
    async def generate_text_async(self, prompt: str) -> str:
        """异步生成文本内容"""
        return self.generate_text(prompt)