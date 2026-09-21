import { NextRequest } from "next/server"
import { safeJsonError } from "@/lib/request"
import { createServerSupabase } from "@/lib/supabase/server"
import { authSchema } from "@/lib/validation"
import { checkRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const parsed = authSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return safeJsonError(parsed.error.issues[0]?.message || "Invalid account details", 400)
  const { action, email, password, remember } = parsed.data
  if (["signup", "reset", "resend"].includes(action)) {
    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const rate = await checkRateLimit("email", `${email.toLowerCase()}:${forwardedFor}`)
    if (!rate.success) return safeJsonError("Please wait 60 seconds before requesting another email", 429)
  }
  const supabase = await createServerSupabase(remember)
  if (!supabase) return safeJsonError("Account services are not configured. Continue as guest for the local demo.", 503)
  if (action === "reset") {
    const redirectTo = new URL("/auth/callback?next=/profile", request.url).toString()
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) return safeJsonError("Password reset email could not be sent", 400)
    return Response.json({ message: "Check your email for a secure reset link" })
  }
  if (action === "resend") {
    const { error } = await supabase.auth.resend({ type: "signup", email })
    if (error) return safeJsonError(error.message, 400)
    return Response.json({ message: "A new confirmation email has been sent" })
  }
  if (action === "signup") {
    const emailRedirectTo = new URL("/auth/callback", request.url).toString()
    const { data, error } = await supabase.auth.signUp({ email, password: password as string, options: { emailRedirectTo } })
    if (error) return safeJsonError(error.message, 400)
    if (data.user) await supabase.from("users").upsert({ id: data.user.id, email, role: "user" })
    return Response.json({ message: "Check your email to confirm your account" }, { status: 201 })
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password: password as string })
  if (error) return safeJsonError("Email or password is incorrect", 401)
  return Response.json({ success: true })
}
