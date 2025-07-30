import google.generativeai as genai
from config import settings
import json
import re
from datetime import datetime, timedelta
import requests
import base64
from io import BytesIO
import uuid
import os
from google.cloud import texttospeech
import vertexai
try:
    from google import genai as google_genai
    from google.genai import types
except ImportError:
    # Fallback to old API if new one is not available
    from vertexai.preview.vision_models import ImageGenerationModel

# 配置Gemini API
if settings.GEMINI_BASE_URL != "https://generativelanguage.googleapis.com":
    # 使用代理时，通过requests直接调用
    print(f"Using Gemini proxy: {settings.GEMINI_BASE_URL}")
else:
    # 直接使用Google SDK
    genai.configure(api_key=settings.GEMINI_API_KEY)
    print("Using direct Gemini API access")

# Set Google Cloud credentials
credentials_path = os.path.join(os.path.dirname(__file__), "service-account-key.json", "gen-lang-client-0374473221-e19a8e500cef.json")
if os.path.exists(credentials_path):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path
    print(f"Google Cloud credentials set: {credentials_path}")
else:
    print(f"Warning: Google Cloud credentials file not found: {credentials_path}")

# Initialize Vertex AI with explicit credentials
try:
    from google.oauth2 import service_account
    if os.path.exists(credentials_path):
        credentials = service_account.Credentials.from_service_account_file(credentials_path)
        vertexai.init(project=settings.GOOGLE_CLOUD_PROJECT_ID, location=settings.GOOGLE_CLOUD_LOCATION, credentials=credentials)
        print(f"Vertex AI initialized with explicit credentials for project: {settings.GOOGLE_CLOUD_PROJECT_ID}")
        
        # Initialize Google Gen AI SDK
        try:
            # Set environment variables for Vertex AI
            os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "true"
            os.environ["GOOGLE_CLOUD_PROJECT"] = settings.GOOGLE_CLOUD_PROJECT_ID
            os.environ["GOOGLE_CLOUD_LOCATION"] = settings.GOOGLE_CLOUD_LOCATION
            print("Google Gen AI SDK environment configured for Vertex AI")
        except Exception as genai_error:
            print(f"Google Gen AI SDK initialization failed: {genai_error}")
    else:
        vertexai.init(project=settings.GOOGLE_CLOUD_PROJECT_ID, location=settings.GOOGLE_CLOUD_LOCATION)
        print(f"Vertex AI initialized with default credentials for project: {settings.GOOGLE_CLOUD_PROJECT_ID}")
        
        # Initialize Google Gen AI SDK with default credentials
        try:
            # Set environment variables for Vertex AI
            os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "true"
            os.environ["GOOGLE_CLOUD_PROJECT"] = settings.GOOGLE_CLOUD_PROJECT_ID
            os.environ["GOOGLE_CLOUD_LOCATION"] = settings.GOOGLE_CLOUD_LOCATION
            print("Google Gen AI SDK environment configured for Vertex AI (default credentials)")
        except Exception as genai_error:
            print(f"Google Gen AI SDK initialization failed: {genai_error}")
except Exception as e:
    print(f"Warning: Vertex AI initialization failed: {e}")

SYSTEM_PROMPT_AIDS = """你是小杏仁记忆搭子，负责帮助用户记忆。你会根据用户输入的内容，生成思维导图、记忆口诀和感官联想。

记忆口诀生成三种类型：顺口溜记忆法、首字母记忆法、故事联想法。
感官联想也分为三类：视觉联想、听觉联想和触觉联想。

注意严格按照如下JSON格式输出，不需要任何多余的内容，只需要在对应的位置填入 content：

{
  "mindMap": {
    "id": "root",
    "label": "content" 或 "记忆主题",
    "children": [
      {
        "id": "part1",
        "label": "content",
        "children": [
          { "id": "leaf1", "label": "content" },
          { "id": "leaf2", "label": "content" }
        ]
      },
      {
        "id": "part2",
        "label": "content",
        "children": [
          { "id": "leaf3", "label": "content" },
          { "id": "leaf4", "label": "content" }
        ]
      }
    ]
  },
  "mnemonics": [
    {
      "id": "rhyme",
      "title": "顺口溜记忆法",
      "content": "content，顺口溜助记。",
      "type": "rhyme"
    },
    {
      "id": "acronym",
      "title": "首字法",
      "content": "",
      "type": "acronym",
      "explanation": "利用首字母记忆"
    },
    {
      "id": "story",
      "title": "故事联想法",
      "content": "想象一个故事串联：",
      "type": "story"
    }
  ],
  "sensoryAssociations": [
    {
      "id": "visual",
      "title": "视觉联想",
      "type": "visual",
      "content": [
        {
          "dynasty": "content",
          "image": "🌟",
          "color": "#fbbf24",
          "association": ""
        },
        {
          "dynasty": "content",
          "image": "🔵",
          "color": "#06b6d4",
          "association": ""
        }
      ]
    },
    {
      "id": "auditory",
      "title": "听觉联想",
      "type": "auditory",
      "content": [
        { "dynasty": "content", "sound": "叮咚声", "rhythm": "节奏感" },
        { "dynasty": "content", "sound": "风声", "rhythm": "轻快" }
      ]
    },
    {
      "id": "tactile",
      "title": "触觉联想",
      "type": "tactile",
      "content": [
        { "dynasty": "content", "texture": "柔软", "feeling": "温暖" },
        { "dynasty": "content", "texture": "坚硬", "feeling": "冰凉" }
      ]
    }
  ]
}
"""

# Although we ask Gemini for the schedule, it's more reliable to calculate it in code.
# The prompt serves as a logical guide, but the implementation is deterministic.
def generate_review_schedule_from_ebbinghaus():
    """
    Generates a review schedule based on the Ebbinghaus forgetting curve.
    """
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

def parse_gemini_response(text: str):
    try:
        # Clean the text by removing ```json and ``` markers
        cleaned_text = re.sub(r'```json\n?|```', '', text)
        return json.loads(cleaned_text)
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        return None

async def call_gemini_via_proxy(prompt: str, model_name: str = "gemini-1.5-flash"):
    """通过代理调用Gemini API"""
    try:
        url = f"{settings.GEMINI_BASE_URL}/v1beta/models/{model_name}:generateContent"
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": settings.GEMINI_API_KEY
        }
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }]
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        
        result = response.json()
        if "candidates" in result and len(result["candidates"]) > 0:
            return result["candidates"][0]["content"]["parts"][0]["text"]
        else:
            print(f"Unexpected Gemini response format: {result}")
            return None
            
    except Exception as e:
        print(f"Error calling Gemini via proxy: {e}")
        return None

async def generate_memory_aids(content: str):
    prompt = f"{SYSTEM_PROMPT_AIDS}\n\n用户输入的内容：{content}\n\n请为这个内容生成记忆辅助工具."

    try:
        if settings.GEMINI_BASE_URL != "https://generativelanguage.googleapis.com":
            # 使用代理调用
            response_text = await call_gemini_via_proxy(prompt)
        else:
            # 直接使用SDK调用
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = await model.generate_content_async(prompt)
            response_text = response.text
        
        if response_text:
            # print("Gemini aids response:", response_text)
            parsed_response = parse_gemini_response(response_text)
            return parsed_response
        else:
            return None
    except Exception as e:
        print(f"Error calling Gemini API for aids: {e}")
        return None

async def generate_image(content: str, context: str = ""):
    """
    Generate an actual image based on the visual association content using Google Imagen
    """
    # First, generate a detailed prompt using Gemini
    prompt_generation = f"""你是一个专业的图像生成提示词专家。请根据以下视觉联想内容，生成一个详细的、适合AI图像生成的英文提示词。

视觉联想内容：{content}
上下文：{context}

要求：
1. 提示词应该是英文
2. 描述要具体、生动
3. 适合记忆辅助的视觉化表达
4. 风格清晰、色彩鲜明
5. 只返回提示词，不要其他内容

示例格式："A vibrant illustration of..."
"""

    try:
        # Generate the prompt
        if settings.GEMINI_BASE_URL != "https://generativelanguage.googleapis.com":
            # 使用代理调用
            image_prompt = await call_gemini_via_proxy(prompt_generation)
        else:
            # 直接使用SDK调用
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt_response = await model.generate_content_async(prompt_generation)
            image_prompt = prompt_response.text
        
        if image_prompt:
            image_prompt = image_prompt.strip()
        else:
            return None
        
        try:
            # Try to generate the actual image using Google Gen AI SDK
            try:
                # Use new Google Gen AI SDK
                client = google_genai.Client(vertexai=True)
                response = client.models.generate_images(
                    model="imagen-3.0-generate-002",
                    prompt=image_prompt,
                    config=types.GenerateImagesConfig(
                        number_of_images=1,
                        include_rai_reason=True,
                        output_mime_type='image/jpeg'
                    )
                )
                
                # Get the generated image
                generated_image = response.generated_images[0]
                
                # The generated_image.image is a google.genai.types.Image object with image_bytes attribute
                if hasattr(generated_image, 'image') and hasattr(generated_image.image, 'image_bytes'):
                    image_bytes = generated_image.image.image_bytes
                    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                elif hasattr(generated_image, 'image_bytes'):
                    image_bytes = generated_image.image_bytes
                    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                else:
                    raise Exception(f"Unknown image object structure: {type(generated_image)}, attributes: {dir(generated_image)}")
                
            except (NameError, AttributeError, ImportError) as fallback_error:
                print(f"Falling back to legacy Vertex AI API: {fallback_error}")
                # Fallback to old API
                generation_model = ImageGenerationModel.from_pretrained("imagen-3.0-generate-001")
                response = generation_model.generate_images(
                    prompt=image_prompt,
                    number_of_images=1,
                    aspect_ratio="1:1",
                    add_watermark=False,
                )
                
                # Get the generated image
                generated_image = response.images[0]
                image_bytes = generated_image._image_bytes
                image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            
            return {
                "image_url": None,  # Imagen doesn't provide URLs, only image data
                "image_base64": f"data:image/png;base64,{image_base64}",
                "prompt": image_prompt
            }
        except Exception as imagen_error:
            print(f"Imagen generation failed: {imagen_error}")
            # Return error information when image generation fails
            error_message = str(imagen_error)
            if "429" in error_message or "out of capacity" in error_message:
                raise Exception("图片生成服务暂时不可用，请稍后重试。Google Imagen服务当前容量不足。")
            elif "Unable to authenticate" in error_message:
                raise Exception("图片生成服务认证失败，请联系管理员检查配置。")
            else:
                raise Exception(f"图片生成失败：{error_message}")
            
            # This code won't be reached due to the raise above, but kept for reference
            return {
                "image_url": None,
                "image_base64": None,
                "prompt": image_prompt  # Still return the generated prompt
            }
            
    except Exception as e:
        print(f"Error generating image prompt: {e}")
        return {
            "image_url": None,
            "image_base64": None,
            "prompt": f"图像生成提示词：{content}的视觉化表达"  # Fallback prompt
        }

async def generate_audio(content: str, context: str = ""):
    """
    Generate actual audio based on the auditory association content.
    For environmental sounds (like truck engine), generate sound effects.
    For other content, use Text-to-Speech.
    """
    # Check if the content is requesting environmental sounds/effects
    environmental_sounds = [
        "引擎", "发动机", "马达", "机器", "风声", "雨声", "雨滴", "海浪", "鸟叫", "虫鸣", 
        "雷声", "钟声", "警报", "汽笛", "喇叭", "敲击", "摩擦", "滴水", "流水",
        "脚步", "心跳", "呼吸", "咀嚼", "撕纸", "开门", "关门", "键盘", "鼠标",
        "轰鸣", "嗡嗡", "咔嚓", "滴答", "呼呼", "哗哗", "叮咚", "嘀嗒"
    ]
    
    is_environmental_sound = any(sound in content for sound in environmental_sounds)
    
    if is_environmental_sound:
        # For environmental sounds, generate a synthetic sound effect description
        # and return a placeholder for actual sound generation
        model = genai.GenerativeModel('gemini-1.5-flash')
        sound_description = f"""你是一个专业的声音效果描述专家。请根据以下声音内容，生成一个详细的声音特征描述。

声音内容：{content}
上下文：{context}

要求：
1. 描述声音的频率特征（低频、中频、高频）
2. 描述声音的节奏和持续性
3. 描述声音的强度变化
4. 用专业术语描述声音特征
5. 长度控制在100字以内

示例格式："低频持续轰鸣，频率约50-200Hz，节奏稳定，强度中等，带有轻微的机械振动感..."
"""
        
        try:
            response = await model.generate_content_async(sound_description)
            sound_spec = response.text.strip()
            
            # Return a structured response for environmental sounds
            return {
                "audio_base64": None,  # No actual audio generated yet
                "script": f"环境音效：{content}",
                "sound_description": sound_spec,
                "sound_type": "environmental",
                "duration": 5.0,  # Default 5 seconds for environmental sounds
                "message": "已生成声音特征描述，实际音效生成功能正在开发中"
            }
        except Exception as e:
            print(f"Error generating sound description: {e}")
            return {
                "audio_base64": None,
                "script": f"环境音效：{content}",
                "sound_description": f"请求的声音：{content}，特征：持续性环境音效",
                "sound_type": "environmental",
                "duration": 5.0,
                "message": "声音特征描述生成失败，使用默认描述"
            }
    
    # For non-environmental sounds, return development message instead of calling TTS API
    try:
        # Generate a simple script description without calling the model
        audio_script = f"听觉联想：{content}"
        
        return {
            "audio_base64": None,
            "script": audio_script,
            "duration": 3.0,  # Default duration
            "message": "语音合成功能正在开发中"
        }
        
    except Exception as e:
        print(f"Error generating audio script: {e}")
        return {
            "audio_base64": None,
            "script": f"听觉联想：{content}",
            "duration": 3.0,
            "message": "语音合成功能正在开发中"
        }

