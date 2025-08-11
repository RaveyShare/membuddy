"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Lock, ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { api } from "@/lib/api-config"

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    // 从 URL 参数中获取重置令牌
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const tokenType = searchParams.get('token_type')
    const type = searchParams.get('type')
    
    if (type === 'recovery' && accessToken) {
      setToken(accessToken)
    } else {
      toast({
        title: "无效的重置链接",
        description: "重置链接无效或已过期，请重新申请密码重置。",
        variant: "destructive",
        open: true,
      })
      router.push('/auth/forgot-password')
    }
  }, [searchParams, router, toast])

  const validateForm = () => {
    if (!password || !confirmPassword) {
      toast({
        title: "请填写所有字段",
        description: "密码和确认密码都是必填项",
        variant: "destructive",
        open: true,
      })
      return false
    }

    if (password !== confirmPassword) {
      toast({
        title: "密码不匹配",
        description: "请确保两次输入的密码相同",
        variant: "destructive",
        open: true,
      })
      return false
    }

    if (password.length < 8) {
      toast({
        title: "密码太短",
        description: "密码至少需要8个字符",
        variant: "destructive",
        open: true,
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !token) return

    try {
      setIsLoading(true)

      await api.auth.resetPassword(token, password)

      setIsSuccess(true)
      toast({
        title: "密码重置成功",
        description: "您的密码已成功重置，请使用新密码登录。",
        open: true,
      })

      // 3秒后跳转到登录页面
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)

    } catch (error) {
      console.error("Reset password error:", error)
      toast({
        title: "重置失败",
        description: error instanceof Error ? error.message : "密码重置失败，请稍后再试",
        variant: "destructive",
        open: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">密码重置成功</CardTitle>
            <CardDescription className="text-white/70">
              您的密码已成功重置，即将跳转到登录页面
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/80">
                请使用新密码登录您的账户。如果页面没有自动跳转，请点击下方按钮。
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-gradient-to-r from-cyan-400 to-violet-500 text-black hover:from-cyan-500 hover:to-violet-600"
            >
              前往登录
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    )
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
          <CardTitle className="text-2xl font-bold text-center text-white">重置密码</CardTitle>
          <CardDescription className="text-center text-white/70">请输入您的新密码</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                新密码
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="输入新密码"
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
                确认新密码
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="再次输入新密码"
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
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-400 to-violet-500 text-black hover:from-cyan-500 hover:to-violet-600"
              disabled={isLoading || !token}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  重置中...
                </>
              ) : (
                "重置密码"
              )}
            </Button>
            <Link
              href="/auth/login"
              className="flex items-center justify-center text-sm text-white/70 hover:text-cyan-400"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回登录
            </Link>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}