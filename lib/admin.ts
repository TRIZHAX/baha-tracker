import { NextResponse } from "next/server"
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server"

export type AdminContext = {
  user: { id: string; email?: string | null }
  service: NonNullable<ReturnType<typeof createServiceSupabase>>
}

export async function getAdmin(): Promise<AdminContext | { error: NextResponse }> {
  const authClient = await createServerSupabase()
  if (!authClient) {
    return { error: NextResponse.json({ error: "Authentication is not configured" }, { status: 503 }) }
  }

  const { data, error: authError } = await authClient.auth.getUser()
  if (authError || !data.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const service = createServiceSupabase()
  if (!service) {
    return { error: NextResponse.json({ error: "Server database configuration is incomplete" }, { status: 503 }) }
  }

  const { data: profile, error: profileError } = await service
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle()

  if (profileError) {
    return { error: NextResponse.json({ error: "Unable to verify administrator access" }, { status: 500 }) }
  }

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) }
  }

  return { user: data.user, service }
}
