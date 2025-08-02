"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Share2, Eye, Volume2, Hand, Image, Music } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api-config"
import { useState } from "react"

interface SensoryAssociationProps {
  association: {
    id: string
    title: string
    type: string
    content: any[]
  }
  onShare?: () => void
}

export default function SensoryAssociation({ association, onShare }: SensoryAssociationProps) {
  const { toast } = useToast()
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<{[key: string]: any}>({})

  const getTypeColor = (type: string) => {
    switch (type) {
      case "visual":
        return "text-pink-400"
      case "auditory":
        return "text-green-400"
      case "tactile":
        return "text-orange-400"
      default:
        return "text-pink-400"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "visual":
        return <Eye className="h-5 w-5" />
      case "auditory":
        return <Volume2 className="h-5 w-5" />
      case "tactile":
        return <Hand className="h-5 w-5" />
      default:
        return <Eye className="h-5 w-5" />
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "已复制到剪贴板",
      description: "内容已成功复制到剪贴板",
    })
  }

  const generateImage = async (content: string, type: string) => {
    setIsGeneratingImage(true)
    try {
      const result = await api.generateImage(content, `视觉联想: ${type}`)
      setGeneratedContent(prev => ({ 
        ...prev, 
        [`image_${type}`]: {
          prompt: result.prompt,
          image_url: result.image_url,
          image_base64: result.image_base64,
          message: result.message,
          status: result.status
        }
      }))
      toast({
        title: "图片生成提示词已生成",
        description: "AI图片生成功能正在开发中，当前返回生成提示词",
      })
    } catch (error) {
      toast({
        title: "生成失败",
        description: "图片生成失败，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const generateAudio = async (content: string, type: string) => {
    setIsGeneratingAudio(true)
    try {
      const result = await api.generateAudio(content, `听觉联想: ${type}`)
      setGeneratedContent(prev => ({ 
        ...prev, 
        [`audio_${type}`]: {
          script: result.script,
          audio_base64: result.audio_base64,
          duration: result.duration,
          sound_description: result.sound_description,
          sound_type: result.sound_type,
          message: result.message,
          suggestions: result.suggestions,
          status: result.status,
          voice: result.voice
        }
      }))
      toast({
        title: "音频生成建议已生成",
        description: "AI音频生成功能正在开发中，当前返回生成建议",
      })
    } catch (error) {
      toast({
        title: "生成失败",
        description: "音频生成失败，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  const handleCopy = () => {
    const content = association.content
      .map((item) => {
        if (association.type === "visual") {
          return `${item.dynasty}: ${item.image} ${item.association}`
        } else if (association.type === "auditory") {
          return `${item.dynasty}: ${item.sound}, ${item.rhythm}`
        } else {
          return `${item.dynasty}: ${item.texture}, ${item.feeling}`
        }
      })
      .join("\n")

    copyToClipboard(content)
  }

  const renderVisualContent = (content: any[]) => (
    <div className="grid gap-4 md:grid-cols-2">
      {content.map((item, index) => (
        <div
          key={index}
          className="rounded-lg border border-white/10 bg-black/50 p-4"
          style={{ borderLeftColor: item.color, borderLeftWidth: "4px" }}
        >
          <div className="mb-2 flex items-center">
            <span className="mr-2 text-2xl">{item.image}</span>
            <h4 className="font-medium text-white">{item.dynasty}</h4>
          </div>
          <p className="text-sm text-white">{item.association}</p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateImage(item.association, item.dynasty)}
              disabled={isGeneratingImage}
              className="flex items-center gap-1"
            >
              <Image className="h-3 w-3" />
              {isGeneratingImage ? '生成中...' : '生成图片'}
            </Button>
            {generatedContent[`image_${item.dynasty}`] && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(typeof generatedContent[`image_${item.dynasty}`] === 'string' ? generatedContent[`image_${item.dynasty}`] : generatedContent[`image_${item.dynasty}`].prompt)}
                className="flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                复制提示词
              </Button>
            )}
          </div>
          {generatedContent[`image_${item.dynasty}`] && (
            <div className="mt-2 rounded-lg bg-blue-500/10 p-3">
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium text-blue-400">🚧 AI图片生成功能开发中</span>
              </div>
              
              {typeof generatedContent[`image_${item.dynasty}`] === 'string' ? (
                <>
                  <p className="text-sm font-medium text-green-400 mb-1">生成的提示词:</p>
                  <p className="text-sm text-white bg-black/30 p-2 rounded">{generatedContent[`image_${item.dynasty}`]}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-green-400 mb-1">生成的提示词:</p>
                  <p className="text-sm text-white bg-black/30 p-2 rounded">{generatedContent[`image_${item.dynasty}`].prompt}</p>
                  
                  {generatedContent[`image_${item.dynasty}`].message && (
                    <div className="mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                      <p className="text-sm text-yellow-400">{generatedContent[`image_${item.dynasty}`].message}</p>
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-gray-400">
                    💡 实际图片生成功能正在开发中，当前提供专业的AI绘图提示词
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const renderAuditoryContent = (content: any[]) => (
    <div className="space-y-4">
      {content.map((item, index) => (
        <div key={index} className="rounded-lg border border-white/10 bg-black/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-medium text-white">{item.dynasty}</h4>
            <Button variant="ghost" size="sm" className="text-green-400 hover:bg-green-400/10">
              <Volume2 className="mr-1 h-4 w-4" />
              播放
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white">
              <span className="font-medium text-green-400">声音：</span>
              {item.sound}
            </p>
            <p className="text-sm text-white">
              <span className="font-medium text-green-400">节奏：</span>
              {item.rhythm}
            </p>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateAudio(`${item.sound}, ${item.rhythm}`, item.dynasty)}
              disabled={isGeneratingAudio}
              className="flex items-center gap-1"
            >
              <Music className="h-3 w-3" />
              {isGeneratingAudio ? '生成中...' : '生成音频'}
            </Button>
            {generatedContent[`audio_${item.dynasty}`] && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(typeof generatedContent[`audio_${item.dynasty}`] === 'string' ? generatedContent[`audio_${item.dynasty}`] : generatedContent[`audio_${item.dynasty}`].script)}
                className="flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                复制脚本
              </Button>
            )}
          </div>
          {generatedContent[`audio_${item.dynasty}`] && (
            <div className="mt-2 rounded-lg bg-purple-500/10 p-3">
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium text-purple-400">🚧 AI音频生成功能开发中</span>
              </div>
              
              {typeof generatedContent[`audio_${item.dynasty}`] === 'string' ? (
                <>
                  <p className="text-sm font-medium text-green-400 mb-1">生成的建议:</p>
                  <p className="text-sm text-white bg-black/30 p-2 rounded">{generatedContent[`audio_${item.dynasty}`]}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-green-400 mb-1">音频脚本:</p>
                  <p className="text-sm text-white bg-black/30 p-2 rounded">{generatedContent[`audio_${item.dynasty}`].script}</p>
                  
                  {generatedContent[`audio_${item.dynasty}`].suggestions && (
                    <>
                      <p className="text-sm font-medium text-blue-400 mb-1 mt-2">语音合成建议:</p>
                      <p className="text-sm text-white bg-black/30 p-2 rounded">{generatedContent[`audio_${item.dynasty}`].suggestions}</p>
                    </>
                  )}
                  
                  {generatedContent[`audio_${item.dynasty}`].message && (
                    <div className="mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                      <p className="text-sm text-yellow-400">{generatedContent[`audio_${item.dynasty}`].message}</p>
                    </div>
                  )}
                  
                  {generatedContent[`audio_${item.dynasty}`].voice && (
                    <p className="text-sm text-gray-400 mt-2">推荐语音: {generatedContent[`audio_${item.dynasty}`].voice}</p>
                  )}
                  
                  <div className="mt-2 text-xs text-gray-400">
                    💡 实际音频生成功能正在开发中，当前提供专业的语音合成建议
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const renderTactileContent = (content: any[]) => (
    <div className="grid gap-4 md:grid-cols-2">
      {content.map((item, index) => (
        <div key={index} className="rounded-lg border border-white/10 bg-black/50 p-4">
          <h4 className="mb-2 font-medium text-white">{item.dynasty}</h4>
          <div className="space-y-2">
            <p className="text-sm text-white">
              <span className="font-medium text-orange-400">质感：</span>
              {item.texture}
            </p>
            <p className="text-sm text-white">
              <span className="font-medium text-orange-400">感受：</span>
              {item.feeling}
            </p>
          </div>
        </div>
      ))}
    </div>
  )

  const renderContent = () => {
    switch (association.type) {
      case "visual":
        return renderVisualContent(association.content)
      case "auditory":
        return renderAuditoryContent(association.content)
      case "tactile":
        return renderTactileContent(association.content)
      default:
        return null
    }
  }

  return (
    <Card className="border border-white/10 bg-white/5 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className={`mr-2 ${getTypeColor(association.type)}`}>{getTypeIcon(association.type)}</div>
            <h3 className={`text-lg font-medium ${getTypeColor(association.type)}`}>{association.title}</h3>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={handleCopy}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={onShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {renderContent()}

        <div className="mt-4 rounded-lg border border-white/10 bg-gradient-to-r from-pink-500/10 to-orange-500/10 p-3">
          <p className="text-sm text-white">
            <span className="font-medium text-white">💡 记忆提示：</span>
            通过{association.type === "visual" ? "视觉想象" : association.type === "auditory" ? "听觉联想" : "触觉感受"}
            来加强记忆印象， 让抽象的概念变得具体可感。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
