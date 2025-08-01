"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Share2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface KeyPrinciple {
  concept: string
  example: string
}

interface MemoryScene {
  principle: string
  scene: string
  anchor: string
}

interface MemoryMnemonicProps {
  mnemonic: {
    id: string
    title: string
    content: string
    type: string
    explanation?: string
    corePoint?: string
    keyPrinciples?: KeyPrinciple[]
    theme?: string
    scenes?: MemoryScene[]
  }
  onShare?: () => void
}

export default function MemoryMnemonic({ mnemonic, onShare }: MemoryMnemonicProps) {
  const { toast } = useToast()

  const getTypeColor = (type: string) => {
    switch (type) {
      case "rhyme":
        return "text-cyan-400"
      case "acronym":
        return "text-violet-400"
      case "story":
        return "text-pink-400"
      case "palace":
        return "text-orange-400"
      case "summary":
        return "text-green-400"
      default:
        return "text-cyan-400"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "rhyme":
        return "🎵"
      case "acronym":
        return "🔤"
      case "story":
        return "📖"
      case "palace":
        return "🏰"
      case "summary":
        return "📋"
      default:
        return "📝"
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic.content)
    toast({
      title: "已复制到剪贴板",
      description: "内容已成功复制到剪贴板",
      open: true,
    })
  }

  return (
    <Card className="border border-white/10 bg-white/5 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2 text-xl">{getTypeIcon(mnemonic.type)}</span>
            <h3 className={`text-lg font-medium ${getTypeColor(mnemonic.type)}`}>{mnemonic.title}</h3>
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

        <div className="whitespace-pre-line rounded-lg border border-white/10 bg-black/50 p-4 font-medium text-white">
          {mnemonic.content}
        </div>

        {/* 记忆宫殿场景展示 */}
        {mnemonic.type === "palace" && mnemonic.scenes && mnemonic.scenes.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-3 font-medium text-cyan-400">🏛️ 记忆场景</h4>
            <div className="space-y-3">
              {mnemonic.scenes.map((scene, index) => (
                <div key={index} className="rounded-lg border border-white/10 bg-black/30 p-3">
                  <div className="mb-2 flex items-center">
                    <span className="mr-2 text-sm font-medium text-violet-400">原理：</span>
                    <span className="text-sm text-white">{scene.principle}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-sm font-medium text-pink-400">场景：</span>
                    <p className="mt-1 text-sm text-white/90">{scene.scene}</p>
                  </div>
                  <div>
                    <span className="mr-2 text-sm font-medium text-cyan-400">记忆锚点：</span>
                    <span className="text-sm text-white">{scene.anchor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 核心总结的关键原理和核心要点展示 */}
        {mnemonic.type === "summary" && (
          <div className="mt-4 space-y-4">
            {mnemonic.corePoint && (
              <div>
                <h4 className="mb-2 font-medium text-cyan-400">🎯 核心要点</h4>
                <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                  <p className="text-sm text-white/90">{mnemonic.corePoint}</p>
                </div>
              </div>
            )}
            
            {mnemonic.keyPrinciples && mnemonic.keyPrinciples.length > 0 && (
              <div>
                <h4 className="mb-3 font-medium text-violet-400">🔑 关键原理</h4>
                <div className="space-y-2">
                  {mnemonic.keyPrinciples.map((principle, index) => (
                    <div key={index} className="rounded-lg border border-white/10 bg-black/30 p-3">
                      <div className="mb-1">
                        <span className="text-sm font-medium text-pink-400">概念：</span>
                        <span className="ml-2 text-sm text-white">{principle.concept}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-cyan-400">示例：</span>
                        <p className="mt-1 text-sm text-white/90">{principle.example}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {mnemonic.explanation && (
          <div className="mt-4 text-sm text-white/80">
            <p className="font-medium text-white">说明：</p>
            <p className="text-white/90">{mnemonic.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
