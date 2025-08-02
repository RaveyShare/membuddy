"""Prompt Templates for Memory Aids Generation
Contains Chinese and English prompt templates for different AI providers
"""

class PromptTemplates:
    """Memory aids generation prompt templates"""
    
    @staticmethod
    def get_memory_aids_prompt(content: str, language: str = "en") -> str:
        """Get memory aids generation prompt
        
        Args:
            content: User input content
            language: Language code ("en" for English, "zh" for Chinese)
            
        Returns:
            Formatted prompt string
        """
        if language == "zh":
            return PromptTemplates._get_chinese_prompt(content)
        else:
            return PromptTemplates._get_english_prompt(content)
    
    @staticmethod
    def _get_english_prompt(content: str) -> str:
        """English prompt template"""
        return f"""You are MemBuddy, an AI assistant that helps users with memory techniques. Based on the following content, generate mind maps, mnemonics, and sensory associations.

Generate three types of mnemonics: Rhyme Memory Method, Core Content Summary, Memory Palace Encoding.

For Core Content Summary, please follow these requirements:
1. Extract core arguments: Summarize the most core and overall thoughts or arguments of the text in one or two sentences
2. Structured breakdown: Break down the text content into several key principles, viewpoints, or main parts
3. Distinguish viewpoints from examples: For each point, clearly divide it into two levels: concept/viewpoint and example/practice

For Memory Palace Encoding, please follow these requirements:
1. Set theme: As a memory master, create an imaginative and unified "memory palace" theme for all key points from the core content summary
2. Create scenes: Precisely map each key principle from the summary to a specific "room", "station", "scene" or "step" in the theme
3. Inject vivid details: Use strong visual, action and sensory language to create concrete, vivid images that symbolically represent corresponding principles and examples
4. Clear connection points: End each scene description with a clear "memory anchor" to firmly connect the vivid image with abstract concepts

User input: {content}

Please output strictly in the following JSON format without any additional content:

{{
  "mindMap": {{
    "id": "root",
    "label": "Memory Topic",
    "children": [
      {{
        "id": "part1",
        "label": "Main Content 1",
        "children": [
          {{ "id": "leaf1", "label": "Detail 1" }},
          {{ "id": "leaf2", "label": "Detail 2" }}
        ]
      }}
    ]
  }},
  "mnemonics": [
    {{
      "id": "rhyme",
      "title": "Rhyme Memory Method",
      "content": "Catchy rhyme for memory",
      "type": "rhyme"
    }},
    {{"id": "summary",
      "title": "Core Content Summary",
      "content": "Complete summary description based on core arguments and key principles",
      "type": "summary",
      "corePoint": "Core argument summary",
      "keyPrinciples": [
        {{
          "concept": "Concept/Viewpoint",
          "example": "Example/Practice"
        }}
      ]
    }},
    {{
      "id": "palace",
      "title": "Memory Palace Encoding",
      "content": "Complete memory palace description based on theme and scenes",
      "type": "palace",
      "theme": "Memory palace theme",
      "scenes": [
        {{
          "principle": "Corresponding principle",
          "scene": "Vivid scene description",
          "anchor": "Memory anchor"
        }}
      ]
    }}
  ],
  "sensoryAssociations": [
    {{
      "id": "visual",
      "title": "Visual Association",
      "type": "visual",
      "content": [
        {{
          "dynasty": "Content 1",
          "image": "🌟",
          "color": "#fbbf24",
          "association": "Visual association description"
        }}
      ]
    }},
    {{
      "id": "auditory",
      "title": "Auditory Association",
      "type": "auditory",
      "content": [
        {{ "dynasty": "Content 1", "sound": "Sound description", "rhythm": "Rhythm feel" }}
      ]
    }},
    {{
      "id": "tactile",
      "title": "Tactile Association",
      "type": "tactile",
      "content": [
        {{ "dynasty": "Content 1", "texture": "Texture", "feeling": "Touch feeling" }}
      ]
    }}
  ]
}}"""
    
    @staticmethod
    def _get_chinese_prompt(content: str) -> str:
        """Chinese prompt template"""
        return f"""你是MemBuddy，一个帮助用户进行记忆技巧的AI助手。基于以下内容，生成思维导图、记忆口诀和感官联想。

生成三种类型的记忆口诀：韵律记忆法、核心内容总结、记忆宫殿编码。

对于核心内容总结，请遵循以下要求：
1. 提取核心论点：用一到两句话总结文本最核心、最整体的思想或论点
2. 结构化分解：将文本内容分解为几个关键原理、观点或主要部分
3. 区分观点与实例：对于每个要点，明确分为两个层次：概念/观点 和 实例/实践

对于记忆宫殿编码，请遵循以下要求：
1. 设定主题：作为记忆大师，为核心内容总结中的所有要点创建一个富有想象力且统一的"记忆宫殿"主题
2. 创建场景：将总结中的每个关键原理精确映射到主题中的特定"房间"、"站点"、"场景"或"步骤"
3. 注入生动细节：使用强烈的视觉、动作和感官语言，创造具体、生动的画面，象征性地代表相应的原理和实例
4. 明确连接点：在每个场景描述的结尾提供清晰的"记忆锚点"，将生动的画面与抽象概念牢固连接

用户输入：{content}

请严格按照以下JSON格式输出，不要包含任何额外内容：

{{
  "mindMap": {{
    "id": "root",
    "label": "记忆主题",
    "children": [
      {{
        "id": "part1",
        "label": "主要内容1",
        "children": [
          {{ "id": "leaf1", "label": "细节1" }},
          {{ "id": "leaf2", "label": "细节2" }}
        ]
      }}
    ]
  }},
  "mnemonics": [
    {{
      "id": "rhyme",
      "title": "韵律记忆法",
      "content": "朗朗上口的记忆口诀",
      "type": "rhyme"
    }},
    {{"id": "summary",
      "title": "核心内容总结",
      "content": "基于核心论点和关键原理的完整总结描述",
      "type": "summary",
      "corePoint": "核心论点总结",
      "keyPrinciples": [
        {{
          "concept": "概念/观点",
          "example": "实例/实践"
        }}
      ]
    }},
    {{
      "id": "palace",
      "title": "记忆宫殿编码",
      "content": "基于主题和场景的完整记忆宫殿描述",
      "type": "palace",
      "theme": "记忆宫殿主题",
      "scenes": [
        {{
          "principle": "对应原理",
          "scene": "生动场景描述",
          "anchor": "记忆锚点"
        }}
      ]
    }}
  ],
  "sensoryAssociations": [
    {{
      "id": "visual",
      "title": "视觉联想",
      "type": "visual",
      "content": [
        {{
          "dynasty": "内容",
          "image": "🧠",
          "color": "#3b82f6",
          "association": "视觉化的记忆描述"
        }}
      ]
    }},
    {{
      "id": "auditory",
      "title": "听觉联想",
      "type": "auditory",
      "content": [
        {{
          "dynasty": "内容",
          "sound": "声音描述",
          "rhythm": "节奏感"
        }}
      ]
    }},
    {{
      "id": "tactile",
      "title": "触觉联想",
      "type": "tactile",
      "content": [
        {{
          "dynasty": "内容",
          "texture": "质感",
          "feeling": "触感"
        }}
      ]
    }}
  ]
}}"""

# 导出类
__all__ = ["PromptTemplates"]