import { NextRequest } from "next/server"
import { distanceBetween, reduceCoordinatePrecision } from "@/lib/geo"
import { checkRateLimit } from "@/lib/rate-limit"
import { getRequestIdentity, safeJsonError } from "@/lib/request"
import { createServerSupabase } from "@/lib/supabase/server"
import { FloodReport } from "@/lib/types"
import { reportSchema } from "@/lib/validation"

export const dynamic = "force-dynamic"

type ReportRow = {
  id: string
  user_id: string | null
  coordinates: Array<[number, number]>
  start_coordinate: [number, number]
  end_coordinate: [number, number]
  length_meters: number | string
  depth_level: FloodReport["depthLevel"]
  photo_url: string | null
  note: string | null
  street_name: string
  barangay: string
  created_at: string
  expires_at: string
  verification_status: FloodReport["verificationStatus"]
  upvotes: number
  downvotes: number
  report_mode: FloodReport["mode"]
}

const mapReportRow = (row: ReportRow): FloodReport => ({
  id: row.id,
  userId: row.user_id,
  coordinates: row.coordinates.map(reduceCoordinatePrecision),
  startPoint: reduceCoordinatePrecision(row.start_coordinate),
  endPoint: reduceCoordinatePrecision(row.end_coordinate),
  lengthMeters: Number(row.length_meters),
  depthLevel: row.depth_level,
  photoUrl: row.photo_url,
  note: row.note,
  streetName: row.street_name,
  barangay: row.barangay,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
  verificationStatus: row.verification_status,
  upvotes: row.upvotes,
  downvotes: row.downvotes,
  mode: row.report_mode,
})

export async function GET() {
  const supabase = await createServerSupabase()
  if (!supabase) return safeJsonError("Live reports are not configured", 503)
  const { data, error } = await supabase.rpc("get_active_reports")
  if (error) {
    console.error("get_active_reports failed", { code: error.code, message: error.message })
    return safeJsonError("Live reports are temporarily unavailable", 503)
  }
  return Response.json({ reports: (data as ReportRow[]).map(mapReportRow) }, { headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: NextRequest) {
  const parsed = reportSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return safeJsonError(parsed.error.issues[0]?.message || "Invalid report", 400)
  const report = parsed.data
  const allowedDistance = Math.max(100, report.accuracyMeters + 50)
  if (distanceBetween(report.startPoint, report.reporterLocation) > allowedDistance || distanceBetween(report.endPoint, report.reporterLocation) > allowedDistance) return safeJsonError("Both points must be near your verified location", 400)
  if (report.mode === "segment" && (report.lengthMeters < 5 || report.lengthMeters > 2000)) return safeJsonError("Flooded stretches must be between 5 meters and 2 kilometers", 400)

  const supabase = await createServerSupabase()
  if (!supabase) return safeJsonError("Account services are not configured", 503)
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return safeJsonError("Sign in to submit a report", 401)

  const identity = getRequestIdentity(request, authData.user.id)
  const limit = await checkRateLimit("report", identity)
  if (!limit.success) return safeJsonError("Report limit reached. Please wait before sending another.", 429)

  const line = `SRID=4326;LINESTRING(${report.coordinates.map(([longitude, latitude]) => `${longitude} ${latitude}`).join(",")})`
  const startPoint = `SRID=4326;POINT(${report.startPoint[0]} ${report.startPoint[1]})`
  const endPoint = `SRID=4326;POINT(${report.endPoint[0]} ${report.endPoint[1]})`
  const { data, error } = await supabase.from("reports").insert({ user_id: authData.user.id, geom: line, start_point: startPoint, end_point: endPoint, length_meters: report.lengthMeters, depth_level: report.depthLevel, photo_url: report.photoUrl || null, note: report.note || null, street_name: report.streetName, barangay: report.barangay, report_mode: report.mode }).select("id").single()
  if (error) {
    console.error("report insert failed", { code: error.code, message: error.message })
    return safeJsonError("Report could not be saved", 500)
  }
  return Response.json({ report: data }, { status: 201 })
}
