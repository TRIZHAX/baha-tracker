import { ReactNode } from "react"
import { DesktopSidebar, MobileBottomNav, MobileHeader } from "@/components/navigation"

export function AppFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-[hsl(var(--background))]">
      <DesktopSidebar />
      <MobileHeader title={title} />
      <main className="min-w-0 flex-1 pb-20 pt-16 lg:p-0">{children}</main>
      <MobileBottomNav />
    </div>
  )
}
