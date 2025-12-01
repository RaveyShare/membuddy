import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

const TARGET = (process.env.NEXT_PUBLIC_USER_CENTER_URL || "https://user-center.ravey.site").replace(/\/$/, "")

async function handle(req: NextRequest, ctx: { params: { path: string[] } }) {
  const seg = ctx.params.path?.join("/") || ""
  const url = `${TARGET}/${seg}`
  const init: RequestInit = {
    method: req.method,
    headers: {
      "content-type": req.headers.get("content-type") || "application/json",
      "authorization": req.headers.get("authorization") || "",
    },
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.text(),
  }
  const res = await fetch(url, init)
  const body = await res.text()
  return new Response(body, { status: res.status, headers: { "content-type": res.headers.get("content-type") || "application/json" } })
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE, handle as OPTIONS, handle as PATCH }

