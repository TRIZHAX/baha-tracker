import { ReportScreen } from "@/components/report-screen"
import { requireAuthenticatedUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function ReportPage() {
  await requireAuthenticatedUser()
  return <ReportScreen />
}
