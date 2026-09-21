import { NextRequest } from "next/server"
import { safeJsonError } from "@/lib/request"
import { createServiceSupabase } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return safeJsonError("Cron service is not configured", 503)
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return safeJsonError("Unauthorized", 401)
  const service = createServiceSupabase()
  if (!service) return safeJsonError("Expiry service is not configured on this deployment", 503)
  const { data, error } = await service.from("reports").update({ verification_status: "expired" }).lt("expires_at", new Date().toISOString()).neq("verification_status", "expired").select("id")
  if (error) {
    console.error("expire-reports failed:", error)
    return safeJsonError("Expiry task failed", 500)
  }
  return Response.json({ expired: data.length })
}
