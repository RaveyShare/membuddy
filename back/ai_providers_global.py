"""Global AI Providers Adapter
Supports Gemini, OpenAI, Claude, and other international AI services
"""

import os
import json
import requests
from typing import Dict, Any, Optional, List
from config import settings
import google.generativeai as genai
from openai import OpenAI
import anthropic
from prompt_templates import PromptTemplates

class GeminiProvider:
    """Google Gemini API Adapter"""
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.base_url = os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com")
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        
        if self.base_url != "https://generativelanguage.googleapis.com":
            # Using proxy
            print(f"Using Gemini proxy: {self.base_url}")
        else:
            # Direct API access
            genai.configure(api_key=self.api_key)
            print("Using direct Gemini API access")
    
    def generate_memory_aids(self, content: str) -> Dict[str, Any]:
        """Generate memory aids content"""
        # 根据环境变量或配置确定语言
        language = os.getenv("LANGUAGE", "en")  # 默认英文
        if language.startswith("zh"):
            language = "zh"
        else:
            language = "en"
            
        prompt = PromptTemplates.get_memory_aids_prompt(content, language)
        
        try:
            if self.base_url != "https://generativelanguage.googleapis.com":
                # Use proxy
                return self._call_via_proxy(prompt)
            else:
                # Use direct API
                return self._call_direct_api(prompt)
                
        except Exception as e:
            print(f"Gemini API error: {e}")
            return self._get_default_response(content)
    
    def _call_direct_api(self, prompt: str) -> Dict[str, Any]:
        """Call Gemini API directly"""
        print(f"[Gemini Direct API] Request - Model: {self.model}")
        print(f"[Gemini Direct API] Request - Prompt length: {len(prompt)} characters")
        print(f"[Gemini Direct API] Request - Prompt preview: {prompt[:200]}...")
        
        model = genai.GenerativeModel(self.model)
        response = model.generate_content(prompt)
        
        print(f"[Gemini Direct API] Response - Has text: {bool(response.text)}")
        if response.text:
            print(f"[Gemini Direct API] Response - Text length: {len(response.text)} characters")
            print(f"[Gemini Direct API] Response - Text preview: {response.text[:200]}...")
            try:
                # Clean the text by removing ```json and ``` markers
                import re
                cleaned_text = re.sub(r'```json\n?|```', '', response.text)
                print(f"[Gemini Direct API] Response - Cleaned text preview: {cleaned_text[:200]}...")
                parsed_response = json.loads(cleaned_text)
                print(f"[Gemini Direct API] Response - Successfully parsed JSON")
                return parsed_response
            except json.JSONDecodeError as e:
                print(f"[Gemini Direct API] Response - JSON parse error: {e}")
                print(f"[Gemini Direct API] Response - Raw text: {response.text}")
                return self._get_default_response(prompt)
        else:
            print(f"[Gemini Direct API] Response - No text in response")
            raise Exception("No response from Gemini API")
    
    def _call_via_proxy(self, prompt: str) -> Dict[str, Any]:
        """Call Gemini API via proxy"""
        headers = {
            "Authorization": f"Bearer {self.api_key[:10]}...",  # 隐藏完整API密钥
            "Content-Type": "application/json"
        }
        
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
        
        print(f"[Gemini Proxy API] Request - URL: {self.base_url}/v1/chat/completions")
        print(f"[Gemini Proxy API] Request - Model: {self.model}")
        print(f"[Gemini Proxy API] Request - Prompt length: {len(prompt)} characters")
        print(f"[Gemini Proxy API] Request - Prompt preview: {prompt[:200]}...")
        print(f"[Gemini Proxy API] Request - Temperature: {data['temperature']}, Max tokens: {data['max_tokens']}")
        
        response = requests.post(
            f"{self.base_url}/v1/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
            json=data,
            timeout=30
        )
        response.raise_for_status()
        
        result = response.json()
        print(f"[Gemini Proxy API] Response - Status: {response.status_code}")
        print(f"[Gemini Proxy API] Response - Has choices: {'choices' in result}")
        
        if "choices" in result and len(result["choices"]) > 0:
            content = result["choices"][0]["message"]["content"]
            print(f"[Gemini Proxy API] Response - Content length: {len(content)} characters")
            print(f"[Gemini Proxy API] Response - Content preview: {content[:200]}...")
            try:
                # Clean the text by removing ```json and ``` markers
                import re
                cleaned_text = re.sub(r'```json\n?|```', '', content)
                print(f"[Gemini Proxy API] Response - Cleaned text preview: {cleaned_text[:200]}...")
                parsed_response = json.loads(cleaned_text)
                print(f"[Gemini Proxy API] Response - Successfully parsed JSON")
                return parsed_response
            except json.JSONDecodeError as e:
                print(f"[Gemini Proxy API] Response - JSON parse error: {e}")
                print(f"[Gemini Proxy API] Response - Raw content: {content}")
                return self._get_default_response(content)
        else:
            print(f"[Gemini Proxy API] Response - Unexpected format: {result}")
            raise Exception(f"Unexpected response format: {result}")
    
    def _get_default_response(self, original_content: str) -> Dict[str, Any]:
        """Return default response structure"""
        return {
            "mindMap": {
                "id": "root",
                "label": "Memory Content",
                "children": [
                    {
                        "id": "main",
                        "label": original_content[:50] + "...",
                        "children": [
                            {"id": "detail1", "label": "Key Point 1"},
                            {"id": "detail2", "label": "Key Point 2"}
                        ]
                    }
                ]
            },
            "mnemonics": [
                {
                    "id": "rhyme",
                    "title": "Rhyme Memory Method",
                    "content": "Please try again, system is processing",
                    "type": "rhyme"
                }
            ],
            "sensoryAssociations": [
                {
                    "id": "visual",
                    "title": "Visual Association",
                    "type": "visual",
                    "content": [
                        {
                            "dynasty": "Content",
                            "image": "🧠",
                            "color": "#3b82f6",
                            "association": "Memory association"
                        }
                    ]
                }
            ]
        }
    
    def generate_text(self, prompt: str) -> str:
        """Generate text response from prompt"""
        try:
            if self.base_url != "https://generativelanguage.googleapis.com":
                # Use proxy
                result = self._call_via_proxy_for_text(prompt)
            else:
                # Use direct API
                result = self._call_direct_api_for_text(prompt)
            return result
        except Exception as e:
            print(f"Error generating text: {e}")
            return None
    
    def _call_direct_api_for_text(self, prompt: str) -> str:
        """Call Gemini API directly for text generation"""
        model = genai.GenerativeModel(self.model)
        response = model.generate_content(prompt)
        return response.text if response.text else None
    
    def _call_via_proxy_for_text(self, prompt: str) -> str:
        """Call Gemini API via proxy for text generation"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        data = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        response = requests.post(
            f"{self.base_url}/v1beta/models/{self.model}:generateContent",
            headers=headers,
            json=data
        )
        
        if response.status_code == 200:
            result = response.json()
            if "candidates" in result and len(result["candidates"]) > 0:
                content = result["candidates"][0]["content"]["parts"][0]["text"]
                return content
        return None

class OpenAIProvider:
    """OpenAI API Adapter"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o")
        self.client = OpenAI(api_key=self.api_key, base_url=self.base_url)
    
    def generate_memory_aids(self, content: str) -> Dict[str, Any]:
        """Generate memory aids content using OpenAI"""
        prompt = f"""
You are MemBuddy, an AI assistant that helps users with memory techniques. Based on the following content, generate mind maps, mnemonics, and sensory associations.

User input: {content}

Please output strictly in JSON format without any additional content.
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return self._get_default_response(content)
                
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return self._get_default_response(content)
    
    def _get_default_response(self, original_content: str) -> Dict[str, Any]:
        """Return default response structure"""
        return {
            "mindMap": {
                "id": "root",
                "label": "Memory Content",
                "children": [
                    {
                        "id": "main",
                        "label": original_content[:50] + "...",
                        "children": [
                            {"id": "detail1", "label": "Key Point 1"},
                            {"id": "detail2", "label": "Key Point 2"}
                        ]
                    }
                ]
            },
            "mnemonics": [
                {
                    "id": "rhyme",
                    "title": "Rhyme Memory Method",
                    "content": "Please try again, system is processing",
                    "type": "rhyme"
                }
            ],
            "sensoryAssociations": [
                {
                    "id": "visual",
                    "title": "Visual Association",
                    "type": "visual",
                    "content": [
                        {
                            "dynasty": "Content",
                            "image": "🧠",
                            "color": "#3b82f6",
                            "association": "Memory association",
                            "feeling": "",
                            "texture": "",
                            "sound": "",
                            "rhythm": ""
                        }
                    ]
                }
            ]
        }

class ClaudeProvider:
    """Anthropic Claude API Adapter"""
    
    def __init__(self):
        self.api_key = os.getenv("CLAUDE_API_KEY")
        self.base_url = os.getenv("CLAUDE_BASE_URL", "https://api.anthropic.com")
        self.model = os.getenv("CLAUDE_MODEL", "claude-3-sonnet-20240229")
        self.client = anthropic.Anthropic(api_key=self.api_key)
    
    def generate_memory_aids(self, content: str) -> Dict[str, Any]:
        """Generate memory aids content using Claude"""
        prompt = f"""
You are MemBuddy, an AI assistant that helps users with memory techniques. Based on the following content, generate mind maps, mnemonics, and sensory associations.

User input: {content}

Please output strictly in JSON format without any additional content.
        """
        
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                temperature=0.7,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            content = response.content[0].text
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return self._get_default_response(content)
                
        except Exception as e:
            print(f"Claude API error: {e}")
            return self._get_default_response(content)
    
    def _get_default_response(self, original_content: str) -> Dict[str, Any]:
        """Return default response structure"""
        return {
            "mindMap": {
                "id": "root",
                "label": "Memory Content",
                "children": [
                    {
                        "id": "main",
                        "label": original_content[:50] + "...",
                        "children": [
                            {"id": "detail1", "label": "Key Point 1"},
                            {"id": "detail2", "label": "Key Point 2"}
                        ]
                    }
                ]
            },
            "mnemonics": [
                {
                    "id": "rhyme",
                    "title": "Rhyme Memory Method",
                    "content": "Please try again, system is processing",
                    "type": "rhyme"
                }
            ],
            "sensoryAssociations": [
                {
                    "id": "visual",
                    "title": "Visual Association",
                    "type": "visual",
                    "content": [
                        {
                            "dynasty": "Content",
                            "image": "🧠",
                            "color": "#3b82f6",
                            "association": "Memory association",
                            "feeling": "",
                            "texture": "",
                            "sound": "",
                            "rhythm": ""
                        }
                    ]
                }
            ]
        }

class GlobalAIProviderFactory:
    """Global AI Provider Factory"""
    
    @staticmethod
    def get_provider(provider_name: str = None):
        """Get AI provider instance"""
        if not provider_name:
            provider_name = os.getenv("AI_PROVIDER", "gemini")
        
        providers = {
            "gemini": GeminiProvider,
            "openai": OpenAIProvider,
            "claude": ClaudeProvider
        }
        
        if provider_name not in providers:
            raise ValueError(f"Unsupported AI provider: {provider_name}")
        
        return providers[provider_name]()

# Global TTS Services
class GoogleTTSProvider:
    """Google Cloud Text-to-Speech Service"""
    
    def __init__(self):
        from google.cloud import texttospeech
        self.client = texttospeech.TextToSpeechClient()
    
    def synthesize_speech(self, text: str, voice: str = "en-US-Wavenet-D") -> bytes:
        """Synthesize speech using Google Cloud TTS"""
        from google.cloud import texttospeech
        
        synthesis_input = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US",
            name=voice
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        
        response = self.client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        return response.audio_content

class ElevenLabsTTSProvider:
    """ElevenLabs Text-to-Speech Service"""
    
    def __init__(self):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        self.voice_id = os.getenv("ELEVENLABS_VOICE_ID")
    
    def synthesize_speech(self, text: str, voice_id: str = None) -> bytes:
        """Synthesize speech using ElevenLabs"""
        if not voice_id:
            voice_id = self.voice_id
        
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }
        
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }
        
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()
        
        return response.content

# Export main classes
__all__ = [
    "GlobalAIProviderFactory",
    "GeminiProvider",
    "OpenAIProvider",
    "ClaudeProvider",
    "GoogleTTSProvider",
    "ElevenLabsTTSProvider"
]