"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Info, Image, Music, Clock } from "lucide-react"

interface FeatureDevelopmentBannerProps {
  features?: Array<{
    name: string
    icon: React.ReactNode
    description: string
    status: "coming-soon" | "in-development" | "beta"
  }>
}

export default function FeatureDevelopmentBanner({ 
  features = [
    {
      name: "AI图片生成",
      icon: <Image className="h-4 w-4" />,
      description: "基于AI的图像生成功能，将文字描述转换为生动的视觉图像",
      status: "in-development" as const
    },
    {
      name: "AI音频合成", 
      icon: <Music className="h-4 w-4" />,
      description: "智能语音合成技术，为记忆内容生成自然流畅的语音",
      status: "in-development" as const
    }
  ]
}: FeatureDevelopmentBannerProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "coming-soon":
        return "bg-gray-500"
      case "in-development":
        return "bg-blue-500"
      case "beta":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "coming-soon":
        return "即将推出"
      case "in-development":
        return "开发中"
      case "beta":
        return "测试版"
      default:
        return "开发中"
    }
  }

  return (
    <div className="mb-6 space-y-4">
      <Alert className="border-blue-500/20 bg-blue-500/5 text-blue-200">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">🚧 新功能开发中</span>
              <p className="text-blue-300 mt-1">
                我们正在开发更多AI功能，为您提供更丰富的记忆辅助体验
              </p>
            </div>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
              <Clock className="h-3 w-3 mr-1" />
              开发进度
            </Badge>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid gap-3 md:grid-cols-2">
        {features.map((feature, index) => (
          <div 
            key={index}
            className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="text-blue-400">{feature.icon}</div>
                <h4 className="font-medium text-white">{feature.name}</h4>
              </div>
              <Badge 
                variant="outline" 
                className={`${getStatusColor(feature.status)} border-none text-white text-xs`}
              >
                {getStatusText(feature.status)}
              </Badge>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              {feature.description}
            </p>
            <div className="mt-3">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    feature.status === "in-development" ? "bg-blue-500 w-2/3" :
                    feature.status === "beta" ? "bg-orange-500 w-4/5" :
                    "bg-gray-500 w-1/4"
                  } transition-all duration-300`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-xs text-white/50">
          💡 当前功能返回专业的生成提示词和建议，为您未来使用完整功能做好准备
        </p>
      </div>
    </div>
  )
}