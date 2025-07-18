"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Brain, BarChart, Tag, Loader2, Save, Wand2, BookOpen, Eye, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api-config"
import { useToast } from "@/components/ui/use-toast"
import AuthGuard from "@/components/auth/auth-guard"
import { format } from "date-fns"
import MemoryAidsViewer from "@/components/MemoryAidsViewer"
import type { MemoryItem, ReviewSchedule } from "@/lib/types"

// Reusable component for displaying memory status
const MemoryStatusCard = ({ item }: { item: MemoryItem }) => {
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
  }

  return (
    <Card className="border border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle className="flex items-center text-cyan-400">
          <BarChart className="mr-2 h-5 w-5" />
          当前状态
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">下次复习</span>
          <span className="font-medium text-cyan-400">
            {item.next_review_date ? format(new Date(item.next_review_date), "yyyy-MM-dd HH:mm") : "无计划"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">掌握度</span>
          <span className="font-medium text-green-400">{item.mastery}%</span>
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

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const itemId = params.id as string

  const [item, setItem] = useState<MemoryItem | null>(null)
  const [currentSchedule, setCurrentSchedule] = useState<ReviewSchedule | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [mastery, setMastery] = useState(0)
  const [difficulty, setDifficulty] = useState("medium")
  const [nextReviewDate, setNextReviewDate] = useState<Date>(new Date())
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  
  useEffect(() => {
    if (!itemId) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [fetchedItem, schedules] = await Promise.all([
          api.getMemoryItem(itemId),
          api.getReviewSchedules(itemId)
        ]);

        setItem(fetchedItem)
        // Initialize form with current item state
        setMastery(fetchedItem.mastery)
        setDifficulty(fetchedItem.difficulty)
        setNextReviewDate(fetchedItem.next_review_date ? new Date(fetchedItem.next_review_date) : new Date())
        setCategory(fetchedItem.category)
        setTags(fetchedItem.tags)

        const upcomingSchedules = schedules
          .filter(s => !s.completed)
          .sort((a, b) => new Date(a.review_date).getTime() - new Date(b.review_date).getTime());

        if (upcomingSchedules.length > 0) {
          setCurrentSchedule(upcomingSchedules[0]);
        }
      } catch (error) {
        console.error("Failed to fetch review data:", error)
        toast({ title: "加载失败", variant: "destructive" })
        router.push("/memory-library")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [itemId, router, toast])

  const handleTagAdd = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag.trim()])
      setCurrentTag("")
    }
  }

  const handleTagRemove = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleCompleteReview = async () => {
    if (!item || !currentSchedule) {
        toast({ title: "错误", description: "没有待复习的计划。", variant: "destructive" });
        return;
    }
    setIsSubmitting(true)
    try {
      // First, mark the review as complete
      await api.completeReview(currentSchedule.id, { mastery, difficulty })
      
      // Then, update the item with all the new details
      await api.updateMemoryItem(item.id, {
        next_review_date: nextReviewDate.toISOString(),
        category,
        tags
      })

      toast({ title: "复习完成！", description: `“${item.title}”已更新。` })
      router.push("/memory-library")
    } catch (error) {
      console.error("Failed to complete review:", error)
      toast({ title: "更新失败", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !item) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-black text-white">
        <main className="container mx-auto grid grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-2xl text-cyan-400">{item.title}</CardTitle>
                <p className="mt-4 whitespace-pre-wrap text-base text-white/80">{item.content}</p>
              </CardHeader>
              <CardContent>
                {item.memory_aids ? <MemoryAidsViewer aids={item.memory_aids} onShare={() => {}} /> : <p className="text-center text-white/50">没有AI记忆辅助工具。</p>}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-8">
            <MemoryStatusCard item={item} />

            <Card className="sticky top-8 border border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center text-violet-400">
                  <Wand2 className="mr-2 h-5 w-5" />
                  更新复习状态
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mastery & Difficulty */}
                <div>
                  <Label htmlFor="mastery" className="text-gray-300">本次掌握度: <span className="font-bold text-green-400">{mastery}%</span></Label>
                  <Slider value={[mastery]} onValueChange={(v) => setMastery(v[0])} className="mt-2" />
                </div>
                <div>
                  <Label className="text-gray-300">本次难度评估</Label>
                  <RadioGroup value={difficulty} onValueChange={setDifficulty} className="mt-2 grid grid-cols-3 gap-2">
                    {[
                      {value: "easy", label: "简单", color: "green"},
                      {value: "medium", label: "中等", color: "yellow"},
                      {value: "hard", label: "困难", color: "red"}
                    ].map(({value, label, color}) => {
                      const isSelected = difficulty === value;
                      const colorClasses = {
                        green: 'border-green-500 bg-green-500/20 text-green-300',
                        yellow: 'border-yellow-500 bg-yellow-500/20 text-yellow-300',
                        red: 'border-red-500 bg-red-500/20 text-red-300',
                      };
                      return (
                        <Label key={value} htmlFor={value} className={`flex items-center justify-center rounded-md border p-2 cursor-pointer transition-colors ${isSelected ? colorClasses[color] : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'}`}>
                          <RadioGroupItem value={value} id={value} className="sr-only" />
                          <span>{label}</span>
                        </Label>
                      )
                    })}
                  </RadioGroup>
                </div>

                {/* Next Review Date/Time */}
                <div>
                  <Label htmlFor="next-review-date" className="text-gray-300">下次复习时间</Label>
                  <Input
                    id="next-review-date"
                    type="datetime-local"
                    value={format(nextReviewDate, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => setNextReviewDate(new Date(e.target.value))}
                    className="mt-2 block w-full rounded-md border-gray-600 bg-gray-800/50 text-gray-200 focus:border-cyan-400 focus:ring-cyan-400 dark:[color-scheme:dark]"
                  />
                </div>

                {/* Category */}
                <div>
                  <Label htmlFor="category" className="text-gray-300">分类</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-2 w-full rounded-md border-gray-600 bg-gray-800/50 text-gray-200 focus:border-cyan-400 focus:ring-cyan-400">
                      <SelectValue placeholder="选择分类..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-600 text-gray-200">
                      {["历史", "化学", "语言", "数学", "地理", "其他"].map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div>
                  <Label htmlFor="tags" className="text-gray-300">标签</Label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      id="tags"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTagAdd()}
                      placeholder="添加新标签..."
                      className="block w-full rounded-md border-gray-600 bg-gray-800/50 text-gray-200 focus:border-cyan-400 focus:ring-cyan-400"
                    />
                    <Button onClick={handleTagAdd} variant="outline" className="border-gray-600 bg-gray-800/50 hover:bg-gray-700/50">添加</Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1 bg-gray-700 text-gray-200">
                        {tag}
                        <button onClick={() => handleTagRemove(tag)} className="rounded-full p-0.5 hover:bg-red-500/80">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleCompleteReview}
                  disabled={isSubmitting || !currentSchedule}
                  className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 text-black font-bold"
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  完成并保存
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
