"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, Loader2, Smartphone, QrCode, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api-config"
import QRCode from "qrcode"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [isWechatLoading, setIsWechatLoading] = useState(false)
  const [isWechatEnv, setIsWechatEnv] = useState(false)
  const [showQrCode, setShowQrCode] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 检测是否在微信环境中
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isWechat = userAgent.includes('micromessenger')
    setIsWechatEnv(isWechat)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 防止重复提交
    if (isLoading || submitAttempted) {
      return
    }

    if (!email || !password) {
      toast({
        title: "请填写所有字段",
        description: "邮箱和密码都是必填项",
        variant: "destructive",
      })
      return
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: "邮箱格式错误",
        description: "请输入有效的邮箱地址",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setSubmitAttempted(true)

      // 显示登录进度
      toast({
        title: "正在登录...",
        description: "请稍候，正在验证您的身份",
        open: true,
      })

      await api.auth.login({ email, password })

      toast({
        title: "登录成功",
        description: "欢迎回来！正在跳转...",
        open: true,
      })

      // 短暂延迟后跳转，让用户看到成功消息
      setTimeout(() => {
        const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/"
        router.push(redirectTo)
      }, 500)

    } catch (error) {
      console.error("Login error:", error)
      const errorMessage = error instanceof Error ? error.message : "请检查您的邮箱和密码"
      
      toast({
        title: "登录失败",
        description: errorMessage.includes('超时') ? '网络连接超时，请检查网络后重试' : errorMessage,
        variant: "destructive",
        open: true,
      })
      
      // 重置提交状态，允许重新尝试
      setSubmitAttempted(false)
    } finally {
      setIsLoading(false)
    }
  }

  // 生成二维码
  const generateQrCode = async (url: string) => {
    try {
      console.log('开始生成二维码，URL:', url)
      const canvas = canvasRef.current
      if (canvas) {
        console.log('Canvas元素存在，开始生成二维码')
        await QRCode.toCanvas(canvas, url, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        console.log('二维码生成成功')
      } else {
        console.error('Canvas元素不存在')
      }
    } catch (error) {
      console.error('生成二维码失败:', error)
    }
  }

  // 轮询检查登录状态
  const startPolling = (state: string) => {
    const interval = setInterval(async () => {
      try {
        // 检查localStorage中是否有登录成功的标记
        const loginSuccess = localStorage.getItem(`wechat_login_${state}`)
        if (loginSuccess) {
          localStorage.removeItem(`wechat_login_${state}`)
          setShowQrCode(false)
          if (pollingInterval) {
            clearInterval(pollingInterval)
            setPollingInterval(null)
          }
          
          toast({
            title: "登录成功",
            description: "微信扫码登录成功！正在跳转...",
            open: true,
          })
          
          setTimeout(() => {
            const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/"
            router.push(redirectTo)
          }, 1000)
        }
      } catch (error) {
        console.error('轮询检查登录状态失败:', error)
      }
    }, 2000)
    
    setPollingInterval(interval)
    
    // 5分钟后停止轮询
    setTimeout(() => {
      if (interval) {
        clearInterval(interval)
        setPollingInterval(null)
      }
    }, 300000)
  }

  // 微信登录处理函数
  const handleWechatLogin = async () => {
    if (isWechatLoading) return

    try {
      setIsWechatLoading(true)
      
      if (isWechatEnv) {
        // 在微信环境中，引导用户到公众号授权页面
        const appId = process.env.NEXT_PUBLIC_WECHAT_MP_APP_ID
        // 使用固定的生产域名作为回调地址，确保与微信公众号后台配置一致
        const redirectUri = encodeURIComponent('https://membuddy.ravey.site/auth/wechat/callback')
        const state = Math.random().toString(36).substring(2, 15)
        
        // 保存state到localStorage用于验证
        localStorage.setItem('wechat_state', state)
        
        const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`
        
        window.location.href = authUrl
      } else {
        // 在非微信环境中，生成二维码
        const appId = process.env.NEXT_PUBLIC_WECHAT_MP_APP_ID
        // 使用固定的生产域名作为回调地址，确保与微信公众号后台配置一致
        const redirectUri = encodeURIComponent('https://membuddy.ravey.site/auth/wechat/callback')
        const state = Math.random().toString(36).substring(2, 15)
        
        // 保存state到localStorage用于验证
        localStorage.setItem('wechat_state', state)
        
        const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`
        
        setQrCodeUrl(authUrl)
        setShowQrCode(true)
        // 延迟生成二维码，确保对话框已完全渲染
        setTimeout(async () => {
          await generateQrCode(authUrl)
        }, 100)
        startPolling(state)
      }
    } catch (error) {
      console.error('WeChat login error:', error)
      toast({
        title: "微信登录失败",
        description: "无法启动微信登录，请稍后重试",
        variant: "destructive",
        open: true,
      })
    } finally {
      setIsWechatLoading(false)
    }
  }

  // 关闭二维码对话框
  const handleCloseQrCode = () => {
    setShowQrCode(false)
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
  }

  // 组件卸载时清理轮询
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <Card className="border border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-white">登录</CardTitle>
          <CardDescription className="text-center text-white/70">登录您的账户以访问记忆库</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                邮箱
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <Input
                  id="email"
                  type="email"
                  placeholder="输入您的邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-white/10 bg-white/5 pl-10 text-white placeholder-white/50"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                密码
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="输入您的密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-white/10 bg-white/5 pl-10 pr-10 text-white placeholder-white/50"
                  disabled={isLoading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-white/50 hover:bg-transparent hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Link href="/auth/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline">
                忘记密码？
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-400 to-violet-500 text-black hover:from-cyan-500 hover:to-violet-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                "登录"
              )}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-white/50">或</span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={handleWechatLogin}
              disabled={isWechatLoading || isLoading}
            >
              {isWechatLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  连接微信中...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  {isWechatEnv ? "微信登录" : "微信扫码登录"}
                </>
              )}
            </Button>
            <div className="text-center text-sm text-white/70">
              还没有账户？{" "}
              <Link href="/auth/register" className="text-cyan-400 hover:text-cyan-300 hover:underline">
                立即注册
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
      
      {/* 微信扫码登录对话框 */}
      <Dialog open={showQrCode} onOpenChange={handleCloseQrCode}>
        <DialogContent className="sm:max-w-md border border-white/10 bg-white/5 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-white flex items-center justify-between">
              微信扫码登录
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseQrCode}
                className="text-white/50 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 p-4">
            <div className="bg-white p-4 rounded-lg">
              <canvas ref={canvasRef} />
            </div>
            <div className="text-center space-y-2">
              <p className="text-white/80 text-sm">
                请使用微信扫描上方二维码
              </p>
              <p className="text-white/60 text-xs">
                扫码后在微信中完成授权登录
              </p>
            </div>
            <div className="flex items-center space-x-2 text-white/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">等待扫码...</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
