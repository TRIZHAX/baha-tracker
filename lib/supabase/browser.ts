import { createBrowserClient } from "@supabase/ssr"

export const hasPublicSupabaseConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export const createBrowserSupabase = () => {
  if (!hasPublicSupabaseConfig) return null
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string)
}
