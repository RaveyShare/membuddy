"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, X, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockAuthService } from "@/lib/mock-auth"
import { api } from "@/lib/api-config"
import { useToast } from "@/components/ui/use-toast"

interface DemoLoginBannerProps {
  onLogin?: () => void
}

export default function DemoLoginBanner({ onLogin }: DemoLoginBannerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const demoCredentials = mockAuthService.getDemoCredentials()
  const mockUsers = mockAuthService.getMockUsers()

  const handleDemoLogin = async () => {
    try {
      setIsLoading(true)

      await api.auth.login({
        email: demoCredentials.email,
        password: demoCredentials.password,
      })

      toast({
        title: "演示登录成功",
        description: `欢迎回来，${demoCredentials.name}！`,
      })

      setIsVisible(false)
      onLogin?.()
    } catch (error) {
      console.error("Demo login error:", error)
      toast({
        title: "登录失败",
        description: error instanceof Error ? error.message : "演示登录失败",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <Card className="border border-cyan-400/30 bg-gradient-to-r from-cyan-400/10 to-violet-400/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-3 flex items-center">
                  <User className="mr-2 h-5 w-5 text-cyan-400" />
                  <h3 className="font-medium text-white">演示账户</h3>
                  <Badge variant="outline" className="ml-2 border-cyan-400/50 text-cyan-400">
                    Demo
                  </Badge>
                </div>

                <div className="mb-4 space-y-2">
                  <p className="text-sm text-white/80">快速体验小杏仁记忆搭子的功能，使用演示账户登录：</p>
                  <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                      <div>
                        <span className="text-white/60">邮箱：</span>
                        <span className="font-mono text-cyan-400">{demoCredentials.email}</span>
                      </div>
                      <div>
                        <span className="text-white/60">密码：</span>
                        <span className="font-mono text-cyan-400">{demoCredentials.password}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="mb-2 text-xs text-white/60">可用的演示用户：</p>
                  <div className="flex flex-wrap gap-2">
                    {mockUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1"
                      >
                        <img
                          src={user.avatar || "/placeholder.svg"}
                          alt={user.name}
                          className="mr-2 h-4 w-4 rounded-full"
                        />
                        <span className="text-xs text-white/80">{user.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-cyan-400 to-violet-500 text-black hover:from-cyan-500 hover:to-violet-600"
                  size="sm"
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                      登录中...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      一键演示登录
                    </>
                  )}
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsVisible(false)}
                className="h-8 w-8 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
