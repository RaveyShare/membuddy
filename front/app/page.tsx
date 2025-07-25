"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, Mic, Loader2, Calendar, Star, ArrowRight, Eye, Share2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api-config"
import { useToast } from "@/components/ui/use-toast"
import { authManager } from "@/lib/auth"
import MindMap from "@/components/mind-map"
import MemoryMnemonic from "@/components/memory-mnemonic"
import SensoryAssociation from "@/components/sensory-association"
import MemoryAidsViewer from "@/components/MemoryAidsViewer"
import ShareDialog from "@/components/share-dialog"
import LoadingSpinner from "@/components/loading-spinner"
import { formatInLocalTimezone } from "@/lib/date"
import type { MemoryItem, MemoryAids, Mnemonic, SensoryAssociation as SensoryAssociationType } from "@/lib/types"
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

// 扩展 dayjs 插件
dayjs.extend(utc)
dayjs.extend(timezone)

export default function Home() {
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(authManager.getCurrentUser())
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([])
  const [loadingMemoryItems, setLoadingMemoryItems] = useState(false)

  // Generated content states
  const [generatedContent, setGeneratedContent] = useState<string>("")
  const [generatedAids, setGeneratedAids] = useState<MemoryAids | null>(null)
  const [showGeneratedContent, setShowGeneratedContent] = useState(false)

  // Share dialog states
  const [shareType, setShareType] = useState<string | null>(null)
  const [shareContent, setShareContent] = useState<any>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    setIsAuthenticated(authManager.isAuthenticated())
    setCurrentUser(authManager.getCurrentUser())

    const unsubscribe = authManager.addListener(() => {
      setIsAuthenticated(authManager.isAuthenticated())
      setCurrentUser(authManager.getCurrentUser())
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadMemoryItems()
    }
  }, [isAuthenticated])

  const loadMemoryItems = async () => {
    try {
      setLoadingMemoryItems(true)
      const items = await api.getMemoryItems()
      setMemoryItems(items.slice(0, 5))
    } catch (error) {
      console.error("Failed to load memory items:", error)
      toast({
        title: "加载失败",
        description: error instanceof Error ? error.message : "无法加载记忆项目，请稍后再试",
        variant: "destructive",
        open: true
      })
    } finally {
      setLoadingMemoryItems(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !isAuthenticated) return

    setIsLoading(true)
    setShowGeneratedContent(false)
    const contentToSave = inputValue
    setInputValue("") // 为了更好的用户体验，立即清空输入框

    let savedItem: MemoryItem;

    try {
      // 步骤 1: 保存初始项目。这个操作很快，我们等待它完成。
      savedItem = await api.saveMemoryItem({ content: contentToSave, memory_aids: { mindMap: { id: "", label: "", children: [] }, mnemonics: [], sensoryAssociations: [] } })

      // 步骤 2: 使用新项目乐观地更新UI。
      setMemoryItems((prev) => [savedItem, ...prev.slice(0, 4)])
      setIsLoading(false) // 停止主要的加载动画。
      toast({
        title: "保存成功",
        description: "已添加到提醒事项。AI 正在后台生成辅助工具...",
        open: true
      })
    } catch (error) {
      console.error("Error saving initial memory item:", error)
      setInputValue(contentToSave) // 如果保存失败，恢复输入框内容
      setIsLoading(false)
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "无法保存您的项目，请稍后再试。",
        variant: "destructive",
        open: true
      })
      return // 如果初始保存失败，则停止执行
    }

    // 步骤 3: 在后台生成辅助工具。“即发即忘”。
    // 我们不等待这部分完成。
    (async () => {
      try {
        const memoryAids = await api.generateMemoryAids(savedItem.content)

        // 当AI内容准备好后，显示生成的内容部分
        setGeneratedContent(savedItem.content)
        setGeneratedAids(memoryAids)
        setShowGeneratedContent(true)

        const updatedItem = await api.updateMemoryItemAids(savedItem.id, memoryAids)

        // 使用完整数据（包括辅助工具）更新列表中的特定项目
        setMemoryItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item))

        toast({
          title: "AI 辅助已生成",
          description: `"${savedItem.content.substring(0, 20)}..."的记忆辅助工具已就绪。`,
          open: true
        })
      } catch (error) {
        console.error("Error generating memory aids in background:", error)
        toast({
          title: "AI 辅助生成失败",
          description: `无法为"${savedItem.content.substring(0, 20)}..."生成辅助工具。`,
          variant: "destructive",
          open: true
        })
        // 可选：更新列表中的项目以显示错误状态
        // setMemoryItems(prev => prev.map(item => item.id === savedItem.id ? { ...item, error: "AI generation failed" } : item))
      }
    })();
  }

  const handleMemoryItemClick = (item: MemoryItem) => {
    router.push(`/memory-item/${item.id}`)
  }

  const handleLogout = async () => {
    try {
      await api.auth.logout()
      toast({
        title: "已退出登录",
        description: "感谢使用小杏仁记忆搭子",
        open: true,
      })
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleShare = (type: string, content: any) => {
    setShareType(type)
    setShareContent(content)
    setShareDialogOpen(true)
  }

  const handleViewMemoryAids = () => {
    // 创建一个临时的记忆项目并跳转到记忆库
    router.push("/memory-library")
  }

  const getRelativeTimeText = (reviewDate?: string | null): string => {
    if (!reviewDate) {
      return "无计划";
    }

    // 使用 dayjs 处理 UTC 日期时间
    const userTimezone = dayjs.tz.guess();
    const now = dayjs();
    const reviewTime = dayjs.utc(reviewDate).tz(userTimezone);
    
    // 计算时间差（毫秒）
    const diffMillis = reviewTime.diff(now);

    if (diffMillis <= 0) {
      return "已到期";
    }

    // 计算时间差（秒、分钟、小时、天）
    const diffSeconds = Math.floor(diffMillis / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}天 ${diffHours % 24}小时后`;
    }
    if (diffHours > 0) {
      return `${diffHours}小时 ${diffMinutes % 60}分钟后`;
    }
    if (diffMinutes > 0) {
      return `${diffMinutes}分钟后`;
    }
    return "即将开始";
  };

  const getCategoryColor = (category: string | undefined) => {
    switch (category) {
      case "语言学习":
        return "bg-blue-500/20 text-blue-400 border-blue-400/30"
      case "学习笔记":
        return "bg-green-500/20 text-green-400 border-green-400/30"
      case "生活提醒":
        return "bg-purple-500/20 text-purple-400 border-purple-400/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-400/30"
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link className="flex items-center space-x-2 font-bold" href="/">
            <Brain className="h-6 w-6 text-cyan-400" />
            <span>小杏仁记忆搭子</span>
          </Link>
          <div className="flex items-center space-x-4">
            {isAuthenticated && currentUser ? (
              <>
                <div className="flex items-center space-x-2">
                  <img
                    src={currentUser.avatar || "/placeholder.svg"}
                    alt={currentUser.name}
                    className="h-6 w-6 rounded-full"
                  />
                  <span className="text-sm text-white/70">欢迎, {currentUser.name}</span>
                </div>
                <Link className="text-sm hover:text-cyan-400" href="/memory-library">
                  记忆库
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-sm text-white/70 hover:text-cyan-400"
                >
                  退出
                </Button>
              </>
            ) : (
              <>
                <Link className="text-sm hover:text-cyan-400" href="/auth/login">
                  登录
                </Link>
                <Link className="text-sm hover:text-cyan-400" href="/auth/register">
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 z-[1]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="absolute -left-1/4 top-1/4 h-96 w-96 rounded-full bg-cyan-500/30 blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute -right-1/4 top-1/2 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl"
          />
        </div>

        <div className="container relative z-[3] px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="mx-auto max-w-3xl space-y-8"
          >
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl flex items-center justify-center gap-3">
              <Brain className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 text-cyan-400" />
              小杏仁记忆
            </h1>
            <p className="mx-auto max-w-2xl text-white/80 sm:text-xl">你只管学习，小杏仁帮你记忆</p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mx-auto mt-8 max-w-2xl"
            >
              <form onSubmit={handleSubmit} className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="记一下..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="h-14 rounded-full border-white/20 bg-white/10 px-6 text-white placeholder-white/50 pr-14 text-lg"
                    disabled={isLoading || !isAuthenticated}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full text-white hover:bg-white/10"
                    type="button"
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                </div>
                <Button
                  type="submit"
                  size="icon"
                  className="h-14 w-14 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 text-black hover:from-cyan-500 hover:to-violet-600"
                  disabled={isLoading || !isAuthenticated}
                >
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  )}
                </Button>
              </form>
              {!isAuthenticated && (
                <p className="mt-2 text-sm text-white/50">
                  请 <Link href="/auth/login" className="underline hover:text-cyan-400">登录</Link> 后使用
                </p>
              )}
            </motion.div>

            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="mx-auto mt-8 max-w-2xl"
                >
                  <LoadingSpinner message="AI 正在生成记忆辅助工具..." />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showGeneratedContent && !isLoading && generatedAids && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="mx-auto mt-8 max-w-4xl"
                >
                  <Card className="border border-white/10 bg-white/5 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl text-cyan-400">生成的记忆辅助工具</CardTitle>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 bg-transparent"
                            onClick={handleViewMemoryAids}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            详细查看
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-violet-400 text-violet-400 hover:bg-violet-400/10 bg-transparent"
                            onClick={() => handleShare("mindmap", { title: "记忆辅助工具", data: generatedAids.mindMap })}
                          >
                            <Share2 className="mr-2 h-4 w-4" />
                            分享
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6 rounded-lg border border-white/10 bg-black/50 p-4">
                        <h3 className="mb-2 text-sm font-medium text-white/70">原始内容</h3>
                        <p className="text-white">{generatedContent}</p>
                      </div>

                      <MemoryAidsViewer aids={generatedAids} onShare={handleShare} />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mx-auto mt-12 max-w-2xl"
              >
                <Card className="border border-white/20 bg-white/5 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-medium text-white">提醒事项</h3>
                      <Link
                        href="/memory-library"
                        className="flex items-center text-sm text-cyan-400 hover:text-cyan-300"
                      >
                        查看全部
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </div>

                    {loadingMemoryItems ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                      </div>
                    ) : memoryItems.length > 0 ? (
                      <div className="space-y-3">
                        {memoryItems.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors cursor-pointer"
                            onClick={() => handleMemoryItemClick(item)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-white">{item.content.substring(0, 20)}...</h4>
                                  {/* Add starred logic if needed */}
                                </div>
                                {/* Add category logic if needed */}
                              </div>
                              <p className="text-sm text-white/70 line-clamp-1 mt-1">{item.content}</p>
                              <div className="mt-2 flex items-center justify-between text-white/70 text-xs">
                                <div className="flex items-center text-cyan-400">
                                  <Calendar className="mr-1.5 h-3 w-3" />
                                  <span>{item.next_review_date ? formatInLocalTimezone(item.next_review_date, "YYYY-MM-DD HH:mm") : "无计划"}</span>
                                </div>
                                <p className="text-white/50">{getRelativeTimeText(item.next_review_date)}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <Brain className="mx-auto mb-2 h-8 w-8 text-white/30" />
                        <p className="text-sm text-white/50">还没有记忆项目</p>
                        <p className="text-xs text-white/30">开始记录你想要记住的内容吧</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>
      
      <footer className="border-t border-white/10 py-8">
        <div className="container flex flex-col items-center justify-between space-y-4 px-4 md:flex-row md:space-y-0">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-cyan-400" />
            <span className="font-bold">小杏仁记忆搭子</span>
          </div>
          <p className="text-sm text-white/70">© {new Date().getFullYear()} 小杏仁. 保留所有权利.</p>
          <div className="flex space-x-6">
            <Link className="text-sm text-white/70 hover:text-cyan-400" href="#">
              隐私政策
            </Link>
            <Link className="text-sm text-white/70 hover:text-cyan-400" href="#">
              使用条款
            </Link>
          </div>
        </div>
      </footer>

      <ShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} type={shareType} content={shareContent} />
    </div>
  )
}