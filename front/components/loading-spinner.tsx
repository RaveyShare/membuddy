"use client"

import { Loader2, Brain } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface LoadingSpinnerProps {
  message?: string
  showBrain?: boolean
}

export default function LoadingSpinner({
  message = "AI 正在生成记忆辅助工具...",
  showBrain = true,
}: LoadingSpinnerProps) {
  return (
    <Card className="border border-white/10 bg-white/5 backdrop-blur-sm">
      <CardContent className="flex flex-col items-center justify-center p-12">
        <div className="relative mb-6">
          {showBrain && <Brain className="h-12 w-12 text-cyan-400 animate-pulse" />}
          <Loader2 className="h-8 w-8 animate-spin text-violet-400 absolute -bottom-2 -right-2" />
        </div>

        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-white">{message}</p>
          <p className="text-sm text-white/60">正在分析您的内容并生成个性化记忆方案...</p>
        </div>

        <div className="mt-6 flex space-x-2">
          <div className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce" />
          <div className="h-2 w-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
          <div className="h-2 w-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
        </div>
      </CardContent>
    </Card>
  )
}
