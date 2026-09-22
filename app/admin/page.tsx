import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminDashboard } from "@/components/admin-dashboard"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const auth = await createServerSupabase()
  if (!auth) redirect("/login")
  const { data } = await auth.auth.getUser()
  if (!data.user) redirect("/login")
  const service = createServiceSupabase()
  if (!service) redirect("/map")
  const { data: profile } = await service.from("users").select("email,role").eq("id", data.user.id).single()
  if (profile?.role !== "admin") redirect("/map")
  return <AdminDashboard email={profile.email || data.user.email || "Admin"} />
}
