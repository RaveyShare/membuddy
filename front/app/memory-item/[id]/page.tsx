"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Brain,
  Calendar,
  Star,
  Clock,
  BarChart,
  Tag,
  Loader2,
  Share2,
  Eye,
  BookOpen,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api-config"
import { useToast } from "@/components/ui/use-toast"
import AuthGuard from "@/components/auth/auth-guard"
import { format } from "date-fns"
import MindMap from "@/components/mind-map"
import MemoryMnemonic from "@/components/memory-mnemonic"
import SensoryAssociation from "@/components/sensory-association"
import ShareDialog from "@/components/share-dialog"
import MemoryAidsViewer from "@/components/MemoryAidsViewer"
import type { MemoryItem, MemoryAids, Mnemonic, SensoryAssociation as SensoryAssociationType } from "@/lib/types"

export default function MemoryItemDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const [item, setItem] = useState<MemoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Share dialog states
  const [shareType, setShareType] = useState<string | null>(null)
  const [shareContent, setShareContent] = useState<any>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

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
        toast({
          title: "加载失败",
          description: "无法加载此记忆项目，请返回重试。",
          variant: "destructive",
        })
        router.push("/memory-library")
      } finally {
        setIsLoading(false)
      }
    }

    fetchItem()
  }, [itemId, router, toast])

  const handleShare = (type: string, content: any) => {
    setShareType(type)
    setShareContent(content)
    setShareDialogOpen(true)
  }

  const getRelativeTimeText = (reviewDate?: string | null): string => {
    if (!reviewDate) return "无计划"
    const now = new Date().getTime()
    const reviewTime = new Date(reviewDate).getTime()
    const diffMillis = reviewTime - now
    if (diffMillis <= 0) return "已到期"
    const diffMinutes = Math.floor(diffMillis / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays > 0) return `${diffDays}天 ${diffHours % 24}小时后`
    if (diffHours > 0) return `${diffHours}小时 ${diffMinutes % 60}分钟后`
    return `${diffMinutes}分钟后`
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
          <p className="mt-4 text-white/70">加载记忆详情...</p>
        </div>
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
        {/* Header */}
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

        {/* Content */}
        <main className="container mx-auto px-4 pt-24 pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-6">
              <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回
              </Button>
              <h1 className="text-3xl font-bold text-white">{item.title}</h1>
              {item.starred && <Star className="mt-2 h-5 w-5 fill-yellow-400 text-yellow-400" />}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Main Content */}
              <div className="lg:col-span-2">
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
                  <Card className="mt-8 border border-white/10 bg-white/5">
                    <CardHeader>
                      <CardTitle className="flex items-center text-cyan-400">
                        <Eye className="mr-2 h-5 w-5" />
                        AI 记忆辅助
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MemoryAidsViewer aids={item.memory_aids} onShare={handleShare} />
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Metadata Sidebar */}
              <div className="lg:col-span-1">
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
                      <span className="font-medium text-gray-200">{format(new Date(item.created_at), "yyyy-MM-dd")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">上次复习</span>
                      <span className="font-medium text-gray-200">{format(new Date(item.review_date), "yyyy-MM-dd")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">下次复习</span>
                      <span className="font-medium text-cyan-400">
                        {item.next_review_date ? format(new Date(item.next_review_date), "yyyy-MM-dd HH:mm") : "无计划"}
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
                      <span className="font-medium text-violet-400">{item.review_count}</span>
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
              </div>
            </div>
          </motion.div>
        </main>
      </div>
      <ShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} type={shareType} content={shareContent} />
    </AuthGuard>
  )
}