import { Clock3, MapPin, ShieldCheck, ThumbsDown, ThumbsUp } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import { getPassability } from "@/lib/passability"
import { FloodReport, VehicleType } from "@/lib/types"
import { formatRelativeTime } from "@/lib/utils"

export function ReportCard({ report, vehicle, onSelect }: { report: FloodReport; vehicle: VehicleType; onSelect?: () => void }) {
  const status = getPassability(report.depthLevel, vehicle)
  return (
    <button onClick={onSelect} className="w-full rounded-2xl border bg-[hsl(var(--card))] p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-cyan-500">
      <div className="flex items-start justify-between gap-3"><StatusBadge status={status} /><span className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]"><Clock3 className="h-3.5 w-3.5" />{formatRelativeTime(report.createdAt)}</span></div>
      <h3 className="mt-3 font-display text-lg font-bold">{report.streetName}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))]"><MapPin className="h-4 w-4" />{report.barangay} · {Math.round(report.lengthMeters)} m</p>
      <div className="mt-3 flex items-center gap-4 border-t pt-3 text-xs font-semibold text-[hsl(var(--muted-foreground))]"><span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-cyan-700" />{report.verificationStatus}</span><span className="ml-auto flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" />{report.upvotes}</span><span className="flex items-center gap-1"><ThumbsDown className="h-3.5 w-3.5" />{report.downvotes}</span></div>
    </button>
  )
}
