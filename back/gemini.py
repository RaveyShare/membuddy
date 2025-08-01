# 兼容性导入 - 保持向后兼容
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
import logging

# 配置日志
logger = logging.getLogger(__name__)
try:
    from google import genai as google_genai
    from google.genai import types
except ImportError:
    # Fallback to old API if new one is not available
    from vertexai.preview.vision_models import ImageGenerationModel

# 新的AI管理器
from ai_manager import ai_manager, generate_memory_aids as ai_generate_memory_aids

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

记忆口诀生成三种类型：顺口溜记忆法、核心内容总结、记忆宫殿编码。
感官联想也分为三类：视觉联想、听觉联想和触觉联想。

对于核心内容总结，请按以下要求：
1. 提炼核心论点：用一两句话总结文本最核心、最总体的思想或论点，填入 corePoint 字段
2. 结构化分解：将文本内容分解为几个关键的原则、观点或主要部分，填入 keyPrinciples 数组
3. 区分观点与例子：对于每一点，都必须清晰地分为观点/概念和例子/做法两个层面
4. 生成总结描述：基于核心论点和关键原则，在 content 字段中生成一段完整的、连贯的总结性描述，将核心论点和各个关键原则有机地整合成一段易于理解和记忆的文字

对于记忆宫殿编码，请按以下要求：
1. 设定主题：扮演记忆大师的角色，为核心内容总结的所有要点创建一个富有想象力的、统一的"记忆宫殿"主题，填入 theme 字段
2. 创建场景：将总结中的每一个关键原则，精确地映射到主题中的一个具体的"房间"、"站点"、"场景"或"步骤"，填入 scenes 数组
3. 注入生动细节：使用强烈的视觉、动作和感官语言，创造具体、生动的画面来象征性地代表对应的原则和例子
4. 明确连接点：在每个场景描述的结尾，用明确的"记忆锚点"来收尾，将生动的画面与抽象概念牢固联系
5. 生成宫殿描述：基于记忆宫殿主题和各个场景，在 content 字段中生成一段完整的、引人入胜的记忆宫殿整体描述，将主题和各个场景串联成一个连贯的记忆故事

注意严格按照如下JSON格式输出，不需要任何多余的内容。重要提醒：
- 必须将所有 [请在此处...] 占位符替换为实际生成的内容
- content 字段必须包含完整的、有意义的描述文字，不能为空
- corePoint、theme 等字段也必须填入具体内容，不能保留占位符

JSON格式如下：

{
  "mindMap": {
    "id": "root",
    "label": "根据用户输入内容生成的主题标题",
    "children": [
      {
        "id": "part1",
        "label": "第一个主要部分的标题",
        "children": [
          { "id": "leaf1", "label": "第一个子要点" },
          { "id": "leaf2", "label": "第二个子要点" }
        ]
      },
      {
        "id": "part2",
        "label": "第二个主要部分的标题",
        "children": [
          { "id": "leaf3", "label": "第三个子要点" },
          { "id": "leaf4", "label": "第四个子要点" }
        ]
      }
    ]
  },
  "mnemonics": [
    {
      "id": "rhyme",
      "title": "顺口溜记忆法",
      "content": "根据用户内容生成的顺口溜文本",
      "type": "rhyme"
    },
    {
      "id": "summary",
      "title": "核心内容总结",
      "content": "基于核心论点和关键原则的完整总结描述",
      "type": "summary",
      "corePoint": "核心论点内容",
      "keyPrinciples": [
        {
          "concept": "观点或概念",
          "example": "具体例子或做法"
        }
      ]
    },
    {
      "id": "palace",
      "title": "记忆宫殿编码",
      "content": "基于记忆宫殿主题和场景的整体描述",
      "type": "palace",
      "theme": "记忆宫殿主题",
      "scenes": [
        {
          "principle": "对应的原则",
          "scene": "生动的场景描述",
          "anchor": "记忆锚点"
        }
      ]
    }
  ],
  "sensoryAssociations": [
    {
      "id": "visual",
      "title": "视觉联想",
      "type": "visual",
      "content": [
        {
          "dynasty": "第一个视觉要素的名称",
          "image": "🌟",
          "color": "#fbbf24",
          "association": "具体的视觉联想描述"
        },
        {
          "dynasty": "第二个视觉要素的名称",
          "image": "🔵",
          "color": "#06b6d4",
          "association": "具体的视觉联想描述"
        }
      ]
    },
    {
      "id": "auditory",
      "title": "听觉联想",
      "type": "auditory",
      "content": [
        { "dynasty": "第一个听觉要素的名称", "sound": "叮咚声", "rhythm": "节奏感" },
        { "dynasty": "第二个听觉要素的名称", "sound": "风声", "rhythm": "轻快" }
      ]
    },
    {
      "id": "tactile",
      "title": "触觉联想",
      "type": "tactile",
      "content": [
        { "dynasty": "第一个触觉要素的名称", "texture": "柔软", "feeling": "温暖" },
        { "dynasty": "第二个触觉要素的名称", "texture": "坚硬", "feeling": "冰凉" }
      ]
    }
  ]
}

重要：以上JSON中的所有示例文本（如"基于核心论点和关键原则的完整总结描述"、"核心论点内容"等）都必须替换为根据用户输入内容实际生成的具体文字，绝对不能保留示例文本本身！
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
        parsed_data = json.loads(cleaned_text)
        
        # Validate and fix mnemonics structure
        if 'mnemonics' in parsed_data and isinstance(parsed_data['mnemonics'], list):
            for i, mnemonic in enumerate(parsed_data['mnemonics']):
                if isinstance(mnemonic, dict):
                    # Check if type field is missing and add it based on id
                    if 'type' not in mnemonic:
                        if 'id' in mnemonic:
                            mnemonic['type'] = mnemonic['id']
                            logger.warning(f"[Parse Response] Added missing 'type' field to mnemonic {i}: {mnemonic['id']}")
                        else:
                            # Default type based on position
                            default_types = ['rhyme', 'summary', 'palace']
                            if i < len(default_types):
                                mnemonic['type'] = default_types[i]
                                logger.warning(f"[Parse Response] Added default 'type' field to mnemonic {i}: {default_types[i]}")
                            else:
                                mnemonic['type'] = 'unknown'
                                logger.warning(f"[Parse Response] Added fallback 'type' field to mnemonic {i}: unknown")
                    
                    # Check if content field is a list and convert to string
                    if 'content' in mnemonic and isinstance(mnemonic['content'], list):
                        # Convert list content to string representation
                        if mnemonic['content']:
                            # Try to extract meaningful text from the list
                            content_parts = []
                            for item in mnemonic['content']:
                                if isinstance(item, dict):
                                    # Extract text values from dict
                                    text_values = [str(v) for v in item.values() if isinstance(v, (str, int, float))]
                                    if text_values:
                                        content_parts.extend(text_values)
                                elif isinstance(item, str):
                                    content_parts.append(item)
                                else:
                                    content_parts.append(str(item))
                            mnemonic['content'] = ' '.join(content_parts) if content_parts else '记忆内容'
                        else:
                            mnemonic['content'] = '记忆内容'
                        logger.warning(f"[Parse Response] Converted list content to string for mnemonic {i}: {mnemonic.get('type', 'unknown')}")
        
        logger.info(f"[Parse Response] Successfully parsed and validated response")
        return parsed_data
    except Exception as e:
        logger.error(f"[Parse Response] Error parsing Gemini response: {e}")
        return None

async def call_gemini_via_proxy(prompt: str, model_name: str = "gemini-2.5-flash-002"):
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
        
        # 详细的请求日志
        logger.info(f"[Gemini Proxy] ===== REQUEST START =====")
        logger.info(f"[Gemini Proxy] URL: {url}")
        logger.info(f"[Gemini Proxy] Model: {model_name}")
        logger.info(f"[Gemini Proxy] Headers: {dict(headers)}")
        logger.info(f"[Gemini Proxy] Payload: {json.dumps(payload, ensure_ascii=False, indent=2)}")
        logger.info(f"[Gemini Proxy] ===== REQUEST END =====")
        
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        
        # 详细的响应日志
        logger.info(f"[Gemini Proxy] ===== RESPONSE START =====")
        logger.info(f"[Gemini Proxy] Status Code: {response.status_code}")
        logger.info(f"[Gemini Proxy] Response Headers: {dict(response.headers)}")
        logger.info(f"[Gemini Proxy] Raw Response Text: {response.text}")
        logger.info(f"[Gemini Proxy] ===== RESPONSE END =====")
        
        response.raise_for_status()
        
        result = response.json()
        
        if "candidates" in result and len(result["candidates"]) > 0:
            response_text = result["candidates"][0]["content"]["parts"][0]["text"]
            logger.info(f"[Gemini Proxy] Successfully extracted response text: {len(response_text)} characters")
            return response_text
        else:
            logger.error(f"[Gemini Proxy] Unexpected response format: {result}")
            return None
            
    except Exception as e:
        print(f"[Gemini Proxy Legacy] Error: {e}")
        return None

async def generate_memory_aids(content: str):
    """生成记忆辅助内容 - 使用新的AI管理器"""
    try:
        # 优先使用新的AI管理器
        region = os.getenv("REGION", "global")
        logger.info(f"[Generate Memory Aids] ===== FUNCTION START =====")
        logger.info(f"[Generate Memory Aids] Region: {region}")
        logger.info(f"[Generate Memory Aids] Input content: {content}")
        
        if region in ["china", "global"]:
            logger.info(f"[Generate Memory Aids] Trying AI manager first...")
            result = ai_generate_memory_aids(content)
            if result:
                logger.info(f"[Generate Memory Aids] AI manager returned result: {json.dumps(result, ensure_ascii=False, indent=2)}")
                return result
            else:
                logger.info(f"[Generate Memory Aids] AI manager returned no result, falling back to Gemini")
        
        # 回退到原有的Gemini实现（向后兼容）
        prompt = f"{SYSTEM_PROMPT_AIDS}\n\n用户输入的内容：{content}\n\n请为这个内容生成记忆辅助工具."
        
        logger.info(f"[Generate Memory Aids] Using fallback Gemini implementation")
        logger.info(f"[Generate Memory Aids] Full prompt: {prompt}")
        
        if settings.GEMINI_BASE_URL != "https://generativelanguage.googleapis.com":
            # 使用代理调用
            logger.info(f"[Generate Memory Aids] Using Gemini proxy: {settings.GEMINI_BASE_URL}")
            response_text = await call_gemini_via_proxy(prompt)
        else:
            # 直接使用SDK调用
            logger.info(f"[Generate Memory Aids] Using direct Gemini SDK")
            logger.info(f"[Generate Memory Aids] Creating GenerativeModel with model: gemini-2.5-flash")
            model = genai.GenerativeModel('gemini-2.5-flash')
            logger.info(f"[Generate Memory Aids] Calling generate_content_async...")
            response = await model.generate_content_async(prompt)
            response_text = response.text
            logger.info(f"[Generate Memory Aids] SDK Response received: {response_text}")
        
        if response_text:
            logger.info(f"[Generate Memory Aids] Response text received, length: {len(response_text)} characters")
            logger.info(f"[Generate Memory Aids] Parsing JSON response...")
            parsed_response = parse_gemini_response(response_text)
            if parsed_response:
                logger.info(f"[Generate Memory Aids] Successfully parsed response: {json.dumps(parsed_response, ensure_ascii=False, indent=2)}")
            else:
                logger.error(f"[Generate Memory Aids] Failed to parse response. Raw text: {response_text}")
            logger.info(f"[Generate Memory Aids] ===== FUNCTION END =====")
            return parsed_response
        else:
            logger.error(f"[Generate Memory Aids] No response text received")
            logger.info(f"[Generate Memory Aids] ===== FUNCTION END =====")
            return None
    except Exception as e:
        logger.error(f"[Generate Memory Aids] Exception occurred: {str(e)}", exc_info=True)
        logger.info(f"[Generate Memory Aids] ===== FUNCTION END =====")
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
            model = genai.GenerativeModel('gemini-2.5-flash-002')
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
        model = genai.GenerativeModel('gemini-2.5-flash-002')
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

