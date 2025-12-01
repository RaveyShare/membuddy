import { NextRequest, NextResponse } from "next/server"

const base = process.env.NEXT_PUBLIC_FRONT_AUTH_URL || (process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") || "http://localhost:8081")

function sanitizeHeaders(headers: Headers) {
  const obj: Record<string, string> = {}
  for (const [k, v] of headers.entries()) {
    if (k.toLowerCase() === "authorization") obj[k] = "<redacted>"
    else if (k.toLowerCase() === "cookie") obj[k] = "<redacted>"
    else obj[k] = v
  }
  return obj
}

async function handle(req: NextRequest, params: { path: string[] }) {
  const dest = `${base}/front/auth/${(params.path || []).join("/")}`
  const method = req.method
  const url = req.url
  const reqHeaders = new Headers(req.headers)
  reqHeaders.delete("host")
  let body: BodyInit | undefined = undefined
  let bodyLog: any = undefined
  if (method !== "GET" && method !== "HEAD") {
    const text = await req.text()
    body = text
    const ct = req.headers.get("content-type") || ""
    if (ct.includes("application/json")) {
      try { bodyLog = JSON.parse(text) } catch { bodyLog = text }
    } else {
      bodyLog = text
    }
  }
  console.log(JSON.stringify({ type: "proxy_request", method, source: url, destination: dest, headers: sanitizeHeaders(req.headers), body: bodyLog }))
  let resp: Response
  try {
    resp = await fetch(dest, { method, headers: reqHeaders, body })
  } catch (e: any) {
    console.log(JSON.stringify({ type: "proxy_error", destination: dest, message: String(e?.message || e) }))
    return NextResponse.json({ message: "proxy failed" }, { status: 502 })
  }
  const resHeaders = new Headers(resp.headers)
  console.log(JSON.stringify({ type: "proxy_response", destination: dest, status: resp.status, headers: sanitizeHeaders(resHeaders) }))
  const resBody = await resp.arrayBuffer()
  return new NextResponse(resBody, { status: resp.status, headers: resHeaders })
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) { return handle(req, params) }
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) { return handle(req, params) }
export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) { return handle(req, params) }
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) { return handle(req, params) }
