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
from vertexai.preview.vision_models import ImageGenerationModel
import vertexai

genai.configure(api_key=settings.GEMINI_API_KEY)

# Initialize Vertex AI
try:
    vertexai.init(project=settings.GOOGLE_CLOUD_PROJECT_ID, location=settings.GOOGLE_CLOUD_LOCATION)
    print(f"Vertex AI initialized with project: {settings.GOOGLE_CLOUD_PROJECT_ID}")
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

async def generate_memory_aids(content: str):
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = f"{SYSTEM_PROMPT_AIDS}\n\n用户输入的内容：{content}\n\n请为这个内容生成记忆辅助工具."

    try:
        response = await model.generate_content_async(prompt)
        # print("Gemini aids response:", response.text)
        parsed_response = parse_gemini_response(response.text)
        return parsed_response
    except Exception as e:
        print(f"Error calling Gemini API for aids: {e}")
        return None

async def generate_image(content: str, context: str = ""):
    """
    Generate an actual image based on the visual association content using Google Imagen
    """
    # First, generate a detailed prompt using Gemini
    model = genai.GenerativeModel('gemini-1.5-flash')
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
        prompt_response = await model.generate_content_async(prompt_generation)
        image_prompt = prompt_response.text.strip()
        
        try:
            # Try to generate the actual image using Google Imagen
            generation_model = ImageGenerationModel.from_pretrained("imagen-3.0-generate-001")
            response = generation_model.generate_images(
                prompt=image_prompt,
                number_of_images=1,
                aspect_ratio="1:1",
                add_watermark=False,
            )
            
            # Get the generated image
            generated_image = response.images[0]
            
            # Convert image to base64
            image_bytes = generated_image._image_bytes
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            
            return {
                "image_url": None,  # Imagen doesn't provide URLs, only image data
                "image_base64": f"data:image/png;base64,{image_base64}",
                "prompt": image_prompt
            }
        except Exception as imagen_error:
            print(f"Imagen generation failed: {imagen_error}")
            # Return prompt only when image generation fails
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
        "引擎", "发动机", "马达", "机器", "风声", "雨声", "海浪", "鸟叫", "虫鸣", 
        "雷声", "钟声", "警报", "汽笛", "喇叭", "敲击", "摩擦", "滴水", "流水",
        "脚步", "心跳", "呼吸", "咀嚼", "撕纸", "开门", "关门", "键盘", "鼠标"
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
    
    # For non-environmental sounds, use the original TTS approach
    model = genai.GenerativeModel('gemini-1.5-flash')
    script_generation = f"""你是一个专业的音频脚本专家。请根据以下听觉联想内容，生成一个适合语音合成的中文脚本。

听觉联想内容：{content}
上下文：{context}

要求：
1. 生成适合TTS朗读的中文文本
2. 内容要有助于记忆联想
3. 语言自然流畅
4. 长度适中（50-200字）
5. 只返回脚本文本，不要其他内容

示例格式："想象一下，当你听到轻快的钢琴声时..."
"""

    try:
        # Generate the script
        script_response = await model.generate_content_async(script_generation)
        audio_script = script_response.text.strip()
        
        try:
            # Try to generate the actual audio using Google Text-to-Speech
            client = texttospeech.TextToSpeechClient()
            
            # Set the text input to be synthesized
            synthesis_input = texttospeech.SynthesisInput(text=audio_script)
            
            # Build the voice request, select the language code and the voice gender
            # Using Basic voice for more synthetic/robotic sound instead of natural human voice
            voice = texttospeech.VoiceSelectionParams(
                language_code="cmn-CN",
                name="cmn-CN-Standard-C",  # Using Standard-C for more synthetic sound
                ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL,  # Neutral gender for more robotic feel
            )
            
            # Select the type of audio file you want returned
            # Adding effects to make it sound more synthetic
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=0.9,  # Slightly slower for more robotic feel
                pitch=-2.0,  # Lower pitch for synthetic sound
                volume_gain_db=-3.0  # Slightly quieter
            )
            
            # Perform the text-to-speech request
            response = client.synthesize_speech(
                input=synthesis_input, voice=voice, audio_config=audio_config
            )
            
            # Convert audio to base64
            audio_base64 = base64.b64encode(response.audio_content).decode('utf-8')
            
            return {
                "audio_base64": f"data:audio/mp3;base64,{audio_base64}",
                "script": audio_script,
                "duration": len(audio_script) * 0.1  # Rough estimate
            }
        except Exception as tts_error:
            print(f"Text-to-Speech generation failed: {tts_error}")
            # Return script only when audio generation fails
            return {
                "audio_base64": None,
                "script": audio_script,  # Still return the generated script
                "duration": len(audio_script) * 0.1
            }
        
    except Exception as e:
        print(f"Error generating audio script: {e}")
        return {
            "audio_base64": None,
            "script": f"音频脚本：{content}的听觉联想描述",  # Fallback script
            "duration": 0
        }

