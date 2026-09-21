import { createServerSupabase } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST() {
  const supabase = await createServerSupabase()
  if (supabase) await supabase.auth.signOut()
  return Response.json({ success: true })
}
