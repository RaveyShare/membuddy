"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Share2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface MemoryMnemonicProps {
  mnemonic: {
    id: string
    title: string
    content: string
    type: string
    explanation?: string
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
      default:
        return "📝"
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic.content)
    toast({
      title: "已复制到剪贴板",
      description: "内容已成功复制到剪贴板",
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
