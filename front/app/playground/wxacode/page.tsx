"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import QRCode from "qrcode"
import { api } from "@/lib/api-config"

export default function WxaCodePlayground() {
  const [loading, setLoading] = useState(false)
  const [qrcodeId, setQrcodeId] = useState("")
  const [expireAt, setExpireAt] = useState<number | null>(null)
  const [wxacodeBase64, setWxacodeBase64] = useState("")
  const [error, setError] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const generate = async () => {
    if (loading) return
    setLoading(true)
    setError("")
    setWxacodeBase64("")
    try {
      const { qrcodeId, expireAt, qrContent } = await api.frontAuth.generateQr("wxe6d828ae0245ab9c")
      setQrcodeId(qrcodeId)
      setExpireAt(expireAt)
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, qrContent, { width: 220, margin: 2 })
      }
      const wxacode = await api.frontAuth.generateWxacode("wxe6d828ae0245ab9c", qrcodeId)
      setWxacodeBase64(wxacode.imageBase64)
    } catch (e: any) {
      setError(e?.message || "生成失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    generate()
  }, [])

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Card className="border border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">小程序码演示</CardTitle>
          <CardDescription className="text-white/70">调用用户中心生成二维码记录并生成小程序码</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={generate} disabled={loading} className="bg-gradient-to-r from-cyan-400 to-violet-500 text-black">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                "重新生成"
              )}
            </Button>
            {expireAt ? (
              <span className="text-xs text-white/60">过期时间: {new Date(expireAt).toLocaleString()}</span>
            ) : null}
          </div>
          {error ? <div className="text-sm text-red-400">{error}</div> : null}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-3 rounded">
              <div className="text-sm mb-2">普通二维码</div>
              <canvas ref={canvasRef} className="w-56 h-56" />
            </div>
            <div className="bg-white p-3 rounded">
              <div className="text-sm mb-2">微信小程序码</div>
              {wxacodeBase64 ? (
                <img src={`data:image/png;base64,${wxacodeBase64}`} alt="wxa code" className="w-56 h-56" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-gray-500 text-sm">等待生成...</div>
              )}
            </div>
          </div>
          {qrcodeId ? <div className="text-xs text-white/50">qrcodeId: {qrcodeId}</div> : null}
        </CardContent>
      </Card>
    </div>
  )
}

