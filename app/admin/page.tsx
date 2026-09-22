import { ShieldX } from "lucide-react"
import { AdminDashboard } from "@/components/admin-dashboard"
import { getAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const admin = await getAdmin()
  if ("error" in admin) {
    const status = admin.error.status
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <section className="w-full max-w-md rounded-3xl border bg-[hsl(var(--card))] p-8 text-center shadow-soft">
          <ShieldX className="mx-auto h-12 w-12 text-red-600" />
          <h1 className="mt-4 font-display text-2xl font-bold">{status === 401 ? "401 Unauthorized" : "403 Admin access required"}</h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">This area is restricted to authenticated users whose database profile has the <code>admin</code> role.</p>
        </section>
      </main>
    )
  }
  return <AdminDashboard />
}
