"""AI Provider Manager
统一管理国内外AI提供商，根据区域自动选择合适的服务
"""

import os
from typing import Dict, Any, Optional, List
from enum import Enum
import logging
import json
import asyncio
from datetime import datetime, timedelta
from functools import wraps
from dataclasses import dataclass

# 配置日志
logger = logging.getLogger(__name__)

class AIError(Exception):
    """AI相关错误"""
    pass

class ProviderError(AIError):
    """提供商错误"""
    pass

class ConfigurationError(AIError):
    """配置错误"""
    pass

class TimeoutError(AIError):
    """超时错误"""
    pass

@dataclass
class AIRequestMetrics:
    """AI请求指标"""
    start_time: datetime
    end_time: Optional[datetime] = None
    provider: str = ""
    model: str = ""
    token_count: int = 0
    success: bool = False
    error_message: str = ""
    
    def duration(self) -> Optional[float]:
        """请求持续时间（秒）"""
        if self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return None

def log_ai_request(func):
    """AI请求日志装饰器"""
    @wraps(func)
    async def async_wrapper(*args, **kwargs):
        metrics = AIRequestMetrics(start_time=datetime.now())
        try:
            result = await func(*args, **kwargs)
            metrics.end_time = datetime.now()
            metrics.success = True
            logger.info(f"AI request completed: {metrics.provider} {metrics.model} - {metrics.duration():.2f}s")
            return result
        except Exception as e:
            metrics.end_time = datetime.now()
            metrics.success = False
            metrics.error_message = str(e)
            logger.error(f"AI request failed: {metrics.provider} {metrics.model} - {metrics.duration():.2f}s - {e}")
            raise
    
    @wraps(func)
    def sync_wrapper(*args, **kwargs):
        metrics = AIRequestMetrics(start_time=datetime.now())
        try:
            result = func(*args, **kwargs)
            metrics.end_time = datetime.now()
            metrics.success = True
            logger.info(f"AI request completed: {metrics.provider} {metrics.model} - {metrics.duration():.2f}s")
            return result
        except Exception as e:
            metrics.end_time = datetime.now()
            metrics.success = False
            metrics.error_message = str(e)
            logger.error(f"AI request failed: {metrics.provider} {metrics.model} - {metrics.duration():.2f}s - {e}")
            raise
    
    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    else:
        return sync_wrapper

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
        self._request_timeout = int(os.getenv("AI_REQUEST_TIMEOUT", "30"))
        self._max_retries = int(os.getenv("AI_MAX_RETRIES", "3"))
        self._metrics: List[AIRequestMetrics] = []
        
        logger.info(f"AIManager initialized - Region: {self.region.value}, Language: {self.language}")
        self._validate_configuration()
        
    def get_ai_provider(self):
        """获取AI提供商实例"""
        if self._ai_provider is None:
            try:
                use_mock = os.getenv("USE_MOCK_AI", "false").lower() == "true"
                logger.info(f"🔍 USE_MOCK_AI environment variable: {os.getenv('USE_MOCK_AI', 'not set')}")
                logger.info(f"🔍 use_mock boolean value: {use_mock}")
                
                if use_mock:
                    logger.info("🎭 Initializing Mock AI Provider...")
                    from mock_ai_provider import MockAIProvider
                    self._ai_provider = MockAIProvider()
                    logger.info("🎭 Using Mock AI Provider for fast development")
                elif self.region == Region.CHINA:
                    from ai_providers_china import ChinaAIProviderFactory
                    self._ai_provider = ChinaAIProviderFactory.get_provider()
                else:
                    from ai_providers_global import GlobalAIProviderFactory
                    self._ai_provider = GlobalAIProviderFactory.get_provider()
                
                logger.info(f"AI provider initialized: {type(self._ai_provider).__name__}")
            except Exception as e:
                logger.error(f"Failed to initialize AI provider: {e}")
                raise ProviderError(f"Failed to initialize AI provider: {e}")
        
        return self._ai_provider
    
    def get_tts_provider(self):
        """获取TTS提供商实例"""
        if self._tts_provider is None:
            try:
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
                logger.info(f"TTS provider initialized: {type(self._tts_provider).__name__}")
            except Exception as e:
                logger.error(f"Failed to initialize TTS provider: {e}")
                raise ProviderError(f"Failed to initialize TTS provider: {e}")
        
        return self._tts_provider
    
    @log_ai_request
    def generate_memory_aids(self, content: str) -> Dict[str, Any]:
        """生成记忆辅助内容"""
        if not content or not content.strip():
            raise ValueError("Content cannot be empty")
        
        logger.info(f"[AI Manager] ===== GENERATE MEMORY AIDS START =====")
        logger.info(f"[AI Manager] Region: {self.region.value}")
        logger.info(f"[AI Manager] Language: {self.language}")
        logger.info(f"[AI Manager] Input content length: {len(content)} characters")
        
        try:
            provider = self.get_ai_provider()
            logger.info(f"[AI Manager] Using provider: {type(provider).__name__}")
            
            # 添加重试逻辑
            for attempt in range(self._max_retries):
                try:
                    result = provider.generate_memory_aids(content)
                    
                    if result:
                        logger.info(f"[AI Manager] Provider returned result with {len(str(result))} characters")
                        logger.debug(f"[AI Manager] Provider result: {json.dumps(result, ensure_ascii=False, indent=2)}")
                    else:
                        logger.warning(f"[AI Manager] Provider returned no result")
                    
                    logger.info(f"[AI Manager] ===== GENERATE MEMORY AIDS END =====")
                    return result
                    
                except Exception as e:
                    if attempt < self._max_retries - 1:
                        logger.warning(f"[AI Manager] Attempt {attempt + 1} failed: {e}, retrying...")
                        import time
                        time.sleep(2 ** attempt)  # 指数退避
                    else:
                        logger.error(f"[AI Manager] All attempts failed")
                        raise
                        
        except Exception as e:
            logger.error(f"[AI Manager] Exception occurred: {str(e)}", exc_info=True)
            logger.info(f"[AI Manager] ===== GENERATE MEMORY AIDS END =====")
            raise AIError(f"Failed to generate memory aids: {e}")
    
    @log_ai_request
    def synthesize_speech(self, text: str, voice: str = None) -> dict:
        """生成语音提示词"""
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")
        
        logger.info(f"[AI Manager] ===== SYNTHESIZE SPEECH PROMPT START =====")
        logger.info(f"[AI Manager] Region: {self.region.value}")
        logger.info(f"[AI Manager] Text length: {len(text)} characters")
        logger.info(f"[AI Manager] Voice: {voice}")
        
        try:
            provider = self.get_ai_provider()
            
            if self.region == Region.CHINA:
                prompt_template = f"""你是一个专业的语音合成提示词专家。请根据以下文本内容，生成一个适合语音合成的详细提示。

文本内容：{text}
语音类型：{voice or '默认'}

要求：
1. 提供语音合成的详细建议
2. 包括语速、语调、停顿等建议
3. 适合记忆辅助的听觉表达
4. 考虑情感表达和节奏感
5. 返回格式化的语音合成建议
"""
            else:
                prompt_template = f"""You are a professional speech synthesis prompt expert. Please generate detailed suggestions for speech synthesis based on the following text.

Text content: {text}
Voice type: {voice or 'default'}

Requirements:
1. Provide detailed suggestions for speech synthesis
2. Include recommendations for speed, tone, pauses
3. Suitable for memory aid auditory expression
4. Consider emotional expression and rhythm
5. Return formatted speech synthesis suggestions
"""
            
            # 使用AI提供商生成提示词
            prompt_result = provider.generate_text(prompt_template)
            
            if prompt_result:
                logger.info(f"[AI Manager] Speech prompt generated successfully")
                return {
                    "script": text,
                    "suggestions": prompt_result,
                    "message": "Speech synthesis feature is under development. Here are the generated suggestions for future use.",
                    "status": "prompt_generated",
                    "voice": voice or ("xiaoyun" if self.region == Region.CHINA else "en-US-Wavenet-D")
                }
            else:
                logger.warning(f"[AI Manager] Failed to generate speech prompt")
                raise AIError("Failed to generate speech prompt")
                
        except Exception as e:
            logger.error(f"[AI Manager] Exception occurred: {str(e)}", exc_info=True)
            logger.info(f"[AI Manager] ===== SYNTHESIZE SPEECH PROMPT END =====")
            raise AIError(f"Failed to synthesize speech: {e}")
    
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
    
    def _validate_configuration(self):
        """验证配置"""
        try:
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
            
            missing_vars = []
            for var, description in required_vars.items():
                if not os.getenv(var):
                    missing_vars.append(f"Missing {description} ({var})")
            
            if missing_vars:
                logger.warning(f"Configuration warnings: {missing_vars}")
        except Exception as e:
            logger.error(f"Configuration validation error: {e}")
    
    def get_metrics(self) -> List[AIRequestMetrics]:
        """获取请求指标"""
        return self._metrics.copy()
    
    def clear_metrics(self):
        """清除指标"""
        self._metrics.clear()
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """获取性能统计"""
        if not self._metrics:
            return {"total_requests": 0}
        
        successful_requests = [m for m in self._metrics if m.success]
        failed_requests = [m for m in self._metrics if not m.success]
        
        durations = [m.duration() for m in successful_requests if m.duration()]
        
        return {
            "total_requests": len(self._metrics),
            "successful_requests": len(successful_requests),
            "failed_requests": len(failed_requests),
            "success_rate": len(successful_requests) / len(self._metrics) * 100,
            "average_duration": sum(durations) / len(durations) if durations else 0,
            "min_duration": min(durations) if durations else 0,
            "max_duration": max(durations) if durations else 0
        }
    
    def generate_review_schedule_from_ebbinghaus(self):
        """基于艾宾浩斯遗忘曲线生成复习计划"""
        from datetime import datetime, timedelta
        
        now = datetime.now()
        review_intervals = [
            timedelta(minutes=20),
            timedelta(hours=1),
            timedelta(hours=9),
            timedelta(days=1),
            timedelta(days=2),
            timedelta(days=4),
            timedelta(days=7),
            timedelta(days=15),
        ]
        review_dates = [(now + interval).isoformat() for interval in review_intervals]
        return {"review_dates": review_dates}
    
    @log_ai_request
    async def generate_image(self, content: str, context: str = ""):
        """生成图像提示词"""
        if not content or not content.strip():
            raise ValueError("Content cannot be empty")
        
        logger.info(f"[AI Manager] ===== GENERATE IMAGE PROMPT START =====")
        logger.info(f"[AI Manager] Region: {self.region.value}")
        logger.info(f"[AI Manager] Content length: {len(content)} characters")
        logger.info(f"[AI Manager] Context length: {len(context)} characters")
        
        try:
            provider = self.get_ai_provider()
            
            if self.region == Region.CHINA:
                prompt_template = f"""你是一个专业的图像生成提示词专家。请根据以下内容，生成一个详细的、适合AI图像生成的中文提示词。

内容：{content}
上下文：{context}

要求：
1. 提示词应该是中文
2. 描述要具体、生动
3. 适合记忆辅助的视觉化表达
4. 风格清晰、色彩鲜明
5. 只返回提示词，不要其他内容
"""
            else:
                prompt_template = f"""You are a professional image generation prompt expert. Please generate a detailed English prompt suitable for AI image generation based on the following content.

Content: {content}
Context: {context}

Requirements:
1. The prompt should be in English
2. Description should be specific and vivid
3. Suitable for memory aid visualization
4. Clear style with vibrant colors
5. Return only the prompt, no other content
"""
            
            # 使用AI提供商生成提示词
            prompt_result = provider.generate_text(prompt_template)
            
            if prompt_result:
                logger.info(f"[AI Manager] Image prompt generated successfully")
                return {
                    "prompt": prompt_result,
                    "message": "Image generation feature is under development. Here's the generated prompt for future use.",
                    "status": "prompt_generated"
                }
            else:
                logger.warning(f"[AI Manager] Failed to generate image prompt")
                raise AIError("Failed to generate image prompt")
                
        except Exception as e:
            logger.error(f"[AI Manager] Exception occurred: {str(e)}", exc_info=True)
            logger.info(f"[AI Manager] ===== GENERATE IMAGE PROMPT END =====")
            raise AIError(f"Failed to generate image: {e}")
    
    @log_ai_request
    async def generate_audio(self, content: str, context: str = ""):
        """生成音频提示词"""
        if not content or not content.strip():
            raise ValueError("Content cannot be empty")
        
        logger.info(f"[AI Manager] ===== GENERATE AUDIO PROMPT START =====")
        logger.info(f"[AI Manager] Region: {self.region.value}")
        logger.info(f"[AI Manager] Content length: {len(content)} characters")
        logger.info(f"[AI Manager] Context length: {len(context)} characters")
        
        try:
            provider = self.get_ai_provider()
            
            if self.region == Region.CHINA:
                prompt_template = f"""你是一个专业的音频生成提示词专家。请根据以下内容，生成一个详细的、适合AI音频生成的中文提示词。

内容：{content}
上下文：{context}

要求：
1. 提示词应该是中文
2. 描述要具体、生动
3. 适合记忆辅助的听觉表达
4. 包括声音类型、节奏、音调等建议
5. 只返回提示词，不要其他内容
"""
            else:
                prompt_template = f"""You are a professional audio generation prompt expert. Please generate a detailed English prompt suitable for AI audio generation based on the following content.

Content: {content}
Context: {context}

Requirements:
1. The prompt should be in English
2. Description should be specific and vivid
3. Suitable for memory aid auditory expression
4. Include sound type, rhythm, tone suggestions
5. Return only the prompt, no other content
"""
            
            # 使用AI提供商生成提示词
            prompt_result = provider.generate_text(prompt_template)
            
            if prompt_result:
                logger.info(f"[AI Manager] Audio prompt generated successfully")
                return {
                    "script": content,
                    "suggestions": prompt_result,
                    "message": "Audio generation feature is under development. Here are the generated suggestions for future use.",
                    "status": "prompt_generated",
                    "voice": "xiaoyun" if self.region == Region.CHINA else "en-US-Wavenet-D"
                }
            else:
                logger.warning(f"[AI Manager] Failed to generate audio prompt")
                raise AIError("Failed to generate audio prompt")
                
        except Exception as e:
            logger.error(f"[AI Manager] Exception occurred: {str(e)}", exc_info=True)
            logger.info(f"[AI Manager] ===== GENERATE AUDIO PROMPT END =====")
            raise AIError(f"Failed to generate audio: {e}")

# 全局AI管理器实例
ai_manager = AIManager()

# 便捷函数
def generate_memory_aids(content: str) -> Dict[str, Any]:
    """生成记忆辅助内容的便捷函数"""
    return ai_manager.generate_memory_aids(content)

async def generate_image(content: str, context: str = ""):
    """生成图像提示词的便捷函数"""
    return await ai_manager.generate_image(content, context)

async def generate_audio(content: str, context: str = ""):
    """生成音频提示词的便捷函数"""
    return await ai_manager.generate_audio(content, context)

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
    "generate_image",
    "generate_audio",
    "synthesize_speech",
    "get_region_info",
    "validate_configuration"
]