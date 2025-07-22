"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Brain, BarChart, Tag, Loader2, BookOpen, Eye } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api-config"
import { useToast } from "@/components/ui/use-toast"
import AuthGuard from "@/components/auth/auth-guard"
import { formatInLocalTimezone } from "@/lib/date"
import MemoryAidsViewer from "@/components/MemoryAidsViewer"
import type { MemoryItem } from "@/lib/types"
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

// 扩展 dayjs 插件
dayjs.extend(utc)
dayjs.extend(timezone)


const MemoryStatusCard = ({ item }: { item: MemoryItem }) => {
  const getRelativeTimeText = (reviewDate?: string | null): string => {
    if (!reviewDate) return "无计划"
    
    // 使用 dayjs 处理 UTC 日期时间
    const userTimezone = dayjs.tz.guess()
    const now = dayjs()
    const reviewTime = dayjs.utc(reviewDate).tz(userTimezone)
    
    // 计算时间差（毫秒）
    const diffMillis = reviewTime.diff(now)
    
    if (diffMillis <= 0) return "已到期"
    
    // 计算时间差（分钟、小时、天）
    const diffMinutes = Math.floor(diffMillis / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays}天后`
    if (diffHours > 0) return `${diffHours}小时后`
    return `${diffMinutes}分钟后`
  }

  return (
    <Card className="border border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle className="flex items-center text-cyan-400">
          <BarChart className="mr-2 h-5 w-5" />
          记忆状态
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">创建于</span>
          <span className="font-medium text-gray-200">{formatInLocalTimezone(item.created_at, "YYYY-MM-DD")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">上次复习</span>
          <span className="font-medium text-gray-200">{item.created_at ? formatInLocalTimezone(item.created_at, "YYYY-MM-DD") : "无记录"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">下次复习</span>
          <span className="font-medium text-cyan-400">
            {item.next_review_date ? formatInLocalTimezone(item.next_review_date, "YYYY-MM-DD HH:mm") : "无计划"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">剩余时间</span>
          <span className="font-medium text-yellow-500">{getRelativeTimeText(item.next_review_date)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">掌握度</span>
          <span className="font-medium text-green-400">{item.mastery}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">复习次数</span>
          <span className="font-medium text-violet-400">{item.reviewCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">难度</span>
          <Badge variant="secondary" className={
            item.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
            item.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }>
            {item.difficulty}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">分类</span>
          <Badge variant="outline" className="border-cyan-400/50 text-cyan-400">{item.category}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-gray-400"><Tag className="inline h-4 w-4 mr-1"/>标签</span>
          {item.tags.map(tag => <Badge key={tag} variant="outline" className="border-cyan-400/50 text-cyan-400">{tag}</Badge>)}
        </div>
      </CardContent>
    </Card>
  )
}

export default function MemoryItemDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [item, setItem] = useState<MemoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const itemId = params.id as string

  useEffect(() => {
    if (!itemId) return
    const fetchItem = async () => {
      try {
        setIsLoading(true)
        const fetchedItem = await api.getMemoryItem(itemId)
        setItem(fetchedItem)
      } catch (error) {
        console.error("Failed to fetch memory item:", error)
        toast({ title: "加载失败", variant: "destructive", open: true })
        router.push("/memory-library")
      } finally {
        setIsLoading(false)
      }
    }
    fetchItem()
  }, [itemId, router, toast])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <p>未找到该记忆项目。</p>
      </div>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-black text-white">
        <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
          <div className="container flex h-16 items-center justify-between px-4">
            <Link className="flex items-center space-x-2 font-bold" href="/">
              <Brain className="h-6 w-6 text-cyan-400" />
              <span>小杏仁记忆搭子</span>
            </Link>
            <Button variant="ghost" onClick={() => router.push("/memory-library")}>
              返回记忆库
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 pt-24 pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-6">
              <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回
              </Button>
              <h1 className="text-3xl font-bold text-white">{item.title}</h1>
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-8">
                <Card className="border border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="flex items-center text-cyan-400">
                      <BookOpen className="mr-2 h-5 w-5" />
                      原始内容
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-base text-white/90">{item.content}</p>
                  </CardContent>
                </Card>
                {item.memory_aids && (
                  <Card className="border border-white/10 bg-white/5">
                    <CardHeader>
                      <CardTitle className="flex items-center text-cyan-400">
                        <Eye className="mr-2 h-5 w-5" />
                        AI 记忆辅助
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MemoryAidsViewer aids={item.memory_aids} onShare={() => {}} />
                    </CardContent>
                  </Card>
                )}
              </div>
              <div className="lg:col-span-1 space-y-8">
                <MemoryStatusCard item={item} />
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </AuthGuard>
  )
}
