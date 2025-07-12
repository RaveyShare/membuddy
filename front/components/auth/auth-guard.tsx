"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { authManager } from "@/lib/auth"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function AuthGuard({ children, requireAuth = true, redirectTo = "/auth/login" }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      try {
        const authenticated = authManager.isAuthenticated()
        console.log("Auth check result:", authenticated) // Debug log
        setIsAuthenticated(authenticated)

        if (requireAuth && !authenticated) {
          // Store the current path for redirect after login
          const currentPath = window.location.pathname + window.location.search
          const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
          console.log("Redirecting to login:", redirectUrl) // Debug log
          router.push(redirectUrl)
          return
        }

        if (!requireAuth && authenticated) {
          // If user is authenticated but this is a public-only page (like login/register)
          const redirect = new URLSearchParams(window.location.search).get("redirect") || "/"
          console.log("Redirecting authenticated user to:", redirect) // Debug log
          router.push(redirect)
          return
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Auth check error:", error)
        setIsLoading(false)
      }
    }

    // Initial check
    checkAuth()

    // Set up a listener for auth state changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_token" || e.key === "user_data") {
        console.log("Auth state changed, rechecking...") // Debug log
        checkAuth()
      }
    }

    // Listen for storage changes (when auth state changes)
    window.addEventListener("storage", handleStorageChange)

    // Also check periodically in case of same-tab changes
    const interval = setInterval(() => {
      const currentAuth = authManager.isAuthenticated()
      if (currentAuth !== isAuthenticated) {
        console.log("Auth state changed (periodic check):", currentAuth) // Debug log
        checkAuth()
      }
    }, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [requireAuth, redirectTo, router, isAuthenticated])

  // Show loading only for a maximum of 3 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log("Auth check timeout, proceeding...") // Debug log
        setIsLoading(false)
      }
    }, 3000)

    return () => clearTimeout(timeout)
  }, [isLoading])

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

  if (requireAuth && !isAuthenticated) {
    return null // Will redirect in useEffect
  }

  if (!requireAuth && isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return <>{children}</>
}
