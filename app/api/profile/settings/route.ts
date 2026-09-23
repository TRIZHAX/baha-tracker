import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"
import { vehicleOptions } from "@/lib/constants"
import type { VehicleType } from "@/lib/types"

export const dynamic = "force-dynamic"

const vehicleValues = new Set(vehicleOptions.map((option) => option.value))

const isVehicleType = (value: unknown): value is VehicleType =>
  typeof value === "string" && vehicleValues.has(value as VehicleType)

async function getAuthenticatedClient() {
  const supabase = await createServerSupabase()
  if (!supabase) return { supabase: null, user: null, error: "Account services are not configured." }

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return { supabase: null, user: null, error: "Your session has expired. Please log in again." }

  return { supabase, user: data.user, error: null }
}

export async function GET() {
  const { supabase, user, error } = await getAuthenticatedClient()
  if (error || !supabase || !user) return NextResponse.json({ error }, { status: 401 })

  const { data, error: profileError } = await supabase
    .from("users")
    .select("full_name, home_barangay, default_vehicle, notification_preferences")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) return NextResponse.json({ error: "Could not load your saved settings." }, { status: 500 })

  return NextResponse.json({
    profile: {
      fullName: data?.full_name ?? user.user_metadata?.full_name ?? "",
      homeBarangay: data?.home_barangay ?? "",
      defaultVehicle: data?.default_vehicle ?? "tricycle",
      notifications: Boolean((data?.notification_preferences as Record<string, unknown> | null)?.floodAlerts ?? true),
      dataSaver: Boolean((data?.notification_preferences as Record<string, unknown> | null)?.dataSaver ?? false),
    },
  })
}

export async function PATCH(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedClient()
  if (error || !supabase || !user) return NextResponse.json({ error }, { status: 401 })

  const body = await request.json().catch(() => null) as {
    fullName?: unknown
    homeBarangay?: unknown
    defaultVehicle?: unknown
    notifications?: unknown
    dataSaver?: unknown
  } | null

  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid settings payload." }, { status: 400 })

  const fullName = typeof body.fullName === "string" ? body.fullName.trim().slice(0, 120) : ""
  const homeBarangay = typeof body.homeBarangay === "string" ? body.homeBarangay.trim().slice(0, 120) : ""
  const defaultVehicle: VehicleType = isVehicleType(body.defaultVehicle)
    ? body.defaultVehicle
    : "tricycle"
  const notifications = typeof body.notifications === "boolean" ? body.notifications : true
  const dataSaver = typeof body.dataSaver === "boolean" ? body.dataSaver : false

  const { data: savedProfile, error: profileError } = await supabase
    .from("users")
    .update({
      full_name: fullName || null,
      home_barangay: homeBarangay || null,
      default_vehicle: defaultVehicle,
      notification_preferences: { floodAlerts: notifications, dataSaver },
    })
    .eq("id", user.id)
    .select("id, full_name, home_barangay, default_vehicle, notification_preferences")
    .maybeSingle()

  if (profileError) return NextResponse.json({ error: `Settings were not saved: ${profileError.message}` }, { status: 400 })
  if (!savedProfile) return NextResponse.json({ error: "Your account profile was not found, so the settings were not saved." }, { status: 404 })

  const { error: authUpdateError } = await supabase.auth.updateUser({
    data: { full_name: fullName || null },
  })
  if (authUpdateError) return NextResponse.json({ error: `Settings were saved, but the account name could not be updated: ${authUpdateError.message}` }, { status: 400 })

  return NextResponse.json({
    profile: {
      fullName: savedProfile.full_name ?? "",
      homeBarangay: savedProfile.home_barangay ?? "",
      defaultVehicle: savedProfile.default_vehicle ?? "tricycle",
      notifications: Boolean((savedProfile.notification_preferences as Record<string, unknown> | null)?.floodAlerts ?? true),
      dataSaver: Boolean((savedProfile.notification_preferences as Record<string, unknown> | null)?.dataSaver ?? false),
    },
  })
}
