"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Share2, Eye, Volume2, Hand } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

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

    navigator.clipboard.writeText(content)
    toast({
      title: "已复制到剪贴板",
      description: "内容已成功复制到剪贴板",
    })
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
