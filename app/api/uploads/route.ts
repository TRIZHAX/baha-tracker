import { NextRequest } from "next/server"
import { safeJsonError } from "@/lib/request"
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"])

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null)
  const photo = formData?.get("photo")
  if (!(photo instanceof File)) return safeJsonError("Photo is required", 400)
  if (!allowedTypes.has(photo.type) || photo.size > 3_000_000) return safeJsonError("Use a JPG, PNG, or WebP photo under 3 MB", 400)
  const service = createServiceSupabase()
  if (!service) return safeJsonError("Photo storage is not configured", 503)
  const authClient = await createServerSupabase()
  const { data: authData } = authClient ? await authClient.auth.getUser() : { data: { user: null } }
  const owner = authData.user?.id || "guest"
  const extension = photo.type === "image/png" ? "png" : photo.type === "image/jpeg" ? "jpg" : "webp"
  const path = `${owner}/${crypto.randomUUID()}.${extension}`
  const { error } = await service.storage.from("flood-photos").upload(path, photo, { contentType: photo.type, upsert: false })
  if (error) return safeJsonError("Photo upload failed", 500)
  const { data } = service.storage.from("flood-photos").getPublicUrl(path)
  return Response.json({ url: data.publicUrl }, { status: 201 })
}
