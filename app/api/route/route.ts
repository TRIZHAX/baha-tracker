import { NextRequest } from "next/server"
import { z } from "zod"
import { philippinesBounds } from "@/lib/constants"
import { safeJsonError } from "@/lib/request"
import { Coordinate } from "@/lib/types"

export const dynamic = "force-dynamic"

const coordinateQuery = z.string().transform((value) => value.split(",").map(Number)).pipe(z.tuple([
  z.number().min(philippinesBounds.minimumLongitude).max(philippinesBounds.maximumLongitude),
  z.number().min(philippinesBounds.minimumLatitude).max(philippinesBounds.maximumLatitude)
]))

export async function GET(request: NextRequest) {
  const start = coordinateQuery.safeParse(request.nextUrl.searchParams.get("start"))
  const end = coordinateQuery.safeParse(request.nextUrl.searchParams.get("end"))
  if (!start.success || !end.success) return safeJsonError("Invalid route coordinates", 400)
  const fallback = { coordinates: [start.data, end.data] as Coordinate[], snapped: false }
  const baseUrl = process.env.NEXT_PUBLIC_OSRM_URL || "https://router.project-osrm.org"
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3500)
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/route/v1/driving/${start.data.join(",")};${end.data.join(",")}?overview=full&geometries=geojson`, { signal: controller.signal, cache: "no-store" })
    clearTimeout(timeout)
    if (!response.ok) return Response.json(fallback)
    const payload = await response.json() as { routes?: Array<{ geometry: { coordinates: Coordinate[] }; distance: number }> }
    const route = payload.routes?.[0]
    if (!route || route.distance > 2000) return Response.json(fallback)
    return Response.json({ coordinates: route.geometry.coordinates, distance: route.distance, snapped: true })
  } catch {
    return Response.json(fallback)
  }
}
