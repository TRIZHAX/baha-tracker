import { SosScreen } from "@/components/sos-screen"
import { requireAuthenticatedUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function SosPage() {
  await requireAuthenticatedUser()
  return <SosScreen />
}
