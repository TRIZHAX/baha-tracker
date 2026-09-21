"use client"

import { Ambulance, Check, ChevronRight, CircleDot, HeartPulse, LifeBuoy, MapPin, PackageOpen, Phone, ShieldCheck, Users, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { AppFrame } from "@/components/app-frame"
import { Button } from "@/components/ui/button"
import { Coordinate, SosStatus, SosType } from "@/lib/types"
import { createBrowserSupabase } from "@/lib/supabase/browser"
import { cn } from "@/lib/utils"

const emergencyOptions: Array<{ value: SosType; title: string; detail: string; icon: typeof Users }> = [
  { value: "stranded", title: "Stranded", detail: "Need evacuation or rescue", icon: Users },
  { value: "medical", title: "Medical emergency", detail: "Injury or urgent care needed", icon: HeartPulse },
  { value: "supplies", title: "Food or clean water", detail: "Essential supplies needed", icon: PackageOpen }
]

const statusSteps: Array<{ value: SosStatus; label: string }> = [
  { value: "sent", label: "Sent" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "en_route", label: "Responder en route" }
]

export function SosScreen() {
  const [types, setTypes] = useState<SosType[]>([])
  const [countdown, setCountdown] = useState<number | null>(null)
  const [message, setMessage] = useState("Choose the help you need, then send your location.")
  const [status, setStatus] = useState<SosStatus | null>(null)
  const [alertId, setAlertId] = useState<string | null>(null)
  const position = useRef<{ location: Coordinate; accuracyMeters: number } | null>(null)

  const toggleType = (type: SosType) => setTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type])

  const transmit = useCallback(async () => {
    if (!position.current) return
    const response = await fetch("/api/sos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...position.current, emergencyTypes: types }) })
    const payload = await response.json() as { id?: string; status?: SosStatus; error?: string }
    if (!response.ok) {
      setMessage(payload.error || "SOS could not be sent. Call your local emergency number now.")
      setStatus(null)
      return
    }
    setStatus("sent")
    if (payload.id) setAlertId(payload.id)
    setMessage("Your SOS and location were sent to responders.")
  }, [types])

  useEffect(() => {
    if (!alertId) return
    const supabase = createBrowserSupabase()
    const channel = supabase?.channel(`sos-${alertId}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "sos_alerts", filter: `id=eq.${alertId}` }, (payload) => {
      const nextStatus = payload.new.status as SosStatus
      setStatus(nextStatus)
      setMessage(nextStatus === "acknowledged" ? "A responder acknowledged your SOS." : nextStatus === "en_route" ? "A responder is on the way." : nextStatus === "resolved" ? "This SOS was marked resolved." : "Your SOS is active.")
    }).subscribe()
    return () => {
      if (channel) supabase?.removeChannel(channel)
    }
  }, [alertId])

  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      setCountdown(null)
      transmit()
      return
    }
    const timer = window.setTimeout(() => setCountdown((value) => value === null ? null : value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown, transmit])

  const startSos = () => {
    if (!types.length) {
      setMessage("Select at least one emergency type first.")
      return
    }
    setMessage("Getting your precise location for responders.")
    navigator.geolocation?.getCurrentPosition((result) => {
      position.current = { location: [result.coords.longitude, result.coords.latitude], accuracyMeters: result.coords.accuracy }
      setCountdown(3)
      setMessage("SOS ready to send. Cancel now if this was accidental.")
    }, () => setMessage("Location is required for SOS. Call your local emergency number now."), { enableHighAccuracy: true, timeout: 8000 })
  }

  return (
    <AppFrame title="Emergency SOS">
      <div className="min-h-[calc(100dvh-4rem)] bg-[radial-gradient(circle_at_top,hsl(0_86%_96%),hsl(var(--background))_55%)] p-4 dark:bg-[radial-gradient(circle_at_top,hsl(0_45%_16%),hsl(var(--background))_55%)] lg:min-h-dvh lg:p-8">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.82fr]">
          <section className="rounded-3xl border bg-[hsl(var(--card))] p-6 shadow-float lg:p-9">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200"><LifeBuoy className="h-7 w-7" /></div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-red-600">Emergency assistance</p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">What help do you need?</h1>
            <p className="mt-3 text-[hsl(var(--muted-foreground))]">Your precise location and accuracy radius are attached only after you press the SOS button.</p>
            <div className="mt-7 space-y-3">{emergencyOptions.map((option) => {
              const Icon = option.icon
              const selected = types.includes(option.value)
              return <button key={option.value} aria-pressed={selected} onClick={() => toggleType(option.value)} className={cn("flex min-h-[76px] w-full items-center gap-4 rounded-2xl border p-4 text-left transition", selected ? "border-red-500 bg-red-50 ring-2 ring-red-500/20 dark:bg-red-950" : "hover:bg-[hsl(var(--muted))]")}><span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", selected ? "bg-red-600 text-white" : "bg-[hsl(var(--muted))]")}><Icon className="h-5 w-5" /></span><span><strong className="block">{option.title}</strong><span className="text-sm text-[hsl(var(--muted-foreground))]">{option.detail}</span></span>{selected && <Check className="ml-auto h-5 w-5 text-red-600" />}</button>
            })}</div>
            {countdown === null ? <button onClick={startSos} disabled={Boolean(status)} className="mt-8 flex min-h-[92px] w-full items-center justify-center gap-3 rounded-3xl bg-red-600 px-6 text-xl font-black text-white shadow-[0_18px_45px_-16px_hsl(0_72%_45%_/_0.65)] transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-60"><CircleDot className="h-7 w-7" />{status ? "SOS sent" : "Send SOS to responders"}</button> : <button onClick={() => { setCountdown(null); setMessage("SOS cancelled. No alert was sent.") }} className="mt-8 flex min-h-[92px] w-full animate-pulseRing items-center justify-center gap-3 rounded-3xl bg-slate-900 px-6 text-xl font-black text-white dark:bg-white dark:text-slate-950"><X className="h-7 w-7" />Cancel · sending in {countdown}</button>}
            <p role="status" className="mt-4 flex items-start gap-2 rounded-2xl bg-[hsl(var(--muted))] p-4 text-sm font-semibold"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />{message}</p>
          </section>
          <aside className="space-y-5">
            <section className="rounded-3xl bg-[hsl(var(--navy))] p-6 text-[hsl(var(--background))] shadow-float dark:bg-cyan-950 dark:text-slate-100">
              <p className="text-xs font-bold uppercase tracking-[0.17em] opacity-60">Alert status</p><h2 className="mt-2 font-display text-2xl font-bold">Responder connection</h2>
              <div className="mt-6 space-y-1">{statusSteps.map((step, index) => {
                const currentIndex = status ? statusSteps.findIndex((item) => item.value === status) : -1
                const complete = index <= currentIndex
                return <div key={step.value} className="flex min-h-14 items-center gap-3"><span className={cn("flex h-8 w-8 items-center justify-center rounded-full border-2", complete ? "border-emerald-400 bg-emerald-400 text-slate-950" : "border-white/25 text-white/40")}>{complete ? <Check className="h-4 w-4" /> : index + 1}</span><span className={cn("font-bold", !complete && "opacity-45")}>{step.label}</span>{complete && <ChevronRight className="ml-auto h-4 w-4 opacity-60" />}</div>
              })}</div>
            </section>
            <section className="rounded-3xl border bg-[hsl(var(--card))] p-6 shadow-soft"><div className="flex items-center gap-3"><Phone className="h-5 w-5 text-red-600" /><h2 className="font-display text-xl font-bold">Immediate danger?</h2></div><p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">Call your local emergency hotline if you can. Baha Tracker supplements official emergency services and does not replace them.</p></section>
            <section className="rounded-3xl border bg-[hsl(var(--card))] p-6 shadow-soft"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-cyan-700" /><h2 className="font-display text-xl font-bold">What responders receive</h2></div><ul className="mt-4 space-y-3 text-sm text-[hsl(var(--muted-foreground))]"><li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0" />GPS coordinates and accuracy</li><li className="flex gap-2"><Ambulance className="h-4 w-4 shrink-0" />Emergency type and timestamp</li></ul></section>
          </aside>
        </div>
      </div>
    </AppFrame>
  )
}
