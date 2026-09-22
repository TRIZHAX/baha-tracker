import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await createServerSupabase()
  const { data } = auth ? await auth.auth.getUser() : { data: { user: null } }
  if (!data.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const service = createServiceSupabase()
  if (!service) return Response.json({ error: "Supabase service configuration is missing" }, { status: 503 })
  const { data: profile, error } = await service.from("users").select("role,email").eq("id", data.user.id).single()
  if (error || profile?.role !== "admin") return Response.json({ error: "Admin access required" }, { status: 403 })
  return Response.json({ user: { id: data.user.id, email: profile.email, role: profile.role } })
}
