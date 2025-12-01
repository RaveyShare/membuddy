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
  const [wxacodeBase64, setWxacodeBase64] = useState<string>("")
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 检测是否在微信环境中（客户端环境）
  useEffect(() => {
    setIsClient(true)
    const userAgent = navigator.userAgent.toLowerCase()
    const isWechat = userAgent.includes('micromessenger')
    setIsWechatEnv(isWechat)
    
    // 添加postMessage事件监听，处理微信授权回调
    const handleMessage = (event: MessageEvent) => {
      // 验证消息来源
      if (event.origin !== window.location.origin) {
        return
      }
      
      if (event.data.type === 'WECHAT_LOGIN_SUCCESS') {
        const { user, token } = event.data
        
        // 存储用户信息和token
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        // 关闭二维码对话框
        setShowQrCode(false)
        
        // 显示成功提示
        toast({
          title: "登录成功",
          description: `欢迎回来，${user.username || user.email}！`,
        })
        
        // 刷新页面或跳转
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else if (event.data.type === 'WECHAT_LOGIN_ERROR') {
        // 关闭二维码对话框
        setShowQrCode(false)
        
        // 显示错误提示
        toast({
          title: "登录失败",
          description: event.data.message || "微信登录失败，请重试",
          variant: "destructive",
        })
      }
    }
    
    window.addEventListener('message', handleMessage)
    
    return () => {
      window.removeEventListener('message', handleMessage)
    }
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

  // 微信扫码登录（网页端）
  const handleWechatLogin = async () => {
    if (isWechatLoading) return

    try {
      setIsWechatLoading(true)
      const { qrcodeId } = await api.frontAuth.generateQr('wxe6d828ae0245ab9c')
      const cacheKey = `wxacode_${qrcodeId}`
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        setWxacodeBase64(cached)
      } else {
        const env = process.env.NEXT_PUBLIC_WXA_ENV || 'develop'
        const wxacode = await api.frontAuth.generateWxacode('wxe6d828ae0245ab9c', qrcodeId, 'pages/auth/login/login', 430, env)
        setWxacodeBase64(wxacode.imageBase64)
        sessionStorage.setItem(cacheKey, wxacode.imageBase64)
      }
      setShowQrCode(true)
      // 轮询二维码状态
      const interval = setInterval(async () => {
        try {
          const res = await api.frontAuth.checkQr(qrcodeId)
          if (res.status === 2 && res.token) {
            if (pollingInterval) { clearInterval(pollingInterval); setPollingInterval(null) }
            setShowQrCode(false)
            // 构造用户对象并写入 authManager
            const user = {
              id: String(res.userInfo?.id || ''),
              email: '',
              name: res.userInfo?.nickname || '用户',
              avatar: res.userInfo?.avatarUrl,
              createdAt: new Date().toISOString(),
            }
            const authData = { user, token: res.token, refreshToken: '' }
            const { authManager } = await import('@/lib/auth')
            authManager.setAuth(authData)
            toast({ title: '登录成功', description: '已通过微信扫码登录' })
            const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/'
            router.push(redirectTo)
        } else if (res.status === 3) {
            if (pollingInterval) { clearInterval(pollingInterval); setPollingInterval(null) }
            toast({ title: '二维码已过期', description: '正在重新生成...', variant: 'destructive' })
            setIsWechatLoading(false)
            setTimeout(() => { handleWechatLogin() }, 0)
          }
        } catch (err) {
          console.error('轮询失败', err)
        }
      }, 1500)
      setPollingInterval(interval)
    } catch (error) {
      console.error('WeChat login error:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      toast({
        title: "微信登录失败",
        description: `错误详情: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsWechatLoading(false)
    }
  }

  const startedRef = useRef(false)
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    handleWechatLogin()
  }, [])

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
            
            {/* 分隔线 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-white/50">或</span>
              </div>
            </div>
            
            {isClient && (
              <div className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 px-4 py-3 rounded-md">
                <div className="flex items-center mb-3">
                  <QrCode className="mr-2 h-4 w-4" />
                  <span>使用微信扫码即可登录</span>
                  {isWechatLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                </div>
                <div className="flex flex-col items-center space-y-2">
                  {wxacodeBase64 ? (
                    <div className="rounded-lg" style={{ backgroundColor: '#ffffff', padding: 12 }}>
                      <img
                        src={`data:image/png;base64,${wxacodeBase64}`}
                        alt="微信小程序码"
                        style={{ width: 420, height: 'auto', display: 'block' }}
                      />
                    </div>
                  ) : (
                    <span className="text-white/60 text-sm">正在生成小程序码...</span>
                  )}
                  <span className="text-white/70 text-xs">请用微信扫描上方小程序码完成登录</span>
                </div>
              </div>
            )}
            <div className="text-center text-sm text-white/70">
              还没有账户？{" "}
              <Link href="/auth/register" className="text-cyan-400 hover:text-cyan-300 hover:underline">
                立即注册
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
      
      
    </motion.div>
  )
}
