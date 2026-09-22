import { NextRequest, NextResponse } from "next/server"
import { getAdmin } from "@/lib/admin"
import { safeJsonError } from "@/lib/request"
import type { VerificationStatus } from "@/lib/types"

export const dynamic = "force-dynamic"

const verificationStatuses: VerificationStatus[] = ["verified", "unverified", "hidden", "expired"]

export async function GET() {
  const admin = await getAdmin()
  if ("error" in admin) return admin.error

  const { service } = admin
  const { data, error } = await service
    .from("reports")
    .select("id,user_id,length_meters,depth_level,photo_url,note,street_name,barangay,report_mode,created_at,updated_at,expires_at,verification_status,upvotes,downvotes")
    .order("created_at", { ascending: false })

  if (error) return safeJsonError("Reports could not be loaded", 500)

  const userIds = [...new Set((data ?? []).map((row) => row.user_id).filter((id): id is string => Boolean(id)))]
  const usersById = new Map<string, { email: string | null }>()
  if (userIds.length) {
    const { data: users, error: usersError } = await service.from("users").select("id,email").in("id", userIds)
    if (usersError) return safeJsonError("Reporter information could not be loaded", 500)
    for (const user of users ?? []) usersById.set(user.id, { email: user.email })
  }

  return NextResponse.json({
    reports: (data ?? []).map((row) => ({
      ...row,
      reporter_email: row.user_id ? usersById.get(row.user_id)?.email ?? null : null,
      length_meters: Number(row.length_meters)
    }))
  }, { headers: { "Cache-Control": "no-store" } })
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdmin()
  if ("error" in admin) return admin.error

  const body = await request.json().catch(() => null) as { id?: unknown; verificationStatus?: unknown } | null
  if (typeof body?.id !== "string" || !verificationStatuses.includes(body.verificationStatus as VerificationStatus)) {
    return safeJsonError("Invalid report status update", 400)
  }

  const { service } = admin
  const status = body.verificationStatus as VerificationStatus
  const { data, error } = await service
    .from("reports")
    .update({ verification_status: status })
    .eq("id", body.id)
    .select("id,verification_status")
    .maybeSingle()

  if (error) return safeJsonError("Report status could not be updated", 500)
  if (!data) return safeJsonError("Report not found", 404)

  return NextResponse.json({ report: data })
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdmin()
  if ("error" in admin) return admin.error

  const id = new URL(request.url).searchParams.get("id")
  if (!id) return safeJsonError("Report id is required", 400)

  const { service, user } = admin
  const { error } = await service.from("reports").delete().eq("id", id)
  if (error) return safeJsonError("Report could not be deleted", 500)

  await service.from("audit_log").insert({
    actor_id: user.id,
    action: "report_deleted",
    target_table: "reports",
    target_id: id,
    metadata: {}
  })

  return NextResponse.json({ ok: true })
}
