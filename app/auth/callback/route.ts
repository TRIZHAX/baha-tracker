import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const nextPath = request.nextUrl.searchParams.get("next") || "/map"
  const destination = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/map"
  const supabase = await createServerSupabase()
  if (code && supabase) await supabase.auth.exchangeCodeForSession(code)
  return NextResponse.redirect(new URL(destination, request.url))
}
