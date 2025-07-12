"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Brain, Calendar, Star, Edit, Trash2, Share2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api-config"
import { useToast } from "@/components/ui/use-toast"
import AuthGuard from "@/components/auth/auth-guard"

export default function MemoryItemPage() {
  const [memoryItem, setMemoryItem] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  useEffect(() => {
    const fetchMemoryItem = async () => {
      try {
        const item = await api.getMemoryItem(params.id as string)
        setMemoryItem(item)
      } catch (error) {
        console.error("Failed to fetch memory item:", error)
        // Use mock data for demo
        setMemoryItem({
          id: params.id,
          title: "示例记忆项目",
          content: "这是一个示例记忆项目的详细内容。",
          category: "示例",
          createdAt: new Date().toISOString(),
          nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          daysUntilReview: 1,
          starred: false,
          reviewCount: 0,
          mastery: 0,
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchMemoryItem()
    }
  }, [params.id])

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "语言学习":
        return "bg-blue-500/20 text-blue-400 border-blue-400/30"
      case "学习笔记":
        return "bg-green-500/20 text-green-400 border-green-400/30"
      case "生活提醒":
        return "bg-purple-500/20 text-purple-400 border-purple-400/30"
      case "新记忆":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-400/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-400/30"
    }
  }

  const getDaysText = (days: number, reviewDate: string) => {
    // 如果没有天数信息，计算天数差
    if (days === undefined || days === null || isNaN(days)) {
      if (!reviewDate) return "未设置"

      const today = new Date()
      const review = new Date(reviewDate)
      const diffTime = review.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return "今天"
      if (diffDays === 1) return "明天"
      if (diffDays < 0) return "已过期"
      return `${diffDays}天后`
    }

    if (days === 0) return "今天"
    if (days === 1) return "明天"
    if (days < 0) return "已过期"
    return `${days}天后`
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center">
          <Brain className="h-12 w-12 animate-pulse text-cyan-400" />
          <p className="mt-4 text-white/70">加载中...</p>
        </div>
      </div>
    )
  }

  if (!memoryItem) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center">
          <Brain className="mx-auto h-12 w-12 text-white/30" />
          <p className="mt-4 text-white/70">记忆项目不存在</p>
          <Button className="mt-4" onClick={() => router.push("/")}>
            返回首页
          </Button>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-black text-white">
        {/* Navigation */}
        <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
          <div className="container flex h-16 items-center justify-between px-4">
            <Link className="flex items-center space-x-2 font-bold" href="/">
              <Brain className="h-6 w-6 text-cyan-400" />
              <span>小杏仁记忆搭子</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link className="text-sm hover:text-cyan-400" href="/memory-library">
                记忆库
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="mb-8 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="mr-4 rounded-full hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">记忆详情</h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-4xl"
          >
            <Card className="border border-white/10 bg-white/5 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-2xl text-white">{memoryItem.title}</CardTitle>
                      {memoryItem.starred && <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />}
                    </div>
                    <Badge variant="outline" className={`${getCategoryColor(memoryItem.category)}`}>
                      {memoryItem.category}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-violet-400 text-violet-400 hover:bg-violet-400/10"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="border-red-400 text-red-400 hover:bg-red-400/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-2 text-lg font-medium text-white">内容</h3>
                  <div className="rounded-lg border border-white/10 bg-black/50 p-4">
                    <p className="text-white whitespace-pre-wrap">{memoryItem.content}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-5 w-5 text-cyan-400" />
                      <h4 className="font-medium text-white">下次复习</h4>
                    </div>
                    <p className="text-cyan-400">{getDaysText(memoryItem.daysUntilReview, memoryItem.nextReview)}</p>
                    <p className="text-sm text-white/50">{memoryItem.nextReview}</p>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="h-5 w-5 text-violet-400" />
                      <h4 className="font-medium text-white">学习进度</h4>
                    </div>
                    <p className="text-violet-400">复习 {memoryItem.reviewCount || 0} 次</p>
                    <p className="text-sm text-white/50">掌握度 {memoryItem.mastery || 0}%</p>
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <Button className="bg-gradient-to-r from-cyan-400 to-violet-500 text-black hover:from-cyan-500 hover:to-violet-600">
                    开始复习
                  </Button>
                  <Button variant="outline" className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10">
                    生成记忆工具
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </AuthGuard>
  )
}
