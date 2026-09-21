import { NextRequest } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { getRequestIdentity, safeJsonError } from "@/lib/request"
import { createServerSupabase } from "@/lib/supabase/server"
import { sosSchema } from "@/lib/validation"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const parsed = sosSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return safeJsonError(parsed.error.issues[0]?.message || "Invalid SOS request", 400)
  const supabase = await createServerSupabase()
  if (!supabase) return safeJsonError("Account services are not configured", 503)
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return safeJsonError("Sign in to send an SOS", 401)

  const identity = getRequestIdentity(request, authData.user.id)
  const limit = await checkRateLimit("sos", identity)
  if (!limit.success) return safeJsonError("SOS limit reached. Call your local emergency number now.", 429)

  const { location, accuracyMeters, emergencyTypes } = parsed.data
  const locationValue = `SRID=4326;POINT(${location[0]} ${location[1]})`
  const { data, error } = await supabase.from("sos_alerts").insert({ user_id: authData.user.id, location: locationValue, accuracy_meters: accuracyMeters, emergency_types: emergencyTypes, status: "sent" }).select("id,status").single()
  if (error) {
    console.error("SOS insert failed", { code: error.code, message: error.message })
    return safeJsonError("SOS could not be sent. Call your local emergency number now.", 500)
  }
  return Response.json(data, { status: 201 })
}
