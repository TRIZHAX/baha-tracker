import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const OSM_TILE_HOST = "https://tile.openstreetmap.org"
const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || "https://baha-tracker.vercel.app"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z, x, y } = await params

  if (!/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+\.png$/.test(y)) {
    return new NextResponse("Invalid tile coordinates", { status: 400 })
  }

  const upstreamUrl = `${OSM_TILE_HOST}/${z}/${x}/${y}`

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "User-Agent": "BAHA-Tracker/1.0 (+https://baha-tracker.vercel.app/)",
        Referer: _request.headers.get("referer") || `${APP_ORIGIN}/`,
      },
      cache: "no-store",
    })

    if (!upstream.ok) {
      return new NextResponse("Map tile unavailable", { status: upstream.status })
    }

    const contentType = upstream.headers.get("content-type") || "image/png"
    return new NextResponse(await upstream.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=2592000",
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return new NextResponse("Map tile unavailable", { status: 502 })
  }
}
