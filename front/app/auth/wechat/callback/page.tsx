"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { api } from "@/lib/api-config"

// 强制动态渲染，避免预渲染错误
export const dynamic = 'force-dynamic'

function WechatCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const handleWechatCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const storedState = localStorage.getItem('wechat_state')

        if (!code) {
          throw new Error('授权码缺失')
        }

        if (!state || state !== storedState) {
          throw new Error('状态验证失败，可能存在安全风险')
        }

        // 清除存储的state
        localStorage.removeItem('wechat_state')

        // 调用微信公众号登录API
        await api.auth.wechatMpLogin(code, state)

        setStatus('success')
        setMessage('微信登录成功！正在跳转...')

        toast({
          title: "登录成功",
          description: "欢迎使用微信登录！",
          open: true,
        })

        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
          // 设置登录成功标记供轮询检测
          localStorage.setItem(`wechat_login_${state}`, 'success')
          
          const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/'
          router.push(redirectTo)
        }, 1500)

      } catch (error) {
        console.error('WeChat callback error:', error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : '微信登录失败')

        toast({
          title: "登录失败",
          description: error instanceof Error ? error.message : '微信登录失败，请重试',
          variant: "destructive",
          open: true,
        })
      }
    }

    handleWechatCallback()
  }, [searchParams, router, toast])

  const handleRetry = () => {
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-white">
              {status === 'loading' && '正在处理微信登录...'}
              {status === 'success' && '登录成功'}
              {status === 'error' && '登录失败'}
            </CardTitle>
            <CardDescription className="text-white/70">
              {status === 'loading' && '请稍候，正在验证您的微信身份'}
              {status === 'success' && '欢迎回来！即将跳转到主页'}
              {status === 'error' && '微信登录过程中出现了问题'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              {status === 'loading' && (
                <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
              )}
              {status === 'success' && (
                <CheckCircle className="h-12 w-12 text-green-400" />
              )}
              {status === 'error' && (
                <XCircle className="h-12 w-12 text-red-400" />
              )}
              
              <p className="text-center text-white/80">{message}</p>
              
              {status === 'error' && (
                <Button
                  onClick={handleRetry}
                  className="w-full bg-gradient-to-r from-cyan-400 to-violet-500 text-black hover:from-cyan-500 hover:to-violet-600"
                >
                  返回登录页面
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function WechatCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold text-white">
                正在加载...
              </CardTitle>
              <CardDescription className="text-white/70">
                请稍候
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    }>
      <WechatCallbackContent />
    </Suspense>
  )
}