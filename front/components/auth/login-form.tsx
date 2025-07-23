"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { api } from "@/lib/api-config"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

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
      })

      await api.auth.login({ email, password })

      toast({
        title: "登录成功",
        description: "欢迎回来！正在跳转...",
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
      })
      
      // 重置提交状态，允许重新尝试
      setSubmitAttempted(false)
    } finally {
      setIsLoading(false)
    }
  }

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
