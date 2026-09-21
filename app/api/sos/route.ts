import { NextRequest } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { getRequestIdentity, safeJsonError } from "@/lib/request"
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server"
import { sosSchema } from "@/lib/validation"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const parsed = sosSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return safeJsonError(parsed.error.issues[0]?.message || "Invalid SOS request", 400)
  const authClient = await createServerSupabase()
  const { data: authData } = authClient ? await authClient.auth.getUser() : { data: { user: null } }
  if (!authData.user) return safeJsonError("You must be signed in to send an SOS alert", 401)
  const identity = getRequestIdentity(request, authData.user.id)
  const limit = await checkRateLimit("sos", identity)
  if (!limit.success) return safeJsonError("SOS limit reached. Call your local emergency number now.", 429)
  const service = createServiceSupabase()
  if (!service) return safeJsonError("SOS service is not configured on this deployment", 503)
  const { location, accuracyMeters, emergencyTypes } = parsed.data
  const locationValue = `SRID=4326;POINT(${location[0]} ${location[1]})`
  const { data, error } = await service.from("sos_alerts").insert({ user_id: authData.user.id, location: locationValue, accuracy_meters: accuracyMeters, emergency_types: emergencyTypes, status: "sent" }).select("id,status").single()
  if (error) return safeJsonError("SOS could not be sent. Call your local emergency number now.", 500)
  await service.from("audit_log").insert({ actor_id: authData.user?.id || null, action: "sos_created", target_table: "sos_alerts", target_id: data.id, metadata: { emergency_types: emergencyTypes } })
  return Response.json(data, { status: 201 })
}
