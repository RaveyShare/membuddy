'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, ArrowLeft, Share2, Copy, Mail, MessageCircle, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

interface ShareData {
  id: string
  title: string
  content: any
  share_type: string
  created_at: string
  expires_at?: string
}

export default function SharePage() {
  const params = useParams()
  const router = useRouter()
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const shareId = params.id as string

  useEffect(() => {
    const loadShareData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/share/${shareId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('分享内容不存在')
          } else if (response.status === 410) {
            setError('分享链接已过期')
          } else {
            setError('获取分享内容失败')
          }
          return
        }
        
        const data = await response.json()
        setShareData(data)
      } catch (err) {
        console.error('Error loading share data:', err)
        setError('网络错误，请稍后重试')
      } finally {
        setIsLoading(false)
      }
    }

    loadShareData()
  }, [shareId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 animate-pulse text-cyan-400 mx-auto mb-4" />
          <p>加载分享内容中...</p>
        </div>
      </div>
    )
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error || '分享内容不存在'}</h1>
          <p className="text-white/70 mb-6">该分享链接可能已过期或不存在</p>
          <Link href="/">
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black">
              返回首页
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: '链接已复制',
      description: '分享链接已复制到剪贴板',
      open: true
    })
  }

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`分享：${shareData?.title}`)
    const body = encodeURIComponent(`我想与你分享这个记忆辅助工具：${window.location.href}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const handleShareMessage = () => {
    const text = encodeURIComponent(`我想与你分享这个记忆辅助工具：${window.location.href}`)
    window.open(`sms:?body=${text}`)
  }

  const renderContent = () => {
    if (!shareData) return null

    switch (shareData.share_type) {
      case 'mindmap':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400">思维导图</h3>
            <div className="rounded-lg border border-white/10 bg-black/50 p-4">
              <pre className="text-sm text-white/80 whitespace-pre-wrap">
                {JSON.stringify(shareData.content, null, 2)}
              </pre>
            </div>
          </div>
        )
      case 'mnemonic':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400">记忆口诀</h3>
            <div className="rounded-lg border border-white/10 bg-black/50 p-4">
              <p className="text-white">{shareData.content.content || shareData.content}</p>
            </div>
          </div>
        )
      case 'sensory':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400">感官联想</h3>
            <div className="space-y-3">
              {shareData.content.visual && (
                <div className="rounded-lg border border-white/10 bg-black/50 p-3">
                  <h4 className="text-sm font-medium text-white/70 mb-2">视觉</h4>
                  <p className="text-white">{shareData.content.visual}</p>
                </div>
              )}
              {shareData.content.auditory && (
                <div className="rounded-lg border border-white/10 bg-black/50 p-3">
                  <h4 className="text-sm font-medium text-white/70 mb-2">听觉</h4>
                  <p className="text-white">{shareData.content.auditory}</p>
                </div>
              )}
              {shareData.content.kinesthetic && (
                <div className="rounded-lg border border-white/10 bg-black/50 p-3">
                  <h4 className="text-sm font-medium text-white/70 mb-2">触觉</h4>
                  <p className="text-white">{shareData.content.kinesthetic}</p>
                </div>
              )}
            </div>
          </div>
        )
      default:
        return <p className="text-white/70">不支持的内容类型</p>
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
          <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={handleCopyLink}>
              <Copy className="mr-2 h-4 w-4" />
              复制链接
            </Button>
            <Button variant="ghost" onClick={handleShareEmail}>
              <Mail className="mr-2 h-4 w-4" />
              邮件分享
            </Button>
            <Button variant="ghost" onClick={handleShareMessage}>
              <MessageCircle className="mr-2 h-4 w-4" />
              消息分享
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
            <h1 className="text-3xl font-bold mb-2">分享的记忆辅助工具</h1>
            <p className="text-white/70">来自小杏仁记忆搭子的分享内容</p>
          </div>

          <Card className="border-white/10 bg-black/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Share2 className="h-5 w-5 text-cyan-400" />
                <span>{shareData.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderContent()}
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-sm text-white/50 text-center">
                  想要创建自己的记忆辅助工具？
                  <Link href="/" className="ml-1 text-cyan-400 hover:underline">
                    立即体验小杏仁记忆搭子
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
   )
}