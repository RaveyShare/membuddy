"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Copy, Link, QrCode, Mail, MessageSquare, Share, Eye, Volume2, Hand } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { QRCodeSVG } from "qrcode.react"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: string | null
  content: any
}

export default function ShareDialog({ open, onOpenChange, type, content }: ShareDialogProps) {
  const [activeTab, setActiveTab] = useState("link")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const { toast } = useToast()

  if (!content) return null

  const getTitle = () => {
    if (!type || !content) return "分享内容"

    switch (type) {
      case "mindmap":
        return `分享思维导图: ${content.title}`
      case "mnemonic":
        return `分享记忆口诀: ${content.title}`
      case "sensory":
        return `分享感官联想: ${content.title}`
      default:
        return "分享内容"
    }
  }

  const getShareUrl = () => {
    // In a real app, this would generate a unique URL for sharing
    const baseUrl = window.location.origin
    const contentId = content.id || "demo"
    return `${baseUrl}/share/${type}/${contentId}`
  }

  const shareUrl = getShareUrl()

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "链接已复制",
      description: "分享链接已复制到剪贴板",
    })
  }

  const handleSendEmail = () => {
    // In a real app, this would send an email
    toast({
      title: "邮件已发送",
      description: `分享链接已发送至 ${email}`,
    })
    setEmail("")
  }

  const handleSendMessage = () => {
    // In a real app, this would send a message
    toast({
      title: "消息已发送",
      description: "分享链接已通过消息发送",
    })
    setMessage("")
  }

  const renderPreview = () => {
    if (!type || !content) return null

    switch (type) {
      case "mindmap":
        return (
          <div className="mb-4 rounded-lg border border-white/10 bg-black/50 p-4">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-cyan-400/20 flex items-center justify-center">
                <Share className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">{content.title}</h3>
                <p className="text-sm text-white/70">思维导图 • 中国历史朝代</p>
              </div>
            </div>
          </div>
        )
      case "mnemonic":
        return (
          <div className="mb-4 rounded-lg border border-white/10 bg-black/50 p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-10 w-10 rounded-full bg-violet-400/20 flex items-center justify-center">
                <span className="text-xl">
                  {content.type === "rhyme" ? "🎵" : content.type === "acronym" ? "🔤" : "📖"}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-white">{content.title}</h3>
                <p className="text-sm text-white/70">
                  记忆口诀 •{" "}
                  {content.type === "rhyme" ? "顺口溜" : content.type === "acronym" ? "首字记忆" : "故事联想"}
                </p>
              </div>
            </div>
            <div className="whitespace-pre-line rounded-lg border border-white/10 bg-black/70 p-3 text-sm text-white">
              {content.content.length > 100 ? content.content.substring(0, 100) + "..." : content.content}
            </div>
          </div>
        )
      case "sensory":
        return (
          <div className="mb-4 rounded-lg border border-white/10 bg-black/50 p-4">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-pink-400/20 flex items-center justify-center">
                {content.type === "visual" ? (
                  <Eye className="h-5 w-5 text-pink-400" />
                ) : content.type === "auditory" ? (
                  <Volume2 className="h-5 w-5 text-green-400" />
                ) : (
                  <Hand className="h-5 w-5 text-orange-400" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-white">{content.title}</h3>
                <p className="text-sm text-white/70">
                  感官联想 • {content.type === "visual" ? "视觉" : content.type === "auditory" ? "听觉" : "触觉"}
                </p>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-black text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        {renderPreview()}

        <Tabs defaultValue="link" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/5">
            <TabsTrigger value="link" className="data-[state=active]:bg-cyan-400 data-[state=active]:text-black">
              <Link className="mr-2 h-4 w-4" />
              链接
            </TabsTrigger>
            <TabsTrigger value="qrcode" className="data-[state=active]:bg-violet-400 data-[state=active]:text-black">
              <QrCode className="mr-2 h-4 w-4" />
              二维码
            </TabsTrigger>
            <TabsTrigger value="message" className="data-[state=active]:bg-pink-400 data-[state=active]:text-black">
              <MessageSquare className="mr-2 h-4 w-4" />
              消息
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="mt-4">
            <div className="flex items-center space-x-2">
              <Input value={shareUrl} readOnly className="border-white/10 bg-white/5 text-white" />
              <Button
                variant="outline"
                size="icon"
                className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="qrcode" className="mt-4">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-lg bg-white p-4">
                <QRCodeSVG value={shareUrl} size={200} />
              </div>
              <p className="text-sm text-white/70">扫描二维码分享内容</p>
            </div>
          </TabsContent>

          <TabsContent value="message" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">通过邮件分享</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="email"
                  placeholder="输入邮箱地址"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-white/10 bg-white/5 text-white"
                />
                <Button
                  variant="outline"
                  className="border-violet-400 text-violet-400 hover:bg-violet-400/10"
                  onClick={handleSendEmail}
                  disabled={!email}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  发送
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">通过消息分享</Label>
              <Textarea
                id="message"
                placeholder="添加消息内容（可选）"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="border-white/10 bg-white/5 text-white"
              />
              <Button
                className="w-full bg-gradient-to-r from-cyan-400 to-violet-500 text-black hover:from-cyan-500 hover:to-violet-600"
                onClick={handleSendMessage}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                发送消息
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="sm:justify-start">
          <div className="flex w-full items-center justify-between">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 text-white hover:bg-white/10"
                onClick={() => onOpenChange(false)}
              >
                关闭
              </Button>
            </div>
            <p className="text-xs text-white/50">分享内容将在30天后过期</p>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
