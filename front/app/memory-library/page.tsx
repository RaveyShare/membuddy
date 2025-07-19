"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Brain,
  Search,
  Filter,
  Star,
  Trash2,
  Edit,
  Eye,
  MoreVertical,
  BookOpen,
  Clock,
  Target,
  Loader2,
  Calendar,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api-config"
import { useToast } from "@/components/ui/use-toast"
import AuthGuard from "@/components/auth/auth-guard"
import { format } from "date-fns"
import { requestNotificationPermission, scheduleReviewNotifications, clearAllScheduledNotifications } from "@/lib/notification"
import { MemoryItem } from "@/lib/types"

export default function MemoryLibraryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchMemoryItems = async () => {
      try {
        const items = await api.getMemoryItems()
        setMemoryItems(items)
      } catch (error) {
        console.error("Failed to fetch memory items:", error)
        toast({ title: "加载失败", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    fetchMemoryItems()
    return () => {
      clearAllScheduledNotifications();
    };
  }, [toast])

  useEffect(() => {
    if (memoryItems.length > 0) {
      requestNotificationPermission().then(permission => {
        if (permission === 'granted') {
          scheduleReviewNotifications(memoryItems);
        }
      });
    }
  }, [memoryItems]);

  const handleViewDetails = (item: MemoryItem) => router.push(`/memory-item/${item.id}`)
  const handleStartReview = (item: MemoryItem) => router.push(`/review/${item.id}`)

  const handleDelete = async (itemToDelete: MemoryItem) => {
    if (window.confirm(`您确定要删除“${itemToDelete.title}”吗？此操作不可撤销。`)) {
      try {
        await api.deleteMemoryItem(itemToDelete.id);
        setMemoryItems(prevItems => prevItems.filter(item => item.id !== itemToDelete.id));
        toast({ title: "删除成功", description: `“${itemToDelete.title}”已被删除。` });
      } catch (error) {
        console.error("Failed to delete memory item:", error);
        toast({ title: "删除失败", variant: "destructive" });
      }
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-500/20 text-green-400"
      case "medium": return "bg-yellow-500/20 text-yellow-400"
      case "hard": return "bg-red-500/20 text-red-400"
      default: return "bg-gray-500/20 text-gray-400"
    }
  }

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return "text-green-400"
    if (mastery >= 60) return "text-yellow-400"
    return "text-red-400"
  }

  const filteredItems = memoryItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags && item.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    const matchesCategory = filterCategory === "all" || item.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return (a.next_review_date ? new Date(a.next_review_date).getTime() : Infinity) - (b.next_review_date ? new Date(b.next_review_date).getTime() : Infinity)
      case "mastery":
        return b.mastery - a.mastery
      case "reviews":
        return b.review_count - a.review_count
      case "alphabetical":
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  const stats = {
    totalItems: memoryItems.length,
    averageMastery: Math.round(memoryItems.reduce((sum, item) => sum + item.mastery, 0) / memoryItems.length) || 0,
    totalReviews: memoryItems.reduce((sum, item) => sum + item.review_count, 0),
    starredItems: memoryItems.filter((item) => item.starred).length,
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
    if (diffDays > 0) return `${diffDays}天后`
    if (diffHours > 0) return `${diffHours}小时后`
    return `${diffMinutes}分钟后`
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
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
            <div className="flex items-center space-x-4">
              <Link className="text-sm text-cyan-400" href="/memory-library">
                记忆库
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="mb-8 flex items-center">
            <Link href="/" className="mr-4 rounded-full p-2 hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold">记忆库</h1>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <Card className="border border-white/10 bg-white/5"><CardContent className="p-4"><div className="flex items-center"><BookOpen className="mr-2 h-5 w-5 text-cyan-400" /><div><p className="text-sm text-white/70">记忆项目</p><p className="text-2xl font-bold text-cyan-400">{stats.totalItems}</p></div></div></CardContent></Card>
            <Card className="border border-white/10 bg-white/5"><CardContent className="p-4"><div className="flex items-center"><Target className="mr-2 h-5 w-5 text-green-400" /><div><p className="text-sm text-white/70">平均掌握度</p><p className="text-2xl font-bold text-green-400">{stats.averageMastery}%</p></div></div></CardContent></Card>
            <Card className="border border-white/10 bg-white/5"><CardContent className="p-4"><div className="flex items-center"><Clock className="mr-2 h-5 w-5 text-violet-400" /><div><p className="text-sm text-white/70">总复习次数</p><p className="text-2xl font-bold text-violet-400">{stats.totalReviews}</p></div></div></CardContent></Card>
            <Card className="border border-white/10 bg-white/5"><CardContent className="p-4"><div className="flex items-center"><Star className="mr-2 h-5 w-5 text-yellow-400" /><div><p className="text-sm text-white/70">收藏项目</p><p className="text-2xl font-bold text-yellow-400">{stats.starredItems}</p></div></div></CardContent></Card>
          </div>

          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <Input placeholder="搜索记忆项目..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border-white/10 bg-white/5 pl-10 text-white" />
            </div>
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}><SelectTrigger className="w-32 border-white/10 bg-white/5 text-white"><Filter className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger><SelectContent className="border-white/10 bg-black text-white">{["all", "历史", "化学", "语言", "数学", "地理"].map(c => <SelectItem key={c} value={c}>{c === 'all' ? '全部' : c}</SelectItem>)}</SelectContent></Select>
              <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-32 border-white/10 bg-white/5 text-white"><SelectValue /></SelectTrigger><SelectContent className="border-white/10 bg-black text-white"><SelectItem value="recent">下次复习</SelectItem><SelectItem value="mastery">掌握度</SelectItem><SelectItem value="reviews">复习次数</SelectItem><SelectItem value="alphabetical">字母顺序</SelectItem></SelectContent></Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedItems.map((item, index) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                <Card className="border border-white/10 bg-white/5 backdrop-blur-sm hover:border-cyan-400/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1"><CardTitle className="text-lg text-white">{item.title}</CardTitle><div className="mt-2 flex items-center gap-2"><Badge variant="secondary" className={getDifficultyColor(item.difficulty)}>{item.difficulty}</Badge><Badge variant="outline" className="border-white/20 text-white/70">{item.category}</Badge></div></div>
                      <div className="flex items-center gap-1">{item.starred && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent className="border-white/10 bg-black text-white">
                            <DropdownMenuItem onClick={() => handleViewDetails(item)}><Eye className="mr-2 h-4 w-4" />查看详情</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStartReview(item)}><Edit className="mr-2 h-4 w-4" />编辑</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(item)} className="text-red-400"><Trash2 className="mr-2 h-4 w-4" />删除</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-4 text-sm text-white/80 line-clamp-2">{item.content}</p>
                    <div className="mb-4 flex flex-wrap gap-1">{item.tags.map((tag: string) => (<Badge key={tag} variant="outline" className="border-white/20 text-xs text-white/60">{tag}</Badge>))}</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm"><span className="text-white/70">掌握度</span><span className={`font-medium ${getMasteryColor(item.mastery)}`}>{item.mastery}%</span></div>
                      <div className="h-2 w-full rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${item.mastery}%` }} /></div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-white/60">
                      <div className="flex items-center text-sm text-cyan-400"><Calendar className="mr-2 h-3 w-3" />{item.next_review_date ? format(new Date(item.next_review_date), "yyyy-MM-dd HH:mm") : "无计划"}</div>
                      <div className="flex items-center text-sm"><Clock className="mr-1 h-3 w-3" />{getRelativeTimeText(item.next_review_date)}</div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" className="flex-1 bg-cyan-400 text-black hover:bg-cyan-500" onClick={() => handleStartReview(item)}>开始复习</Button>
                      <Button size="sm" variant="outline" className="flex-1 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10" onClick={() => handleViewDetails(item)}>查看详情</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {sortedItems.length === 0 && (
            <div className="py-12 text-center">
              <Brain className="mx-auto mb-4 h-12 w-12 text-white/30" />
              <p className="text-white/70">没有找到匹配的记忆项目</p>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}