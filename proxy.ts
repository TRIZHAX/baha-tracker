import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

type CookieToSet = { name: string; value: string; options: CookieOptions }

const protectedPaths = ["/map", "/report", "/sos", "/profile"]

const isProtectedPath = (pathname: string) => protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))

export async function proxy(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) return NextResponse.next()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.redirect(new URL("/login?error=configuration", request.url))

  let response = NextResponse.next({ request })
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: CookieToSet[]) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ["/map/:path*", "/report/:path*", "/sos/:path*", "/profile/:path*"],
}
