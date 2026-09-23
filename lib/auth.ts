import { redirect } from "next/navigation"
import { createServerSupabase } from "@/lib/supabase/server"

export async function requireAuthenticatedUser() {
  const supabase = await createServerSupabase()
  if (!supabase) redirect("/login")

  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/login")

  return data.user
}
