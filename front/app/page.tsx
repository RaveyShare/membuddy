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
import ShareDialog from "@/components/share-dialog"
import LoadingSpinner from "@/components/loading-spinner"
import type { MemoryItem, MemoryAids, Mnemonic, SensoryAssociation as SensoryAssociationType } from "@/lib/types"

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
      })
    } finally {
      setLoadingMemoryItems(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !isAuthenticated) return

    let savedItem: MemoryItem | null = null;

    try {
      setIsLoading(true)
      setGeneratedContent(inputValue)
      setShowGeneratedContent(false) // Hide previous results

      toast({
        title: "正在保存...",
        description: "正在将您的内容保存到记忆库。",
        open: true,
      })

      // 1. Save the initial item with just the content
      savedItem = await api.saveMemoryItem({ content: inputValue })
      setMemoryItems((prev) => [savedItem!, ...prev.slice(0, 4)])
      setInputValue("")

      toast({
        title: "保存成功",
        description: "已添加到提醒事项。现在开始生成 AI 辅助...",
        open: true,
      })

      // 2. Generate memory aids in the background
      const memoryAids = await api.generateMemoryAids(savedItem.content)
      setGeneratedAids(memoryAids)
      setShowGeneratedContent(true) // Show the new results

      // 3. Update the item with the generated aids
      if (savedItem.id) {
         const updatedItem = await api.updateMemoryItemAids(savedItem.id, memoryAids);
         // Update the specific item in the list with the full data
         setMemoryItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      }

      toast({
        title: "生成完成",
        description: "记忆辅助工具已生成并更新。",
        open: true,
      })

    } catch (error) {
      console.error("Error in handleSubmit:", error)
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : "发生未知错误，请稍后再试。",
        variant: "destructive",
        open: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMemoryItemClick = (item: MemoryItem) => {
    localStorage.setItem("memoryContent", item.content)
    localStorage.setItem("memoryAidsData", JSON.stringify(item.memory_aids))
    router.push("/memory-aids")
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
    localStorage.setItem("memoryContent", generatedContent)
    localStorage.setItem("memoryAidsData", JSON.stringify(generatedAids))
    router.push("/memory-aids")
  }

  const getDaysText = (reviewDate: string | null) => {
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
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              欢迎使用小杏仁记忆搭子
            </h1>
            <p className="mx-auto max-w-2xl text-white/80 sm:text-xl">输入内容，AI生成记忆工具，智能提醒复习</p>

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

                      <Tabs defaultValue="mindmap" className="w-full">
                        <TabsList className="mb-4 grid w-full grid-cols-3 bg-white/5">
                          <TabsTrigger value="mindmap" className="data-[state=active]:bg-cyan-400 data-[state=active]:text-black">
                            思维导图
                          </TabsTrigger>
                          <TabsTrigger value="mnemonics" className="data-[state=active]:bg-violet-400 data-[state=active]:text-black">
                            记忆口诀
                          </TabsTrigger>
                          <TabsTrigger value="sensory" className="data-[state=active]:bg-pink-400 data-[state=active]:text-black">
                            感官联想
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="mindmap" className="mt-0">
                          <div className="h-[300px] w-full overflow-hidden rounded-lg border border-white/10 bg-black/50">
                            {generatedAids.mindMap && <MindMap data={generatedAids.mindMap} />}
                          </div>
                        </TabsContent>

                        <TabsContent value="mnemonics" className="mt-0 space-y-4">
                          {generatedAids.mnemonics.slice(0, 2).map((mnemonic: Mnemonic) => (
                            <MemoryMnemonic
                              key={mnemonic.id}
                              mnemonic={mnemonic}
                              onShare={() => handleShare("mnemonic", mnemonic)}
                            />
                          ))}
                        </TabsContent>

                        <TabsContent value="sensory" className="mt-0 space-y-4">
                          {generatedAids.sensoryAssociations.slice(0, 1).map((association: SensoryAssociationType) => (
                            <SensoryAssociation
                              key={association.id}
                              association={association}
                              onShare={() => handleShare("sensory", association)}
                            />
                          ))}
                        </TabsContent>
                      </Tabs>
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
                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center text-sm text-cyan-400">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  {/* Add review date logic if needed */}
                                </div>
                                <p className="text-xs text-white/50">{new Date(item.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <Brain className="mx-auto mb-2 h-8 w-8 text-white/30" />
                        <p className="text-sm text-white/50">还没有记忆项目</p>
                        <p className="text-xs text-white/30">开始��录你想要记住的内容吧</p>
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