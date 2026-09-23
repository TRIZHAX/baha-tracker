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
import { createBrowserSupabase } from "@/lib/supabase/browser"

const isVehicleType = (value: unknown): value is VehicleType =>
  typeof value === "string" && vehicleOptions.some((option) => option.value === value)

export function ProfileScreen() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [fullName, setFullName] = useState("")
  const [vehicle, setVehicle] = useState<VehicleType>("tricycle")
  const [barangay, setBarangay] = useState("")
  const [notifications, setNotifications] = useState(true)
  const [dataSaver, setDataSaver] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const localVehicle = window.localStorage.getItem("baha-vehicle")
    const localNotifications = window.localStorage.getItem("baha-notifications")
    const localDataSaver = window.localStorage.getItem("baha-data-saver")

    if (isVehicleType(localVehicle)) setVehicle(localVehicle)
    setNotifications(localNotifications !== "false")
    setDataSaver(localDataSaver === "true")

    const loadProfile = async () => {
      const supabase = createBrowserSupabase()
      if (!supabase) {
        setLoading(false)
        return
      }

      const { data: auth, error: authError } = await supabase.auth.getUser()
      if (authError || !auth.user) {
        setLoading(false)
        return
      }

      const { data, error: profileError } = await supabase
        .from("users")
        .select("full_name, home_barangay, default_vehicle, notification_preferences")
        .eq("id", auth.user.id)
        .maybeSingle()

      if (profileError) {
        setError("Could not load your saved settings from the database. Home barangay will remain blank until the profile can be loaded.")
        setLoading(false)
        return
      }

      setFullName(data?.full_name || auth.user.user_metadata?.full_name || "")

      // Supabase is the source of truth for Home barangay.
      // There is no hard-coded barangay fallback.
      if (typeof data?.home_barangay === "string") {
        setBarangay(data.home_barangay)
        if (data.home_barangay.trim()) window.localStorage.setItem("baha-barangay", data.home_barangay)
        else window.localStorage.removeItem("baha-barangay")
      } else {
        setBarangay("")
        window.localStorage.removeItem("baha-barangay")
      }

      if (isVehicleType(data?.default_vehicle)) {
        setVehicle(data.default_vehicle)
        window.localStorage.setItem("baha-vehicle", data.default_vehicle)
      }

      const preferences = data?.notification_preferences
      if (preferences && typeof preferences === "object" && !Array.isArray(preferences)) {
        const preferenceRecord = preferences as Record<string, unknown>
        if (typeof preferenceRecord.floodAlerts === "boolean") setNotifications(preferenceRecord.floodAlerts)
        if (typeof preferenceRecord.dataSaver === "boolean") setDataSaver(preferenceRecord.dataSaver)
      }

      setLoading(false)
    }

    void loadProfile()
  }, [])

  const save = async () => {
    setError("")
    setSaved(false)

    const supabase = createBrowserSupabase()
    if (!supabase) {
      setError("Supabase is not configured, so the settings could not be saved.")
      return
    }

    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth.user) {
      setError("Your session has expired. Please log in again before saving settings.")
      return
    }

    const trimmedFullName = fullName.trim()
    const trimmedBarangay = barangay.trim()

    const { data: savedProfile, error: profileError } = await supabase
      .from("users")
      .update({
        full_name: trimmedFullName || null,
        home_barangay: trimmedBarangay || null,
        default_vehicle: vehicle,
        notification_preferences: {
          floodAlerts: notifications,
          dataSaver,
        },
      })
      .eq("id", auth.user.id)
      .select("id")
      .maybeSingle()

    if (profileError) {
      setError(`Settings were not saved: ${profileError.message}`)
      return
    }

    if (!savedProfile) {
      setError("Your account profile was not found in the users table, so the settings were not saved.")
      return
    }

    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: { full_name: trimmedFullName || null },
    })

    if (authUpdateError) {
      setError(`Settings were saved to the database, but the account name could not be updated: ${authUpdateError.message}`)
      return
    }

    // Keep local storage synchronized, but never use a hard-coded barangay.
    if (trimmedBarangay) window.localStorage.setItem("baha-barangay", trimmedBarangay)
    else window.localStorage.removeItem("baha-barangay")
    window.localStorage.setItem("baha-vehicle", vehicle)
    window.localStorage.setItem("baha-notifications", String(notifications))
    window.localStorage.setItem("baha-data-saver", String(dataSaver))

    setBarangay(trimmedBarangay)
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
          <header className="flex items-center gap-4 rounded-3xl bg-[hsl(var(--navy))] p-6 text-[hsl(var(--background))] shadow-float dark:bg-cyan-950 dark:text-slate-100">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10"><UserRound className="h-8 w-8" /></span>
            <div><p className="text-xs font-bold uppercase tracking-[0.17em] opacity-60">Community member</p><h1 className="mt-1 font-display text-3xl font-bold">Your safety settings</h1></div>
          </header>

          <section className="mt-5 rounded-3xl border bg-[hsl(var(--card))] p-5 shadow-soft sm:p-7">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold"><SlidersHorizontal className="h-5 w-5 text-cyan-700" />Account & travel preferences</h2>
            <label className="mt-5 block font-semibold">Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} maxLength={120} placeholder="Your full name" disabled={loading} className="mt-2 min-h-12 w-full rounded-xl border bg-transparent px-4 outline-none focus:border-cyan-600 disabled:opacity-60" /></label>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="font-semibold">Default vehicle<select value={vehicle} onChange={(event) => setVehicle(event.target.value as VehicleType)} disabled={loading} className="mt-2 min-h-12 w-full rounded-xl border bg-[hsl(var(--card))] px-3 disabled:opacity-60">{vehicleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <label className="font-semibold">Home barangay<div className="relative mt-2"><MapPin className="absolute left-3 top-3.5 h-5 w-5 text-[hsl(var(--muted-foreground))]" /><input value={barangay} onChange={(event) => setBarangay(event.target.value)} maxLength={120} placeholder="Enter your home barangay" disabled={loading} className="min-h-12 w-full rounded-xl border bg-transparent pl-10 pr-3 outline-none focus:border-cyan-600 disabled:opacity-60" /></div></label>
            </div>
            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">Home barangay is read from your Supabase profile. Local storage is only synchronized after a successful save; it is not used as the source of truth.</p>
          </section>

          <section className="mt-5 overflow-hidden rounded-3xl border bg-[hsl(var(--card))] shadow-soft"><SettingRow icon={Bell} title="Flood alerts" detail="Nearby verified reports" enabled={notifications} onChange={setNotifications} /><SettingRow icon={Database} title="Data saver" detail="Reduce refresh and map detail" enabled={dataSaver} onChange={setDataSaver} /><SettingRow icon={Moon} title="Dark mode" detail="Adjust for low-light travel" enabled={resolvedTheme === "dark"} onChange={(enabled) => setTheme(enabled ? "dark" : "light")} /></section>
          <section className="mt-5 rounded-3xl border bg-[hsl(var(--card))] p-5 shadow-soft"><Link href="/map" className="flex min-h-12 items-center gap-3 font-bold"><ShieldCheck className="h-5 w-5 text-cyan-700" />My report history<span className="ml-auto text-sm font-normal text-[hsl(var(--muted-foreground))]">No saved reports</span><ChevronRight className="h-4 w-4" /></Link></section>

          {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100">{error}</p>}
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><Button onClick={save} disabled={loading}>{saved ? "Settings saved" : "Save settings"}</Button><Button variant="secondary" onClick={logout}><LogOut className="h-5 w-5" />Log out</Button></div>
        </div>
      </div>
    </AppFrame>
  )
}

function SettingRow({ icon: Icon, title, detail, enabled, onChange }: { icon: typeof Bell; title: string; detail: string; enabled: boolean; onChange: (enabled: boolean) => void }) {
  return <div className="flex min-h-[76px] items-center gap-3 border-b px-5 last:border-0"><Icon className="h-5 w-5 text-cyan-700" /><div><p className="font-bold">{title}</p><p className="text-sm text-[hsl(var(--muted-foreground))]">{detail}</p></div><button role="switch" aria-checked={enabled} aria-label={title} onClick={() => onChange(!enabled)} className={`ml-auto flex h-8 w-14 items-center rounded-full p-1 transition ${enabled ? "bg-cyan-700" : "bg-slate-300 dark:bg-slate-700"}`}><span className={`h-6 w-6 rounded-full bg-white shadow transition ${enabled ? "translate-x-6" : "translate-x-0"}`} /></button></div>
}
