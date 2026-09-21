import { NextRequest } from "next/server"
import { safeJsonError } from "@/lib/request"
import { createServerSupabase } from "@/lib/supabase/server"
import { voteSchema } from "@/lib/validation"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const parsed = voteSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return safeJsonError("Invalid vote", 400)
  const supabase = await createServerSupabase()
  if (!supabase) return safeJsonError("Sign in to vote", 401)
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return safeJsonError("Sign in to vote", 401)
  const { data: profile } = await supabase.from("users").select("role").eq("id", authData.user.id).maybeSingle()
  if (profile?.role === "guest") return safeJsonError("Guest accounts cannot vote", 403)
  const { error } = await supabase.from("votes").upsert({ report_id: parsed.data.reportId, user_id: authData.user.id, vote: parsed.data.vote }, { onConflict: "report_id,user_id" })
  if (error) return safeJsonError("Vote could not be saved", 500)
  return Response.json({ success: true })
}
