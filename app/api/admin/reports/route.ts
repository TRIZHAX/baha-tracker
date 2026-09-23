import { NextRequest, NextResponse } from "next/server"
import { getAdmin } from "@/lib/admin"
import { safeJsonError } from "@/lib/request"
import type { VerificationStatus } from "@/lib/types"

export const dynamic = "force-dynamic"

const verificationStatuses: VerificationStatus[] = ["verified", "unverified", "hidden", "expired"]

export async function GET() {
  const admin = await getAdmin()
  if ("error" in admin) return admin.error

  const { service, user } = admin
  const { data, error } = await service.rpc("get_admin_reports", { p_actor_id: user.id })
  if (error) return safeJsonError("Reports could not be loaded", 500)

  return NextResponse.json({
    reports: (data ?? []).map((row) => ({
      ...row,
      length_meters: Number(row.length_meters),
      start_latitude: Number(row.start_latitude),
      start_longitude: Number(row.start_longitude),
      end_latitude: Number(row.end_latitude),
      end_longitude: Number(row.end_longitude)
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
