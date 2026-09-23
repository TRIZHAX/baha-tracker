import { ProfileScreen } from "@/components/profile-screen"
import { requireAuthenticatedUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  await requireAuthenticatedUser()
  return <ProfileScreen />
}
