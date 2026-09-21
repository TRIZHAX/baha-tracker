"use client"

import { AlertTriangle, CheckCircle2, Clock3, MapPin, Navigation, ShieldCheck, ThumbsDown, ThumbsUp, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { depthOptions, vehicleOptions } from "@/lib/constants"
import { getPassability } from "@/lib/passability"
import { FloodReport, VehicleType } from "@/lib/types"
import { formatRelativeTime } from "@/lib/utils"

export function SegmentDetail({ report, vehicle, onClose }: { report: FloodReport; vehicle: VehicleType; onClose: () => void }) {
  const [upvotes, setUpvotes] = useState(report.upvotes)
  const [downvotes, setDownvotes] = useState(report.downvotes)
  const [message, setMessage] = useState("")
  const status = getPassability(report.depthLevel, vehicle)
  const depth = depthOptions.find((option) => option.value === report.depthLevel)
  const vehicleLabel = vehicleOptions.find((option) => option.value === vehicle)?.label

  const vote = async (value: 1 | -1) => {
    if (report.id.startsWith("demo-")) {
      if (value === 1) setUpvotes((count) => count + 1)
      else setDownvotes((count) => count + 1)
      setMessage("Demo vote recorded on this device")
      return
    }
    const response = await fetch("/api/votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportId: report.id, vote: value }) })
    const payload = await response.json() as { error?: string }
    if (!response.ok) {
      setMessage(payload.error || "Sign in to vote")
      return
    }
    if (value === 1) setUpvotes((count) => count + 1)
    else setDownvotes((count) => count + 1)
    setMessage("Thanks for validating this report")
  }

  return (
    <section className="glass fixed inset-x-3 bottom-[5.5rem] z-40 max-h-[70dvh] overflow-y-auto rounded-3xl border p-5 shadow-float animate-rise sm:left-auto sm:right-5 sm:w-[390px] lg:absolute lg:bottom-5" aria-label="Flood segment details">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">Flooded stretch</p><h2 className="mt-1 font-display text-2xl font-bold">{report.streetName}</h2></div>
        <Button variant="ghost" size="icon" aria-label="Close segment details" onClick={onClose}><X className="h-5 w-5" /></Button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2"><StatusBadge status={status} /><span className="rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-sm font-semibold">for {vehicleLabel}</span></div>
      {status === "blocked" && <div className="mt-4 flex gap-3 rounded-2xl bg-red-50 p-3 text-red-900 dark:bg-red-950 dark:text-red-100"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><p className="text-sm font-semibold">Your route may be blocked near {report.streetName}. Find another road.</p></div>}
      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[hsl(var(--muted))] p-3"><dt className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Water depth</dt><dd className="mt-1 font-bold">{depth?.label}</dd><dd className="text-sm text-[hsl(var(--muted-foreground))]">{depth?.hint}</dd></div>
        <div className="rounded-2xl bg-[hsl(var(--muted))] p-3"><dt className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Flood length</dt><dd className="mt-1 text-xl font-bold">{Math.round(report.lengthMeters)} m</dd><dd className="text-sm text-[hsl(var(--muted-foreground))]">point to point</dd></div>
      </dl>
      <div className="mt-4 space-y-2 text-sm text-[hsl(var(--muted-foreground))]"><p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{report.barangay}</p><p className="flex items-center gap-2"><Clock3 className="h-4 w-4" />Reported {formatRelativeTime(report.createdAt)}</p><p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />{report.verificationStatus === "verified" ? "Community verified" : "Awaiting more confirmations"}</p></div>
      {report.note && <blockquote className="mt-4 rounded-r-xl border-l-4 border-cyan-600 bg-cyan-50/70 p-3 text-sm leading-relaxed text-cyan-950 dark:bg-cyan-950/40 dark:text-cyan-100">{report.note}</blockquote>}
      <div className="mt-5 grid grid-cols-2 gap-2"><Button variant="secondary" onClick={() => vote(1)}><ThumbsUp className="h-4 w-4" />Still flooded · {upvotes}</Button><Button variant="ghost" onClick={() => vote(-1)}><ThumbsDown className="h-4 w-4" />Cleared · {downvotes}</Button></div>
      {message && <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-cyan-700 dark:text-cyan-300"><CheckCircle2 className="h-4 w-4" />{message}</p>}
      <Button className="mt-4 w-full" variant="secondary"><Navigation className="h-4 w-4" />Check route around flood</Button>
    </section>
  )
}
