import { NextRequest, NextResponse } from "next/server"
import { getAdmin } from "@/lib/admin"
import { safeJsonError } from "@/lib/request"
import type { SosStatus } from "@/lib/types"

export const dynamic = "force-dynamic"

const sosStatuses: SosStatus[] = ["sent", "acknowledged", "en_route", "resolved"]

type SosRow = {
  id: string
  user_id: string | null
  reporter_email: string | null
  latitude: number
  longitude: number
  accuracy_meters: number
  emergency_types: string[]
  status: SosStatus
  created_at: string
  acknowledged_at: string | null
  updated_at: string
}

export async function GET() {
  const admin = await getAdmin()
  if ("error" in admin) return admin.error

  const { service, user } = admin
  const { data, error } = await service.rpc("get_admin_sos_alerts", { p_actor_id: user.id })
  if (error) return safeJsonError("SOS alerts could not be loaded", 500)

  return NextResponse.json({ sos: (data as SosRow[] | null) ?? [] }, { headers: { "Cache-Control": "no-store" } })
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdmin()
  if ("error" in admin) return admin.error

  const body = await request.json().catch(() => null) as { id?: unknown; status?: unknown } | null
  if (typeof body?.id !== "string" || !sosStatuses.includes(body.status as SosStatus)) {
    return safeJsonError("Invalid SOS status update", 400)
  }

  const status = body.status as SosStatus
  const { service } = admin
  const { data, error } = await service
    .from("sos_alerts")
    .update({ status, ...(status === "acknowledged" ? { acknowledged_at: new Date().toISOString() } : {}) })
    .eq("id", body.id)
    .select("id,status,acknowledged_at,updated_at")
    .maybeSingle()

  if (error) return safeJsonError("SOS status could not be updated", 500)
  if (!data) return safeJsonError("SOS alert not found", 404)

  return NextResponse.json({ sos: data })
}
