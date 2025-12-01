"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, User, Loader2, QrCode, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { api } from "@/lib/api-config"
import QRCode from "qrcode"

export default function RegisterForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isWechatLoading, setIsWechatLoading] = useState(false)
  const [isWechatEnv, setIsWechatEnv] = useState(false)
  const [showQrCode, setShowQrCode] = useState(false)
  const [wxacodeBase64, setWxacodeBase64] = useState<string>("")
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isWechat = userAgent.includes('micromessenger')
    setIsWechatEnv(isWechat)
  }, [])

  useEffect(() => {
    if (!isWechatEnv && !showQrCode && !isWechatLoading) {
      handleWechatLogin()
    }
  }, [isWechatEnv])

  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword) {
      toast({
        title: "请填写所有字段",
        description: "所有字段都是必填项",
        variant: "destructive",
      })
      return false
    }

    if (password !== confirmPassword) {
      toast({
        title: "密码不匹配",
        description: "请确保两次输入的密码相同",
        variant: "destructive",
      })
      return false
    }

    if (password.length < 8) {
      toast({
        title: "密码太短",
        description: "密码至少需要8个字符",
        variant: "destructive",
      })
      return false
    }

    if (!acceptTerms) {
      toast({
        title: "请接受服务条款",
        description: "您需要接受服务条款才能注册",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setIsLoading(true)

      await api.auth.register({ name, email, password })

      toast({
        title: "注册成功",
        description: "欢迎加入小杏仁记忆搭子！",
      })

      // Redirect to home page
      router.push("/")
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "注册失败",
        description: error instanceof Error ? error.message : "注册过程中出现错误，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateQrCode = async (url: string) => {
    try {
      const canvas = canvasRef.current
      if (canvas) {
        await QRCode.toCanvas(canvas, url, { width: 200, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } })
      }
    } catch (error) {}
  }

  const handleWechatLogin = async () => {
    if (isWechatLoading) return

    try {
      setIsWechatLoading(true)
      const { qrcodeId, qrContent } = await api.frontAuth.generateQr('wxe6d828ae0245ab9c')
      await generateQrCode(qrContent)
      const wxacode = await api.frontAuth.generateWxacode('wxe6d828ae0245ab9c', qrcodeId)
      setWxacodeBase64(wxacode.imageBase64)
      setShowQrCode(true)
      const interval = setInterval(async () => {
        try {
          const res = await api.frontAuth.checkQr(qrcodeId)
          if (res.status === 2 && res.token) {
            if (pollingInterval) { clearInterval(pollingInterval); setPollingInterval(null) }
            setShowQrCode(false)
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
            toast({ title: '二维码已过期', description: '请重新生成', variant: 'destructive' })
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
        title: '微信登录失败',
        description: `错误详情: ${errorMessage}`,
        variant: 'destructive',
      })
    } finally {
      setIsWechatLoading(false)
    }
  }

  const handleCloseQrCode = () => {
    setShowQrCode(false)
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
  }

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
          <CardTitle className="text-2xl font-bold text-center text-white">注册</CardTitle>
          <CardDescription className="text-center text-white/70">创建您的账户开始记忆之旅</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                姓名
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <Input
                  id="name"
                  type="text"
                  placeholder="输入您的姓名"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-white/10 bg-white/5 pl-10 text-white placeholder-white/50"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
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
              <p className="text-xs text-white/50">密码至少需要8个字符</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">
                确认密码
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="再次输入您的密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-white/10 bg-white/5 pl-10 pr-10 text-white placeholder-white/50"
                  disabled={isLoading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-white/50 hover:bg-transparent hover:text-white"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                className="border-white/20 data-[state=checked]:bg-cyan-400 data-[state=checked]:text-black"
                disabled={isLoading}
              />
              <Label htmlFor="terms" className="text-sm text-white/70">
                我同意{" "}
                <Link href="/terms" className="text-cyan-400 hover:text-cyan-300 hover:underline">
                  服务条款
                </Link>{" "}
                和{" "}
                <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300 hover:underline">
                  隐私政策
                </Link>
              </Label>
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
                  注册中...
                </>
              ) : (
                "注册"
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
              已有账户？{" "}
              <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300 hover:underline">
                立即登录
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
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
              {wxacodeBase64 ? (
                <img src={`data:image/png;base64,${wxacodeBase64}`} alt="微信小程序码" className="w-52 h-52" />
              ) : (
                <canvas ref={canvasRef} />
              )}
            </div>
            <div className="text-center space-y-2">
              <p className="text-white/80 text-sm">请使用微信扫描上方二维码</p>
              <p className="text-white/60 text-xs">扫码后在微信中完成授权登录</p>
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
