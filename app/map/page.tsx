import { HomeScreen } from "@/components/home-screen"
import { requireAuthenticatedUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function MapPage() {
  await requireAuthenticatedUser()
  return <HomeScreen />
}
