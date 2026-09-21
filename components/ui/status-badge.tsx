import { AlertTriangle, Check, X } from "lucide-react"
import { PassabilityStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const presentation = {
  passable: { label: "Passable", icon: Check, style: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" },
  caution: { label: "Use caution", icon: AlertTriangle, style: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" },
  blocked: { label: "Not passable", icon: X, style: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" }
}

export function StatusBadge({ status, className }: { status: PassabilityStatus; className?: string }) {
  const item = presentation[status]
  const Icon = item.icon
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold", item.style, className)}><Icon className="h-4 w-4" aria-hidden="true" />{item.label}</span>
}
