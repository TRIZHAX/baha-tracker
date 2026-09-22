import { NextRequest } from "next/server"
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

async function getAdmin() {
  const auth = await createServerSupabase()
  const { data } = auth ? await auth.auth.getUser() : { data: { user: null } }
  if (!data.user) return { user: null, service: null, error: Response.json({ error: "Unauthorized" }, { status: 401 }) }
  const service = createServiceSupabase()
  if (!service) return { user: data.user, service: null, error: Response.json({ error: "Supabase service configuration is missing" }, { status: 503 }) }
  const { data: profile } = await service.from("users").select("role").eq("id", data.user.id).single()
  if (profile?.role !== "admin") return { user: data.user, service, error: Response.json({ error: "Admin access required" }, { status: 403 }) }
  return { user: data.user, service, error: null }
}

const mapReport = (row: any) => ({
  id: row.id,
  userId: row.user_id,
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
  const { service, error } = await getAdmin()
  if (error) return error
  const { data, error: queryError } = await service!
    .from("reports")
    .select("id,user_id,length_meters,depth_level,photo_url,note,street_name,barangay,created_at,expires_at,verification_status,upvotes,downvotes,report_mode")
    .order("created_at", { ascending: false })
  if (queryError) return Response.json({ error: "Reports could not be loaded" }, { status: 500 })
  return Response.json({ reports: (data || []).map(mapReport) }, { headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: NextRequest) {
  const { user, service, error } = await getAdmin()
  if (error) return error
  const body = await request.json().catch(() => null)
  const start = [Number(body?.startLongitude), Number(body?.startLatitude)]
  const end = [Number(body?.endLongitude), Number(body?.endLatitude)]
  const lengthMeters = Number(body?.lengthMeters)
  const depthLevel = body?.depthLevel
  const streetName = String(body?.streetName || "").trim()
  const barangay = String(body?.barangay || "").trim()
  const note = String(body?.note || "").trim()
  const mode = body?.mode === "pin" ? "pin" : "segment"
  const validDepth = ["ankle", "knee", "waist", "above_waist"].includes(depthLevel)
  const validCoord = (p: number[]) => p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]) && p[0] >= -180 && p[0] <= 180 && p[1] >= -90 && p[1] <= 90
  if (!validCoord(start) || !validCoord(end) || !validDepth || !streetName || !barangay || !Number.isFinite(lengthMeters) || lengthMeters < 0 || lengthMeters > 2000) {
    return Response.json({ error: "Please provide valid location, flood depth, road, barangay, and length values." }, { status: 400 })
  }
  const line = `SRID=4326;LINESTRING(${start[0]} ${start[1]},${end[0]} ${end[1]})`
  const startPoint = `SRID=4326;POINT(${start[0]} ${start[1]})`
  const endPoint = `SRID=4326;POINT(${end[0]} ${end[1]})`
  const { data, error: insertError } = await service!.from("reports").insert({
    user_id: user!.id,
    geom: line,
    start_point: startPoint,
    end_point: endPoint,
    length_meters: lengthMeters,
    depth_level: depthLevel,
    photo_url: null,
    note: note || null,
    street_name: streetName,
    barangay,
    report_mode: mode,
    verification_status: "verified",
  }).select("id").single()
  if (insertError) return Response.json({ error: insertError.message }, { status: 500 })
  await service!.from("audit_log").insert({ actor_id: user!.id, action: "admin_report_created", target_table: "reports", target_id: data.id, metadata: { street_name: streetName, barangay } })
  return Response.json({ id: data.id }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const { user, service, error } = await getAdmin()
  if (error) return error
  const id = request.nextUrl.searchParams.get("id")
  if (!id) return Response.json({ error: "Report id is required" }, { status: 400 })
  const { error: deleteError } = await service!.from("reports").delete().eq("id", id)
  if (deleteError) return Response.json({ error: "Report could not be deleted" }, { status: 500 })
  await service!.from("audit_log").insert({ actor_id: user!.id, action: "admin_report_deleted", target_table: "reports", target_id: id, metadata: {} })
  return Response.json({ ok: true })
}
