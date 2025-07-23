import { Brain } from "lucide-react"
import Link from "next/link"
import LoginForm from "@/components/auth/login-form"
import AuthGuard from "@/components/auth/auth-guard"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <AuthGuard publicOnly={true}>
      <div className="min-h-screen bg-black text-white">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-1/4 top-1/4 h-96 w-96 rounded-full bg-cyan-500/30 blur-3xl" />
          <div className="absolute -right-1/4 top-1/2 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
          {/* Logo */}
          <Link className="mb-8 flex items-center space-x-2 font-bold" href="/">
            <Brain className="h-8 w-8 text-cyan-400" />
            <span className="text-xl">小杏仁记忆搭子</span>
          </Link>

          {/* Login Form */}
          <LoginForm />
        </div>
      </div>
    </AuthGuard>
  )
}
