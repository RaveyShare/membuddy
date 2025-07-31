"""AI Provider Manager
统一管理国内外AI提供商，根据区域自动选择合适的服务
"""

import os
from typing import Dict, Any, Optional
from enum import Enum

class Region(Enum):
    """支持的区域"""
    CHINA = "china"
    GLOBAL = "global"

class AIManager:
    """AI提供商管理器"""
    
    def __init__(self, region: str = None):
        self.region = Region(region or os.getenv("REGION", "global"))
        self.language = os.getenv("LANGUAGE", "en-US" if self.region == Region.GLOBAL else "zh-CN")
        self._ai_provider = None
        self._tts_provider = None
        
    def get_ai_provider(self):
        """获取AI提供商实例"""
        if self._ai_provider is None:
            if self.region == Region.CHINA:
                from ai_providers_china import ChinaAIProviderFactory
                self._ai_provider = ChinaAIProviderFactory.get_provider()
            else:
                from ai_providers_global import GlobalAIProviderFactory
                self._ai_provider = GlobalAIProviderFactory.get_provider()
        
        return self._ai_provider
    
    def get_tts_provider(self):
        """获取TTS提供商实例"""
        if self._tts_provider is None:
            if self.region == Region.CHINA:
                from ai_providers_china import AliyunTTSProvider
                self._tts_provider = AliyunTTSProvider()
            else:
                tts_provider = os.getenv("TTS_PROVIDER", "google")
                if tts_provider == "elevenlabs":
                    from ai_providers_global import ElevenLabsTTSProvider
                    self._tts_provider = ElevenLabsTTSProvider()
                else:
                    from ai_providers_global import GoogleTTSProvider
                    self._tts_provider = GoogleTTSProvider()
        
        return self._tts_provider
    
    def generate_memory_aids(self, content: str) -> Dict[str, Any]:
        """生成记忆辅助内容"""
        provider = self.get_ai_provider()
        return provider.generate_memory_aids(content)
    
    def synthesize_speech(self, text: str, voice: str = None) -> bytes:
        """合成语音"""
        provider = self.get_tts_provider()
        
        # 根据区域选择默认语音
        if voice is None:
            if self.region == Region.CHINA:
                voice = "xiaoyun"  # 阿里云默认语音
            else:
                voice = "en-US-Wavenet-D"  # Google默认语音
        
        return provider.synthesize_speech(text, voice)
    
    def get_supported_languages(self) -> list:
        """获取支持的语言列表"""
        if self.region == Region.CHINA:
            return ["zh-CN", "zh-TW"]
        else:
            return ["en-US", "en-GB", "es-ES", "fr-FR", "de-DE", "ja-JP", "ko-KR"]
    
    def get_supported_voices(self) -> Dict[str, list]:
        """获取支持的语音列表"""
        if self.region == Region.CHINA:
            return {
                "zh-CN": [
                    {"id": "xiaoyun", "name": "小云", "gender": "female"},
                    {"id": "xiaogang", "name": "小刚", "gender": "male"},
                    {"id": "xiaomeng", "name": "小梦", "gender": "female"},
                    {"id": "xiaoxiao", "name": "小晓", "gender": "female"}
                ]
            }
        else:
            return {
                "en-US": [
                    {"id": "en-US-Wavenet-D", "name": "Male Voice", "gender": "male"},
                    {"id": "en-US-Wavenet-F", "name": "Female Voice", "gender": "female"},
                    {"id": "en-US-Neural2-A", "name": "Neural Female", "gender": "female"},
                    {"id": "en-US-Neural2-C", "name": "Neural Male", "gender": "male"}
                ],
                "en-GB": [
                    {"id": "en-GB-Wavenet-A", "name": "British Female", "gender": "female"},
                    {"id": "en-GB-Wavenet-B", "name": "British Male", "gender": "male"}
                ]
            }
    
    def get_region_info(self) -> Dict[str, Any]:
        """获取当前区域信息"""
        return {
            "region": self.region.value,
            "language": self.language,
            "ai_provider": os.getenv("AI_PROVIDER", "qwen" if self.region == Region.CHINA else "gemini"),
            "tts_provider": os.getenv("TTS_PROVIDER", "aliyun" if self.region == Region.CHINA else "google"),
            "supported_languages": self.get_supported_languages(),
            "supported_voices": self.get_supported_voices()
        }
    
    def validate_configuration(self) -> Dict[str, Any]:
        """验证当前配置"""
        issues = []
        warnings = []
        
        # 检查必要的环境变量
        if self.region == Region.CHINA:
            required_vars = {
                "QWEN_API_KEY": "通义千问API密钥",
                "ALIYUN_TTS_ACCESS_KEY": "阿里云TTS访问密钥",
                "ALIYUN_TTS_SECRET_KEY": "阿里云TTS密钥"
            }
        else:
            required_vars = {
                "GEMINI_API_KEY": "Gemini API Key",
                "GOOGLE_CLOUD_PROJECT_ID": "Google Cloud Project ID"
            }
        
        for var, description in required_vars.items():
            if not os.getenv(var):
                issues.append(f"Missing {description} ({var})")
        
        # 检查可选配置
        if self.region == Region.CHINA:
            optional_vars = {
                "ERNIE_API_KEY": "文心一言API密钥（备选）",
                "ZHIPU_API_KEY": "智谱AI API密钥（备选）"
            }
        else:
            optional_vars = {
                "OPENAI_API_KEY": "OpenAI API Key (alternative)",
                "CLAUDE_API_KEY": "Claude API Key (alternative)"
            }
        
        for var, description in optional_vars.items():
            if not os.getenv(var):
                warnings.append(f"Optional {description} not configured ({var})")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "warnings": warnings,
            "region": self.region.value,
            "language": self.language
        }

# 全局AI管理器实例
ai_manager = AIManager()

# 便捷函数
def generate_memory_aids(content: str) -> Dict[str, Any]:
    """生成记忆辅助内容的便捷函数"""
    return ai_manager.generate_memory_aids(content)

def synthesize_speech(text: str, voice: str = None) -> bytes:
    """合成语音的便捷函数"""
    return ai_manager.synthesize_speech(text, voice)

def get_region_info() -> Dict[str, Any]:
    """获取区域信息的便捷函数"""
    return ai_manager.get_region_info()

def validate_configuration() -> Dict[str, Any]:
    """验证配置的便捷函数"""
    return ai_manager.validate_configuration()

# 导出主要类和函数
__all__ = [
    "AIManager",
    "Region",
    "ai_manager",
    "generate_memory_aids",
    "synthesize_speech",
    "get_region_info",
    "validate_configuration"
]