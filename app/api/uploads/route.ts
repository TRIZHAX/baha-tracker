import { NextRequest } from "next/server"
import { safeJsonError } from "@/lib/request"
import { createServerSupabase } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"])

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null)
  const photo = formData?.get("photo")
  if (!(photo instanceof File)) return safeJsonError("Photo is required", 400)
  if (!allowedTypes.has(photo.type) || photo.size > 3_000_000) return safeJsonError("Use a JPG, PNG, or WebP photo under 3 MB", 400)

  const supabase = await createServerSupabase()
  if (!supabase) return safeJsonError("Account services are not configured", 503)
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return safeJsonError("Sign in to upload a photo", 401)

  const extension = photo.type === "image/png" ? "png" : photo.type === "image/jpeg" ? "jpg" : "webp"
  const path = `${authData.user.id}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from("flood-photos").upload(path, photo, { contentType: photo.type, upsert: false })
  if (error) {
    console.error("photo upload failed", { code: error.name, message: error.message })
    return safeJsonError("Photo upload failed", 500)
  }
  const { data } = supabase.storage.from("flood-photos").getPublicUrl(path)
  return Response.json({ url: data.publicUrl }, { status: 201 })
}
