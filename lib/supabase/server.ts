import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

type CookieToSet = { name: string; value: string; options: CookieOptions }

export const hasSupabaseConfig = Boolean(publicUrl && publicKey)
export const hasServiceRoleConfig = Boolean(publicUrl && serviceRoleKey)

export const createServerSupabase = async (remember = true) => {
  if (!hasSupabaseConfig) return null
  const cookieStore = await cookies()
  return createServerClient(publicUrl as string, publicKey as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, {
            ...options,
            maxAge: remember ? options.maxAge : undefined,
          })
        })
      },
    },
  })
}

export const createServiceSupabase = () => {
  if (!hasServiceRoleConfig) return null
  return createClient(publicUrl as string, serviceRoleKey as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
