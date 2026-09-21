"use client"

import { Bell, ChevronRight, Database, LogOut, MapPin, Moon, ShieldCheck, SlidersHorizontal, UserRound } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AppFrame } from "@/components/app-frame"
import { Button } from "@/components/ui/button"
import { vehicleOptions } from "@/lib/constants"
import { VehicleType } from "@/lib/types"

export function ProfileScreen() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [vehicle, setVehicle] = useState<VehicleType>("tricycle")
  const [barangay, setBarangay] = useState("Sampaloc")
  const [notifications, setNotifications] = useState(true)
  const [dataSaver, setDataSaver] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setVehicle((window.localStorage.getItem("baha-vehicle") as VehicleType | null) || "tricycle")
    setBarangay(window.localStorage.getItem("baha-barangay") || "Sampaloc")
    setNotifications(window.localStorage.getItem("baha-notifications") !== "false")
    setDataSaver(window.localStorage.getItem("baha-data-saver") === "true")
  }, [])

  const save = () => {
    window.localStorage.setItem("baha-vehicle", vehicle)
    window.localStorage.setItem("baha-barangay", barangay)
    window.localStorage.setItem("baha-notifications", String(notifications))
    window.localStorage.setItem("baha-data-saver", String(dataSaver))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <AppFrame title="Profile">
      <div className="storm-grid min-h-[calc(100dvh-4rem)] p-4 lg:min-h-dvh lg:p-8">
        <div className="mx-auto max-w-3xl">
          <header className="flex items-center gap-4 rounded-3xl bg-[hsl(var(--navy))] p-6 text-[hsl(var(--background))] shadow-float dark:bg-cyan-950 dark:text-slate-100"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10"><UserRound className="h-8 w-8" /></span><div><p className="text-xs font-bold uppercase tracking-[0.17em] opacity-60">Community member</p><h1 className="mt-1 font-display text-3xl font-bold">Your safety settings</h1></div></header>
          <section className="mt-5 rounded-3xl border bg-[hsl(var(--card))] p-5 shadow-soft sm:p-7"><h2 className="flex items-center gap-2 font-display text-xl font-bold"><SlidersHorizontal className="h-5 w-5 text-cyan-700" />Travel preferences</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="font-semibold">Default vehicle<select value={vehicle} onChange={(event) => setVehicle(event.target.value as VehicleType)} className="mt-2 min-h-12 w-full rounded-xl border bg-[hsl(var(--card))] px-3">{vehicleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="font-semibold">Home barangay<div className="relative mt-2"><MapPin className="absolute left-3 top-3.5 h-5 w-5 text-[hsl(var(--muted-foreground))]" /><input value={barangay} onChange={(event) => setBarangay(event.target.value)} maxLength={120} className="min-h-12 w-full rounded-xl border bg-transparent pl-10 pr-3" /></div></label></div></section>
          <section className="mt-5 overflow-hidden rounded-3xl border bg-[hsl(var(--card))] shadow-soft"><SettingRow icon={Bell} title="Flood alerts" detail="Nearby verified reports" enabled={notifications} onChange={setNotifications} /><SettingRow icon={Database} title="Data saver" detail="Reduce refresh and map detail" enabled={dataSaver} onChange={setDataSaver} /><SettingRow icon={Moon} title="Dark mode" detail="Adjust for low-light travel" enabled={resolvedTheme === "dark"} onChange={(enabled) => setTheme(enabled ? "dark" : "light")} /></section>
          <section className="mt-5 rounded-3xl border bg-[hsl(var(--card))] p-5 shadow-soft"><Link href="/map" className="flex min-h-12 items-center gap-3 font-bold"><ShieldCheck className="h-5 w-5 text-cyan-700" />My report history<span className="ml-auto text-sm font-normal text-[hsl(var(--muted-foreground))]">No saved reports</span><ChevronRight className="h-4 w-4" /></Link></section>
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><Button onClick={save}>{saved ? "Settings saved" : "Save settings"}</Button><Button variant="secondary" onClick={logout}><LogOut className="h-5 w-5" />Log out</Button></div>
        </div>
      </div>
    </AppFrame>
  )
}

function SettingRow({ icon: Icon, title, detail, enabled, onChange }: { icon: typeof Bell; title: string; detail: string; enabled: boolean; onChange: (enabled: boolean) => void }) {
  return <div className="flex min-h-[76px] items-center gap-3 border-b px-5 last:border-0"><Icon className="h-5 w-5 text-cyan-700" /><div><p className="font-bold">{title}</p><p className="text-sm text-[hsl(var(--muted-foreground))]">{detail}</p></div><button role="switch" aria-checked={enabled} aria-label={title} onClick={() => onChange(!enabled)} className={`ml-auto flex h-8 w-14 items-center rounded-full p-1 transition ${enabled ? "bg-cyan-700" : "bg-slate-300 dark:bg-slate-700"}`}><span className={`h-6 w-6 rounded-full bg-white shadow transition ${enabled ? "translate-x-6" : "translate-x-0"}`} /></button></div>
}
