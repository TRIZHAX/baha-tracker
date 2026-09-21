import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

type CookieToSet = { name: string; value: string; options: CookieOptions }

const PUBLIC_PATHS = new Set(["/", "/login", "/auth/callback"])
const PUBLIC_API_PATHS = new Set(["/api/auth", "/api/cron/expire-reports"])

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Static assets and explicitly public endpoints are never auth-gated.
  if (
    PUBLIC_PATHS.has(pathname) ||
    PUBLIC_API_PATHS.has(pathname) ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/sw.js" ||
    pathname === "/manifest.json" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || key.includes("YOUR_") || url.includes("YOUR_")) {
    // Fail closed for protected application pages rather than exposing the app
    // when authentication is not configured.
    return NextResponse.redirect(new URL("/login", request.url))
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: CookieToSet[]) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          })
        })
      },
    },
  })

  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
