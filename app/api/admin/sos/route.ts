import { NextRequest } from "next/server"
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

async function getAdmin() {
  const auth = await createServerSupabase()
  const { data } = auth ? await auth.auth.getUser() : { data: { user: null } }
  if (!data.user) return { user: null, service: null, error: Response.json({ error: "Unauthorized" }, { status: 401 }) }
  const service = createServiceSupabase()
  if (!service) return { user: data.user, service: null, error: Response.json({ error: "Supabase service configuration is missing" }, { status: 503 }) }
  const { data: profile } = await service.from("users").select("role").eq("id", data.user.id).single()
  if (profile?.role !== "admin") return { user: data.user, service, error: Response.json({ error: "Admin access required" }, { status: 403 }) }
  return { user: data.user, service, error: null }
}

export async function GET() {
  const { service, error } = await getAdmin()
  if (error) return error
  const { data, error: queryError } = await service!.from("sos_alerts").select("id,user_id,location,accuracy_meters,emergency_types,status,created_at,acknowledged_at,updated_at").order("created_at", { ascending: false })
  if (queryError) return Response.json({ error: "SOS alerts could not be loaded" }, { status: 500 })
  return Response.json({ alerts: data || [] }, { headers: { "Cache-Control": "no-store" } })
}

export async function PATCH(request: NextRequest) {
  const { user, service, error } = await getAdmin()
  if (error) return error
  const body = await request.json().catch(() => null)
  const id = String(body?.id || "")
  const status = String(body?.status || "")
  const allowed = ["sent", "acknowledged", "en_route", "resolved"]
  if (!id || !allowed.includes(status)) return Response.json({ error: "Invalid SOS status" }, { status: 400 })
  const update: Record<string, string> = { status, updated_at: new Date().toISOString() }
  if (status === "acknowledged") update.acknowledged_at = new Date().toISOString()
  const { error: updateError } = await service!.from("sos_alerts").update(update).eq("id", id)
  if (updateError) return Response.json({ error: "SOS status could not be updated" }, { status: 500 })
  await service!.from("audit_log").insert({ actor_id: user!.id, action: "admin_sos_status_updated", target_table: "sos_alerts", target_id: id, metadata: { status } })
  return Response.json({ ok: true })
}
