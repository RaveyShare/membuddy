import { type NextRequest, NextResponse } from "next/server"
import { geminiAI } from "@/lib/gemini-ai"

export async function POST(request: NextRequest) {
  try {
    console.log("🌐 API Route: 收到生成记忆辅助工具请求")

    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "内容不能为空" }, { status: 400 })
    }

    console.log("📝 API Route: 处理内容:", content.substring(0, 100) + "...")

    // 在服务端调用 Gemini AI
    const result = await geminiAI.generateMemoryAids(content)

    console.log("✅ API Route: 生成完成")

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ API Route: 生成失败:", error)

    return NextResponse.json(
      {
        error: "生成记忆辅助工具失败",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    )
  }
}
