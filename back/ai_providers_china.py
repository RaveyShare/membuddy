"""国内版AI提供商适配器
支持通义千问、文心一言、智谱AI、百川AI等国产大模型
"""

import os
import json
import requests
import logging
from typing import Dict, Any, Optional, List
from config import settings
from prompt_templates import PromptTemplates
import time
import hashlib
import hmac
import base64
from urllib.parse import urlencode
from base_provider import BaseHTTPProvider, BaseProvider

logger = logging.getLogger(__name__)

class QwenProvider(BaseHTTPProvider):
    """通义千问API适配器"""
    
    def __init__(self):
        super().__init__("qwen", os.getenv("QWEN_MODEL", "qwen-turbo"))
        self.api_key = os.getenv("QWEN_API_KEY")
        self.base_url = os.getenv("QWEN_BASE_URL", "https://dashscope.aliyuncs.com/api/v1")
        
        if not self.api_key:
            raise ValueError("QWEN_API_KEY is required")
    
    def generate_memory_aids(self, content: str) -> Dict[str, Any]:
        """生成记忆辅助内容"""
        prompt = PromptTemplates.get_memory_aids_prompt(content, "zh")
        
        headers = self._get_headers()
        headers["Authorization"] = f"Bearer {self.api_key}"
        
        data = {
            "model": self.model,
            "input": {
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            },
            "parameters": {
                "temperature": 0.7,
                "max_tokens": 2000
            }
        }
        
        self._log_request("generate_memory_aids", len(prompt), 
                         model=self.model)
        
        try:
            response = requests.post(
                f"{self.base_url}/services/aigc/text-generation/generation",
                headers=headers,
                json=data,
                timeout=self.timeout
            )
            
            result = self._handle_response(response, "generate_memory_aids")
            
            if "output" in result and "text" in result["output"]:
                content_text = result["output"]["text"]
                # 尝试解析JSON
                try:
                    cleaned_text = self._clean_json_response(content_text)
                    parsed_response = json.loads(cleaned_text)
                    self._log_response("generate_memory_aids", len(str(parsed_response)))
                    return parsed_response
                except json.JSONDecodeError as e:
                    self._log_error("generate_memory_aids", e, 
                                   raw_response=content_text[:200])
                    return self._get_default_memory_aids(content)
            else:
                raise Exception(f"Unexpected response format: {result}")
                
        except Exception as e:
            self._log_error("generate_memory_aids", e)
            return self._get_default_memory_aids(content)
    
    def generate_text(self, prompt: str) -> str:
        """Generate text response from prompt"""
        try:
            return self._call_qwen_api(prompt)
        except Exception as e:
            self._log_error("generate_text", e)
            return None
    
    def _call_qwen_api(self, prompt: str) -> str:
        """Call Qwen API for text generation"""
        headers = self._get_headers()
        headers["Authorization"] = f"Bearer {self.api_key}"
        
        data = {
            "model": self.model,
            "input": {
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            },
            "parameters": {
                "temperature": 0.7,
                "max_tokens": 1000
            }
        }
        
        response = requests.post(
            f"{self.base_url}/services/aigc/text-generation/generation",
            headers=headers,
            json=data,
            timeout=self.timeout
        )
        
        if response.status_code == 200:
            result = response.json()
            if "output" in result and "text" in result["output"]:
                return result["output"]["text"]
        return None

class ErnieProvider(BaseHTTPProvider):
    """文心一言API适配器"""
    
    def __init__(self):
        super().__init__("ernie", os.getenv("ERNIE_MODEL", "ernie-bot-4"))
        self.api_key = os.getenv("ERNIE_API_KEY")
        self.secret_key = os.getenv("ERNIE_SECRET_KEY")
        self.base_url = os.getenv("ERNIE_BASE_URL", "https://aip.baidubce.com")
        self.access_token = None
        
        if not self.api_key or not self.secret_key:
            raise ValueError("ERNIE_API_KEY and ERNIE_SECRET_KEY are required")
        
    def _get_access_token(self):
        """获取百度API访问令牌"""
        if self.access_token:
            return self.access_token
            
        url = f"{self.base_url}/oauth/2.0/token"
        params = {
            "grant_type": "client_credentials",
            "client_id": self.api_key,
            "client_secret": self.secret_key
        }
        
        try:
            response = requests.post(url, params=params, timeout=self.timeout)
            result = response.json()
            
            if "access_token" in result:
                self.access_token = result["access_token"]
                return self.access_token
            else:
                raise Exception(f"Failed to get access token: {result}")
        except Exception as e:
            self._log_error("get_access_token", e)
            raise
    
    def generate_memory_aids(self, content: str) -> Dict[str, Any]:
        """生成记忆辅助内容"""
        prompt = PromptTemplates.get_memory_aids_prompt(content, "zh")
        
        try:
            access_token = self._get_access_token()
            
            headers = self._get_headers()
            headers["Content-Type"] = "application/json"
            
            data = {
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
            
            self._log_request("generate_memory_aids", len(prompt), 
                             model=self.model)
            
            response = requests.post(
                f"{self.base_url}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token={access_token}",
                headers=headers,
                json=data,
                timeout=self.timeout
            )
            
            result = self._handle_response(response, "generate_memory_aids")
            
            if "result" in result:
                content_text = result["result"]
                try:
                    cleaned_text = self._clean_json_response(content_text)
                    parsed_response = json.loads(cleaned_text)
                    self._log_response("generate_memory_aids", len(str(parsed_response)))
                    return parsed_response
                except json.JSONDecodeError as e:
                    self._log_error("generate_memory_aids", e, 
                                   raw_response=content_text[:200])
                    return self._get_default_memory_aids(content)
            else:
                raise Exception(f"Unexpected response format: {result}")
                
        except Exception as e:
            self._log_error("generate_memory_aids", e)
            return self._get_default_memory_aids(content)
    
    def generate_text(self, prompt: str) -> str:
        """Generate text response from prompt"""
        try:
            access_token = self._get_access_token()
            
            headers = self._get_headers()
            headers["Content-Type"] = "application/json"
            
            data = {
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
            
            response = requests.post(
                f"{self.base_url}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token={access_token}",
                headers=headers,
                json=data,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                if "result" in result:
                    return result["result"]
            return None
                
        except Exception as e:
            self._log_error("generate_text", e)
            return None

class ZhipuProvider(BaseHTTPProvider):
    """智谱AI API适配器"""
    
    def __init__(self):
        super().__init__("zhipu", os.getenv("ZHIPU_MODEL", "glm-4"))
        self.api_key = os.getenv("ZHIPU_API_KEY")
        self.base_url = os.getenv("ZHIPU_BASE_URL", "https://open.bigmodel.cn/api/paas/v4")
        
        if not self.api_key:
            raise ValueError("ZHIPU_API_KEY is required")
    
    def generate_memory_aids(self, content: str) -> Dict[str, Any]:
        """生成记忆辅助内容"""
        prompt = PromptTemplates.get_memory_aids_prompt(content, "zh")
        
        headers = self._get_headers()
        headers["Authorization"] = f"Bearer {self.api_key}"
        
        data = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 4000,
            "response_format": {"type": "json_object"}
        }
        
        self._log_request("generate_memory_aids", len(prompt), 
                         model=self.model)
        
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=data,
                timeout=self.timeout
            )
            
            result = self._handle_response(response, "generate_memory_aids")
            
            if "choices" in result and len(result["choices"]) > 0:
                content_str = result['choices'][0]['message']['content']
                try:
                    parsed_response = json.loads(content_str)
                    self._log_response("generate_memory_aids", len(str(parsed_response)))
                    return parsed_response
                except json.JSONDecodeError as e:
                    self._log_error("generate_memory_aids", e, 
                                   raw_response=content_str[:200])
                    return self._get_default_memory_aids(content)
            else:
                raise Exception(f"Unexpected response format: {result}")
                
        except Exception as e:
            self._log_error("generate_memory_aids", e)
            return self._get_default_memory_aids(content)
    
    def generate_text(self, prompt: str) -> str:
        """Generate text response from prompt"""
        try:
            headers = self._get_headers()
            headers["Authorization"] = f"Bearer {self.api_key}"
            
            data = {
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 1000
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=data,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                if "choices" in result and len(result["choices"]) > 0:
                    return result['choices'][0]['message']['content']
            return None
                
        except Exception as e:
            self._log_error("generate_text", e)
            return None

class BaichuanProvider(BaseHTTPProvider):
    """百川AI API适配器"""
    
    def __init__(self):
        super().__init__("baichuan", os.getenv("BAICHUAN_MODEL", "Baichuan2-Turbo"))
        self.api_key = os.getenv("BAICHUAN_API_KEY")
        self.base_url = os.getenv("BAICHUAN_BASE_URL", "https://api.baichuan-ai.com/v1")
        
        if not self.api_key:
            raise ValueError("BAICHUAN_API_KEY is required")
    
    def generate_memory_aids(self, content: str) -> Dict[str, Any]:
        """生成记忆辅助内容"""
        prompt = PromptTemplates.get_memory_aids_prompt(content, "zh")
        
        headers = self._get_headers()
        headers["Authorization"] = f"Bearer {self.api_key}"
        
        data = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 2000
        }
        
        self._log_request("generate_memory_aids", len(prompt), 
                         model=self.model, content_length=len(prompt))
        
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=data,
                timeout=self.timeout
            )
            
            result = self._handle_response(response, "generate_memory_aids")
            
            if "choices" in result and len(result["choices"]) > 0:
                content_text = result['choices'][0]['message']['content']
                try:
                    cleaned_text = self._clean_json_response(content_text)
                    parsed_response = json.loads(cleaned_text)
                    self._log_response("generate_memory_aids", len(str(parsed_response)))
                    return parsed_response
                except json.JSONDecodeError as e:
                    self._log_error("generate_memory_aids", e, 
                                   raw_response=content_text[:200])
                    return self._get_default_memory_aids(content)
            else:
                raise Exception(f"Unexpected response format: {result}")
                
        except Exception as e:
            self._log_error("generate_memory_aids", e)
            return self._get_default_memory_aids(content)
    
    def generate_text(self, prompt: str) -> str:
        """Generate text response from prompt"""
        try:
            headers = self._get_headers()
            headers["Authorization"] = f"Bearer {self.api_key}"
            
            data = {
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 1000
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=data,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                if "choices" in result and len(result["choices"]) > 0:
                    return result['choices'][0]['message']['content']
            return None
                
        except Exception as e:
            self._log_error("generate_text", e)
            return None

class ChinaAIProviderFactory:
    """国内AI提供商工厂类"""
    
    @staticmethod
    def get_provider(provider_name: str = None):
        """获取AI提供商实例"""
        if not provider_name:
            provider_name = os.getenv("AI_PROVIDER", "qwen")
        
        providers = {
            "qwen": QwenProvider,
            "ernie": ErnieProvider,
            "zhipu": ZhipuProvider,
            "baichuan": BaichuanProvider
        }
        
        if provider_name not in providers:
            raise ValueError(f"Unsupported AI provider: {provider_name}")
        
        return providers[provider_name]()

# 国内版TTS服务
class AliyunTTSProvider:
    """阿里云语音合成服务"""
    
    def __init__(self):
        self.access_key = os.getenv("ALIYUN_TTS_ACCESS_KEY")
        self.secret_key = os.getenv("ALIYUN_TTS_SECRET_KEY")
        self.region = os.getenv("ALIYUN_TTS_REGION", "cn-shanghai")
    
    def synthesize_speech(self, text: str, voice: str = "xiaoyun") -> bytes:
        """合成语音"""
        # 实现阿里云TTS API调用
        pass

class TencentTTSProvider:
    """腾讯云语音合成服务"""
    
    def __init__(self):
        self.secret_id = os.getenv("TENCENT_TTS_SECRET_ID")
        self.secret_key = os.getenv("TENCENT_TTS_SECRET_KEY")
        self.region = os.getenv("TENCENT_TTS_REGION", "ap-beijing")
    
    def synthesize_speech(self, text: str, voice: str = "101001") -> bytes:
        """合成语音"""
        # 实现腾讯云TTS API调用
        pass

# 导出主要类
__all__ = [
    "ChinaAIProviderFactory",
    "QwenProvider",
    "ErnieProvider",
    "ZhipuProvider",
    "BaichuanProvider",
    "AliyunTTSProvider",
    "TencentTTSProvider"
]