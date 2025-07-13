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
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkAuthStatus = () => {
      const isAuthenticated = authManager.isAuthenticated()
      console.log(`AuthGuard Check: Path=${pathname}, requireAuth=${requireAuth}, publicOnly=${publicOnly}, isAuthenticated=${isAuthenticated}`)

      // Case 1: Page requires authentication, but user is not logged in
      if (requireAuth && !isAuthenticated) {
        console.log("Redirecting to login, user not authenticated.")
        const redirectUrl = `/auth/login?redirect=${encodeURIComponent(pathname + searchParams.toString())}`
        router.replace(redirectUrl)
        return
      }

      // Case 2: Page is for public only (e.g., login), but user is already logged in
      if (publicOnly && isAuthenticated) {
        const redirect = searchParams.get("redirect") || "/"
        console.log(`Redirecting to ${redirect}, user already authenticated.`)
        router.replace(redirect)
        return
      }

      // If neither of the above cases, the user is authorized to see the page
      setIsLoading(false)
    }

    // Initial check
    checkAuthStatus()

    // Subscribe to auth changes
    const unsubscribe = authManager.addListener(checkAuthStatus)

    // Cleanup subscription on component unmount
    return () => {
      console.log("AuthGuard cleanup: unsubscribing from auth changes.")
      unsubscribe()
    }
  }, [requireAuth, publicOnly, router, pathname, searchParams])

  if (isLoading) {
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
