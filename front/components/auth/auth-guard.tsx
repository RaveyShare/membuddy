"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { authManager } from "@/lib/auth"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  publicOnly?: boolean // New prop to differentiate public-only pages like login/register
}

export default function AuthGuard({ children, requireAuth = false, publicOnly = false }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(!publicOnly)
  const [authChecked, setAuthChecked] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    
    const checkAuthStatus = () => {
      // 快速检查：如果已经检查过且不需要重新验证，直接返回
      if (authChecked && !requireAuth && !publicOnly) {
        setIsLoading(false)
        return
      }

      const isAuthenticated = authManager.isAuthenticated()

      // Case 1: Page requires authentication, but user is not logged in
      if (requireAuth && !isAuthenticated) {
        const redirectUrl = `/auth/login?redirect=${encodeURIComponent(pathname + searchParams.toString())}`
        router.replace(redirectUrl)
        return
      }

      // Case 2: Page is for public only (e.g., login), but user is already logged in
      if (publicOnly && isAuthenticated) {
        const redirect = searchParams.get("redirect") || "/"
        router.replace(redirect)
        return
      }

      // If neither of the above cases, the user is authorized to see the page
      setAuthChecked(true)
      setIsLoading(false)
    }

    // 使用 setTimeout 来避免阻塞渲染
    const timeoutId = setTimeout(checkAuthStatus, 0)

    // Subscribe to auth changes
    const unsubscribe = authManager.addListener(() => {
      setAuthChecked(false)
      checkAuthStatus()
    })

    // Cleanup subscription on component unmount
    return () => {
      clearTimeout(timeoutId)
      unsubscribe()
    }
  }, [isClient, requireAuth, publicOnly, router, pathname, searchParams, authChecked])

  if (!isClient || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
          <p className="mt-4 text-white/70">验证身份中...</p>
        </div>
      </div>
    )
  }

  // If we are not loading, and the logic in useEffect hasn't redirected,
  // then it's safe to render the children.
  return <>{children}</>
}
