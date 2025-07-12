import google.generativeai as genai
from config import settings
import json
import re

genai.configure(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPT = """你是小杏仁记忆搭子，负责帮助用户记忆。你会根据用户输入的内容，生成思维导图、记忆口诀和感官联想。


记忆口诀生成三种类型：顺口溜记忆法、首字母记忆法、故事联想法。
感官联想也分为三类：视觉联想、听觉联想和触觉联想。

注意严格按照如下格式输出，不需要任何多余的内容，只需要在对应的位置填入 content：

mind_map = {
    "id": "root",
    "label": "content" 或 "记忆主题",
    "children": [
        {"id": "part1", "label": "content", "children": [
            {"id": "leaf1", "label": "content"},
            {"id": "leaf2", "label": "content"}
        ]},
        {"id": "part2", "label": "content", "children": [
            {"id": "leaf3", "label": "content"},
            {"id": "leaf4", "label": "content"}
        ]}
    ]
}

mnemonics = [
    {
        "id": "rhyme", "title": "顺口溜记忆法", "content": "content，顺口溜助记。", "type": "rhyme"
    },
    {
        "id": "acronym", "title": "首字法", "content": "", "type": "acronym", "explanation": "利用首字母记忆"
    },
    {
        "id": "story", "title": "故事联想法", "content": "想象一个故事串联：", "type": "story"
    }
]

sensory_associations = [
    {
        "id": "visual", "title": "视觉联想", "type": "visual", "content": [
            {"dynasty": "content", "image": "🌟", "color": "#fbbf24", "association": ""},
            {"dynasty": "content", "image": "🔵", "color": "#06b6d4", "association": ""}
        ]
    },
    {
        "id": "auditory", "title": "听觉联想", "type": "auditory", "content": [
            {"dynasty": "content", "sound": "叮咚声", "rhythm": "节奏感"},
            {"dynasty": "content", "sound": "风声", "rhythm": "轻快"}
        ]
    },
    {
        "id": "tactile", "title": "触觉联想", "type": "tactile", "content": [
            {"dynasty": "content", "texture": "柔软", "feeling": "温暖"},
            {"dynasty": "content", "texture": "坚硬", "feeling": "冰凉"}
        ]
    }
]"""

def parse_gemini_response(text: str):
    try:
        # Extract mind_map
        mind_map_match = re.search(r"mind_map\s*=\s*({[\s\S]*?})\s*(?=\n\w+\s*=|$)", text, re.MULTILINE)
        mind_map = None
        if mind_map_match:
            try:
                mind_map_str = mind_map_match.group(1).replace("'", '"').replace(r'(\w+):', r'"\1":').replace(',\s*}', '}').replace(',\s*]', ']')
                mind_map = json.loads(mind_map_str)
            except Exception as e:
                print(f"Error parsing mind_map: {e}")

        # Extract mnemonics
        mnemonics_match = re.search(r"mnemonics\s*=\s*(\[[\s\S]*?\])\s*(?=\n\w+\s*=|$)", text, re.MULTILINE)
        mnemonics = []
        if mnemonics_match:
            try:
                mnemonics_str = mnemonics_match.group(1).replace("'", '"').replace(r'(\w+):', r'"\1":').replace(',\s*}', '}').replace(',\s*]', ']')
                mnemonics = json.loads(mnemonics_str)
            except Exception as e:
                print(f"Error parsing mnemonics: {e}")

        # Extract sensory_associations
        sensory_match = re.search(r"sensory_associations\s*=\s*(\[[\s\S]*?\])\s*$", text, re.MULTILINE)
        sensory_associations = []
        if sensory_match:
            try:
                sensory_str = sensory_match.group(1).replace("'", '"').replace(r'(\w+):', r'"\1":').replace(',\s*}', '}').replace(',\s*]', ']')
                sensory_associations = json.loads(sensory_str)
            except Exception as e:
                print(f"Error parsing sensory_associations: {e}")

        return {
            "mindMap": mind_map,
            "mnemonics": mnemonics,
            "sensoryAssociations": sensory_associations,
        }
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        return None


async def generate_memory_aids(content: str):
    model = genai.GenerativeModel('gemini-2.5-flash')
    prompt = f"{SYSTEM_PROMPT}\n\n用户输入的内容：{content}\n\n请为这个内容生成记忆辅助工具."

    try:

        response = await model.generate_content_async(prompt)
        print(response.text)
        parsed_response = parse_gemini_response(response.text)
        return parsed_response
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return None
