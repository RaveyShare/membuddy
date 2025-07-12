"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Brain, Download, Share2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import MindMap from "@/components/mind-map"
import MemoryMnemonic from "@/components/memory-mnemonic"
import SensoryAssociation from "@/components/sensory-association"
import ShareDialog from "@/components/share-dialog"
import { api } from "@/lib/api-config"
import { useToast } from "@/components/ui/use-toast"
import AuthGuard from "@/components/auth/auth-guard"

// Default data for offline mode or when API fails
const defaultMindMapData = {
  id: "root",
  label: "中国历史朝代",
  children: [
    {
      id: "ancient",
      label: "上古时期",
      children: [
        { id: "xia", label: "夏朝" },
        { id: "shang", label: "商朝" },
        { id: "zhou", label: "周朝" },
      ],
    },
    {
      id: "imperial",
      label: "帝国时期",
      children: [
        { id: "qin", label: "秦朝" },
        { id: "han", label: "汉朝" },
        { id: "three-kingdoms", label: "三国" },
        { id: "jin", label: "晋朝" },
        { id: "southern-northern", label: "南北朝" },
      ],
    },
    {
      id: "middle",
      label: "中古时期",
      children: [
        { id: "sui", label: "隋朝" },
        { id: "tang", label: "唐朝" },
        { id: "five-dynasties", label: "五代十国" },
        { id: "song", label: "宋朝" },
      ],
    },
    {
      id: "late",
      label: "近代",
      children: [
        { id: "yuan", label: "元朝" },
        { id: "ming", label: "明朝" },
        { id: "qing", label: "清朝" },
      ],
    },
  ],
}

const defaultMnemonics = [
  {
    id: "rhyme",
    title: "朝代顺序歌诀",
    content:
      "夏商与西周，东周分两段。\n春秋和战国，一统秦两汉。\n三分魏蜀吴，两晋前后延。\n南北朝并立，隋唐五代传。\n宋元明清后，皇朝至此完。",
    type: "rhyme",
  },
  {
    id: "acronym",
    title: "首字记忆法",
    content: "夏商周秦汉三晋南隋唐五宋元明清",
    type: "acronym",
    explanation: "取每个朝代的第一个字，形成一个顺序字符串，便于记忆顺序。",
  },
  {
    id: "story",
    title: "故事联想法",
    content:
      "想象一个夏天(夏朝)，商人(商朝)在周末(周朝)秦始皇(秦朝)和汉武帝(汉朝)带领三个国家(三国)进入晋升(晋朝)的南北方(南北朝)。随后(隋朝)唐僧(唐朝)经过五个朝代(五代十国)送给(宋朝)元宵节(元朝)明天(明朝)请客(清朝)。",
    type: "story",
  },
]

const defaultSensoryAssociations = [
  {
    id: "visual",
    title: "视觉联想记忆",
    type: "visual",
    content: [
      { dynasty: "夏朝", image: "🌞", color: "#fbbf24", association: "夏天的金色阳光，代表中华文明的开端" },
      { dynasty: "商朝", image: "🏪", color: "#8b5cf6", association: "商店商铺，象征商业贸易的兴起" },
      { dynasty: "周朝", image: "🔄", color: "#06b6d4", association: "周而复始的蓝色圆环，代表周朝的长久统治" },
      { dynasty: "秦朝", image: "🏯", color: "#ef4444", association: "红色的宫殿，象征秦始皇的威严统一" },
      { dynasty: "汉朝", image: "🌌", color: "#10b981", association: "绿色的银河，代表汉朝的繁荣昌盛" },
      { dynasty: "三国", image: "⚔️", color: "#f59e0b", association: "金色的剑，象征三国鼎立的战争年代" },
    ],
  },
  {
    id: "auditory",
    title: "听觉联想记忆",
    type: "auditory",
    content: [
      { dynasty: "夏朝", sound: "夏日蝉鸣声", rhythm: "嗡嗡嗡的持续音" },
      { dynasty: "商朝", sound: "商贩叫卖声", rhythm: "高低起伏的节奏" },
      { dynasty: "周朝", sound: "钟声悠扬", rhythm: "庄重的钟鸣节拍" },
      { dynasty: "秦朝", sound: "军队行进声", rhythm: "整齐划一的步伐" },
      { dynasty: "汉朝", sound: "丝绸之路驼铃", rhythm: "叮当叮当的清脆声" },
      { dynasty: "三国", sound: "战鼓擂动", rhythm: "激昂的鼓点节奏" },
    ],
  },
  {
    id: "tactile",
    title: "触觉联想记忆",
    type: "tactile",
    content: [
      { dynasty: "夏朝", texture: "温暖的阳光", feeling: "手心感受夏日的温热" },
      { dynasty: "商朝", texture: "光滑的青铜", feeling: "触摸商朝青铜器的冰凉质感" },
      { dynasty: "周朝", texture: "粗糙的城墙", feeling: "抚摸周朝古城墙的厚重感" },
      { dynasty: "秦朝", texture: "坚硬的石砖", feeling: "感受长城石砖的坚固冰冷" },
      { dynasty: "汉朝", texture: "柔软的丝绸", feeling: "丝绸之路丝绸的顺滑触感" },
      { dynasty: "三国", texture: "锋利的刀剑", feeling: "战争兵器的锐利冰冷" },
    ],
  },
]

export default function MemoryAidsPage() {
  const [content, setContent] = useState("")
  const [shareType, setShareType] = useState<string | null>(null)
  const [shareContent, setShareContent] = useState<any>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [generatedMindMap, setGeneratedMindMap] = useState(defaultMindMapData)
  const [generatedMnemonics, setGeneratedMnemonics] = useState(defaultMnemonics)
  const [sensoryAssociations, setSensoryAssociations] = useState(defaultSensoryAssociations)
  const { toast } = useToast()

  useEffect(() => {
    // Get content from localStorage (set in the home page)
    const savedContent =
      localStorage.getItem("memoryContent") ||
      "中国历史朝代顺序：夏、商、周、秦、汉、三国、晋、南北朝、隋、唐、五代十国、宋、元、明、清"
    setContent(savedContent)

    // Try to get generated data from localStorage
    const savedData = localStorage.getItem("memoryAidsData")

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)

        // Update state with saved data
        if (parsedData.mindMap) setGeneratedMindMap(parsedData.mindMap)
        if (parsedData.mnemonics) setGeneratedMnemonics(parsedData.mnemonics)
        if (parsedData.sensoryAssociations) setSensoryAssociations(parsedData.sensoryAssociations)

        setIsLoading(false)
      } catch (error) {
        console.error("Error parsing saved data:", error)
        // If parsing fails, generate new data
        generateNewData(savedContent)
      }
    } else {
      // If no saved data, generate it now
      generateNewData(savedContent)
    }
  }, [toast])

  const generateNewData = async (content: string) => {
    try {
      setIsLoading(true)
      const response = await api.generateMemoryAids(content)

      // Update state with API response
      if (response.mindMap) setGeneratedMindMap(response.mindMap)
      if (response.mnemonics) setGeneratedMnemonics(response.mnemonics)
      if (response.sensoryAssociations) setSensoryAssociations(response.sensoryAssociations)

      // Save to localStorage for future use
      localStorage.setItem("memoryAidsData", JSON.stringify(response))

      toast({
        title: "生成成功",
        description: "AI 记忆辅助工具已生成完成",
      })
    } catch (error) {
      console.error("Failed to generate memory aids:", error)
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "使用默认数据展示",
        variant: "destructive",
      })

      // Use default data on error
      setGeneratedMindMap(defaultMindMapData)
      setGeneratedMnemonics(defaultMnemonics)
      setSensoryAssociations(defaultSensoryAssociations)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = (type: string, content: any) => {
    setShareType(type)
    setShareContent(content)
    setShareDialogOpen(true)
  }

  const handleSaveToLibrary = async () => {
    try {
      // Prepare the memory item data
      const memoryItem = {
        content: content,
        memory_aids: {
          mindMap: generatedMindMap,
          mnemonics: generatedMnemonics,
          sensoryAssociations: sensoryAssociations,
        },
      }

      // Call the API to save the memory item
      await api.saveMemoryItem(memoryItem)

      toast({
        title: "保存成功",
        description: "记忆项目已保存到记忆库",
      })
    } catch (error) {
      console.error("Failed to save to library:", error)
      toast({
        title: "保存失败",
        description: "无法保存到记忆库，请稍后再试",
        variant: "destructive",
      })
    }
  }

  const handleRegenerate = async () => {
    try {
      setIsLoading(true)

      // Clear existing data from localStorage
      localStorage.removeItem("memoryAidsData")

      // Call the API to regenerate memory aids
      const response = await api.generateMemoryAids(content)

      // Update state with API response
      if (response.mindMap) setGeneratedMindMap(response.mindMap)
      if (response.mnemonics) setGeneratedMnemonics(response.mnemonics)
      if (response.sensoryAssociations) setSensoryAssociations(response.sensoryAssociations)

      // Save to localStorage for future use
      localStorage.setItem("memoryAidsData", JSON.stringify(response))

      toast({
        title: "重新生成成功",
        description: "记忆辅助工具已更新",
      })
    } catch (error) {
      console.error("Failed to regenerate memory aids:", error)
      toast({
        title: "重新生成失败",
        description: "无法重新生成记忆辅助工具，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
        <main className="container mx-auto px-4 pt-24">
          <div className="mb-8 flex items-center">
            <Link href="/" className="mr-4 rounded-full p-2 hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold">记忆辅助工具</h1>
          </div>

          {/* Original Content */}
          <Card className="mb-8 border border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <h2 className="mb-2 text-lg font-medium text-cyan-400">原始内容</h2>
              <p className="text-white">{content}</p>
            </CardContent>
          </Card>

          {/* Generated Memory Aids */}
          <Tabs defaultValue="mindmap" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-3 bg-white/5">
              <TabsTrigger value="mindmap" className="data-[state=active]:bg-cyan-400 data-[state=active]:text-black">
                思维导图
              </TabsTrigger>
              <TabsTrigger
                value="mnemonics"
                className="data-[state=active]:bg-violet-400 data-[state=active]:text-black"
              >
                记忆口诀
              </TabsTrigger>
              <TabsTrigger value="sensory" className="data-[state=active]:bg-pink-400 data-[state=active]:text-black">
                感官联想
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mindmap" className="mt-0">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="border border-white/10 bg-white/5 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-medium text-cyan-400">思维导图</h2>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 bg-transparent"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          保存
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-violet-400 text-violet-400 hover:bg-violet-400/10 bg-transparent"
                          onClick={() =>
                            handleShare("mindmap", { title: "思维导图", data: generatedMindMap })
                          }
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          分享
                        </Button>
                      </div>
                    </div>
                    <div className="h-[500px] w-full overflow-hidden rounded-lg border border-white/10 bg-black/50 p-4">
                      <MindMap data={generatedMindMap} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="mnemonics" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {generatedMnemonics.map((mnemonic) => (
                  <MemoryMnemonic
                    key={mnemonic.id}
                    mnemonic={mnemonic}
                    onShare={() => handleShare("mnemonic", mnemonic)}
                  />
                ))}
              </motion.div>
            </TabsContent>

            <TabsContent value="sensory" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {sensoryAssociations.map((association) => (
                  <SensoryAssociation
                    key={association.id}
                    association={association}
                    onShare={() => handleShare("sensory", association)}
                  />
                ))}
              </motion.div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center space-x-4">
            <Button
              className="bg-gradient-to-r from-cyan-400 to-violet-500 text-black hover:from-cyan-500 hover:to-violet-600"
              onClick={handleSaveToLibrary}
              disabled={isLoading}
            >
              保存到记忆库
            </Button>
            <Button
              variant="outline"
              className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 bg-transparent"
              onClick={handleRegenerate}
              disabled={isLoading}
            >
              重新生成
            </Button>
          </div>
        </main>

        {/* Share Dialog */}
        <ShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} type={shareType} content={shareContent} />
      </div>
    </AuthGuard>
  )
}
