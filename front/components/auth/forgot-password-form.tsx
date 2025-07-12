"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { api } from "@/lib/api-config"

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: "请输入邮箱",
        description: "邮箱地址是必填项",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      await api.auth.forgotPassword(email)

      setIsSuccess(true)
      toast({
        title: "重置邮件已发送",
        description: "请检查您的邮箱并按照说明重置密码",
      })
    } catch (error) {
      console.error("Forgot password error:", error)
      toast({
        title: "发送失败",
        description: error instanceof Error ? error.message : "无法发送重置邮件，请稍后再试",
        variant: "destructive",
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
            <CardTitle className="text-2xl font-bold text-white">邮件已发送</CardTitle>
            <CardDescription className="text-white/70">
              我们已向 <span className="font-medium text-cyan-400">{email}</span> 发送了密码重置链接
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/80">
                请检查您的邮箱（包括垃圾邮件文件夹）并点击重置链接。如果您没有收到邮件，请稍后再试。
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              onClick={() => setIsSuccess(false)}
              variant="outline"
              className="w-full border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
            >
              重新发送
            </Button>
            <Link
              href="/auth/login"
              className="flex items-center justify-center text-sm text-white/70 hover:text-cyan-400"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回登录
            </Link>
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
          <CardTitle className="text-2xl font-bold text-center text-white">忘记密码</CardTitle>
          <CardDescription className="text-center text-white/70">输入您的邮箱地址，我们将发送重置链接</CardDescription>
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
                  发送中...
                </>
              ) : (
                "发送重置链接"
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
