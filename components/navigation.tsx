"use client"

import { CircleUserRound, LifeBuoy, Map, Plus, Radio } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

const navigationItems = [
  { href: "/map", label: "Live Map", shortLabel: "Map", icon: Map },
  { href: "/report", label: "Report Flood", shortLabel: "Report", icon: Plus },
  { href: "/sos", label: "Emergency SOS", shortLabel: "SOS", icon: LifeBuoy },
  { href: "/profile", label: "Profile", shortLabel: "Profile", icon: CircleUserRound }
]

export function DesktopSidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden w-[238px] shrink-0 flex-col border-r bg-[hsl(var(--card))] p-4 lg:flex">
      <Logo className="px-2 py-3" />
      <div className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"><Radio className="h-4 w-4 animate-pulse" />Live community data</div>
      <nav className="mt-5 space-y-1" aria-label="Main navigation">
        {navigationItems.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return <Link key={item.href} href={item.href} className={cn("flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold transition", active ? "bg-cyan-700 text-white shadow-soft dark:bg-cyan-500 dark:text-slate-950" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]")}><Icon className="h-5 w-5" />{item.label}</Link>
        })}
      </nav>
      <div className="mt-auto rounded-2xl bg-[hsl(var(--navy))] p-4 text-[hsl(var(--background))] dark:bg-cyan-950 dark:text-slate-100">
        <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-60">Safety first</p>
        <p className="mt-2 text-sm leading-relaxed">Never enter moving water. Turn around when depth is uncertain.</p>
      </div>
      <div className="mt-3 flex items-center justify-between px-2 text-sm font-semibold"><span>Appearance</span><ThemeToggle /></div>
    </aside>
  )
}

export function MobileBottomNav() {
  const pathname = usePathname()
  return (
    <nav className="safe-area-bottom glass fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t px-1 pt-2 lg:hidden" aria-label="Main navigation">
      {navigationItems.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href
        return <Link key={item.href} href={item.href} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold transition", active ? "text-cyan-700 dark:text-cyan-300" : "text-[hsl(var(--muted-foreground))]")}><Icon className={cn("h-5 w-5", item.href === "/sos" && "text-red-600")} /><span>{item.shortLabel}</span></Link>
      })}
    </nav>
  )
}

export function MobileHeader({ title }: { title: string }) {
  return <header className="glass fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b px-4 lg:hidden"><Logo compact /><span className="font-display text-lg font-bold">{title}</span><ThemeToggle /></header>
}
