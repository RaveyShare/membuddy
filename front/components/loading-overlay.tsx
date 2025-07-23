"use client"

import { Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  description?: string
}

export default function LoadingOverlay({ 
  isVisible, 
  message = "加载中...", 
  description = "请稍候" 
}: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center space-y-4 rounded-lg bg-white/10 p-8 backdrop-blur-md border border-white/20"
          >
            <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
            <div className="text-center">
              <p className="text-lg font-medium text-white">{message}</p>
              <p className="text-sm text-white/70">{description}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 简化版本的加载指示器
export function SimpleLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
    </div>
  )
}

// 内联加载状态
export function InlineLoader({ 
  message = "加载中...", 
  className = "" 
}: { 
  message?: string
  className?: string 
}) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
      <span className="text-sm text-white/70">{message}</span>
    </div>
  )
}