import { NextRequest } from "next/server"

export const getRequestIdentity = (request: NextRequest, userId?: string | null) => {
  if (userId) return userId
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anonymous"
}

export const safeJsonError = (message: string, status: number) => Response.json({ error: message }, { status })
