"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { api } from "@/lib/api-config"

export default function WechatCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('正在处理微信授权...')

  useEffect(() => {
    const handleWechatCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')

        if (!code || !state) {
          setStatus('error')
          setMessage('授权参数缺失')
          return
        }

        // 调用后端API处理微信登录
        const response = await fetch(`${api.baseURL}/api/auth/wechat/web`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        })

        const data = await response.json()

        if (response.ok) {
          // 登录成功，保存token
          localStorage.setItem('token', data.access_token)
          localStorage.setItem('user', JSON.stringify(data.user))
          
          // 通知父窗口登录成功
          if (window.opener) {
            window.opener.postMessage({ type: 'WECHAT_LOGIN_SUCCESS', data }, '*')
            window.close()
          } else {
            // 如果不是弹窗，直接跳转
            setStatus('success')
            setMessage('登录成功，正在跳转...')
            setTimeout(() => {
              router.push('/')
            }, 1000)
          }
        } else {
          setStatus('error')
          setMessage(data.detail || '登录失败')
        }
      } catch (error) {
        console.error('WeChat callback error:', error)
        setStatus('error')
        setMessage('网络错误，请重试')
      }
    }

    handleWechatCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
            <p className="text-white">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="h-8 w-8 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="h-8 w-8 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-white">{message}</p>
            <button 
              onClick={() => window.close()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              关闭窗口
            </button>
          </>
        )}
      </div>
    </div>
  )
}