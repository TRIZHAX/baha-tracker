"use client"

import { CloudRain, LifeBuoy, Plus, Radio, ShieldAlert, WifiOff } from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { AppFrame } from "@/components/app-frame"
import { ReportCard } from "@/components/report-card"
import { SegmentDetail } from "@/components/segment-detail"
import { VehicleSelector } from "@/components/vehicle-selector"
import { useReports } from "@/hooks/use-reports"
import { FloodReport, VehicleType } from "@/lib/types"

const FloodMap = dynamic(() => import("@/components/flood-map").then((module) => module.FloodMap), { ssr: false, loading: () => <div className="flex h-full min-h-[calc(100dvh-4rem)] items-center justify-center bg-cyan-50 font-semibold dark:bg-cyan-950"><CloudRain className="mr-2 h-5 w-5 animate-pulse" />Preparing street map</div> })

export function HomeScreen() {
  const { reports, lastUpdated, isOffline } = useReports()
  const [vehicle, setVehicle] = useState<VehicleType>("tricycle")
  const [selectedReport, setSelectedReport] = useState<FloodReport | null>(null)

  useEffect(() => {
    const savedVehicle = window.localStorage.getItem("baha-vehicle") as VehicleType | null
    if (savedVehicle) setVehicle(savedVehicle)
  }, [])

  const selectVehicle = (value: VehicleType) => {
    setVehicle(value)
    window.localStorage.setItem("baha-vehicle", value)
  }

  const verifiedCount = useMemo(() => reports.filter((report) => report.verificationStatus === "verified").length, [reports])

  return (
    <AppFrame title="Live flood map">
      <div className="grid min-h-[calc(100dvh-4rem)] md:grid-cols-[minmax(0,1fr)_300px] lg:min-h-dvh lg:grid-cols-[minmax(0,1fr)_330px] xl:grid-cols-[minmax(0,1fr)_370px]">
        <section className="relative min-w-0 overflow-hidden" aria-label="Live flood map">
          <FloodMap reports={reports} vehicle={vehicle} selectedReport={selectedReport} onSelectReport={setSelectedReport} />
          <div className="absolute bottom-24 left-3 right-3 z-20 hidden sm:block md:left-5 md:right-5 lg:bottom-5 lg:right-auto lg:w-[540px]"><VehicleSelector value={vehicle} onChange={selectVehicle} compact /></div>
          <div className="absolute bottom-[13rem] right-3 z-20 flex flex-col gap-2 sm:bottom-[13rem] sm:right-5 lg:bottom-5">
            <Link href="/report" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-700 px-5 font-bold text-white shadow-float transition hover:bg-cyan-800 active:scale-[0.98] dark:bg-cyan-400 dark:text-slate-950"><Plus className="h-5 w-5" />Report flood</Link>
            <Link href="/sos" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 font-bold text-white shadow-float transition hover:bg-red-700 active:scale-[0.98]"><LifeBuoy className="h-5 w-5" />Emergency SOS</Link>
          </div>
          {selectedReport && <SegmentDetail report={selectedReport} vehicle={vehicle} onClose={() => setSelectedReport(null)} />}
        </section>
        <aside className="hidden max-h-[calc(100dvh-4rem)] overflow-y-auto border-l bg-[hsl(var(--background))] p-5 md:block lg:max-h-dvh" aria-label="Live flood report feed">
          <div className="flex items-start justify-between"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300"><Radio className="h-3.5 w-3.5" />Live reports</p><h1 className="mt-1 font-display text-3xl font-bold">Road watch</h1></div><span className="rounded-xl bg-[hsl(var(--muted))] px-3 py-2 text-sm font-bold">{reports.length}</span></div>
          <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-2xl border bg-[hsl(var(--card))] p-3"><p className="text-2xl font-bold">{verifiedCount}</p><p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">verified</p></div><div className="rounded-2xl border bg-[hsl(var(--card))] p-3"><p className="text-2xl font-bold">3h</p><p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">auto expiry</p></div></div>
          <div className="mt-3 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">{isOffline ? <WifiOff className="h-4 w-4 text-amber-600" /> : <span className="h-2 w-2 rounded-full bg-emerald-500" />} {isOffline ? "Offline · showing saved data" : `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}</div>
          <div className="mt-5 space-y-3">{reports.map((report) => <ReportCard key={report.id} report={report} vehicle={vehicle} onSelect={() => setSelectedReport(report)} />)}</div>
          <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><p className="text-sm leading-relaxed"><strong>Community guidance only.</strong> Never drive into water when depth or current is uncertain.</p></div>
        </aside>
      </div>
      {!selectedReport && <div className="fixed inset-x-3 bottom-[5.5rem] z-20 sm:hidden"><VehicleSelector value={vehicle} onChange={selectVehicle} compact /></div>}
    </AppFrame>
  )
}
