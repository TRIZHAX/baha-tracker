import { Waves } from "lucide-react"
import { cn } from "@/lib/utils"

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[14px] bg-cyan-700 text-white shadow-soft dark:bg-cyan-400 dark:text-slate-950">
        <Waves className="h-6 w-6" aria-hidden="true" />
        <span className="absolute bottom-0 h-1 w-full bg-amber-400" />
      </span>
      {!compact && <span className="font-display text-xl font-bold tracking-tight">Baha Tracker</span>}
    </div>
  )
}
