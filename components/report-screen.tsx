"use client"

import { Camera, Check, CloudOff, LocateFixed, MapPinned, Navigation, Send, ShieldCheck } from "lucide-react"
import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AppFrame } from "@/components/app-frame"
import { Button } from "@/components/ui/button"
import { depthOptions } from "@/lib/constants"
import { distanceBetween, formatDistance, pathLength } from "@/lib/geo"
import { enqueueReport } from "@/lib/offline-queue"
import { compressPhoto } from "@/lib/photo"
import { Coordinate, DepthLevel } from "@/lib/types"
import { cn } from "@/lib/utils"

const ReportMapPicker = dynamic(() => import("@/components/report-map-picker").then((module) => module.ReportMapPicker), { ssr: false, loading: () => <div className="h-[360px] animate-pulse rounded-3xl bg-cyan-100 dark:bg-cyan-950 lg:h-[calc(100dvh-8rem)]" /> })

type PositionState = { coordinate: Coordinate; accuracy: number } | null

export function ReportScreen() {
  const router = useRouter()
  const [mode, setMode] = useState<"segment" | "pin">("segment")
  const [activePoint, setActivePoint] = useState<"start" | "end">("start")
  const [start, setStart] = useState<Coordinate | null>(null)
  const [end, setEnd] = useState<Coordinate | null>(null)
  const [currentPosition, setCurrentPosition] = useState<PositionState>(null)
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([])
  const [depthLevel, setDepthLevel] = useState<DepthLevel>("ankle")
  const [streetName, setStreetName] = useState("")
  const [barangay, setBarangay] = useState("")
  const [note, setNote] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [status, setStatus] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const lengthMeters = useMemo(() => routeCoordinates.length >= 2 ? pathLength(routeCoordinates) : 0, [routeCoordinates])

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine)
    updateConnection()
    window.addEventListener("online", updateConnection)
    window.addEventListener("offline", updateConnection)
    return () => {
      window.removeEventListener("online", updateConnection)
      window.removeEventListener("offline", updateConnection)
    }
  }, [])

  const requestLocation = () => {
    setStatus("Requesting location only for report verification")
    navigator.geolocation?.getCurrentPosition((position) => {
      const coordinate: Coordinate = [position.coords.longitude, position.coords.latitude]
      setCurrentPosition({ coordinate, accuracy: position.coords.accuracy })
      if (activePoint === "start") {
        setStart(coordinate)
        setActivePoint(mode === "segment" ? "end" : "start")
        if (mode === "pin") setEnd(coordinate)
      } else setEnd(coordinate)
      setStatus("Location captured. You can adjust it on the map.")
    }, () => setStatus("Location permission is needed to verify nearby reports"), { enableHighAccuracy: true, timeout: 10000 })
  }

  const setMapPoint = (coordinate: Coordinate) => {
    if (activePoint === "start") {
      setStart(coordinate)
      if (mode === "pin") setEnd(coordinate)
      else setActivePoint("end")
    } else setEnd(coordinate)
  }

  useEffect(() => {
    if (mode === "pin" && start) setEnd(start)
  }, [mode, start])

  useEffect(() => {
    if (!start || !end) {
      setRouteCoordinates(start ? [start] : [])
      return
    }
    if (mode === "pin") {
      setRouteCoordinates([start, end])
      return
    }
    const controller = new AbortController()
    const query = new URLSearchParams({ start: start.join(","), end: end.join(",") })
    fetch(`/api/route?${query}`, { signal: controller.signal }).then((response) => response.ok ? response.json() : Promise.reject()).then((payload: { coordinates: Coordinate[] }) => setRouteCoordinates(payload.coordinates)).catch(() => setRouteCoordinates([start, end]))
    return () => controller.abort()
  }, [start, end, mode])

  const uploadPhoto = async () => {
    if (!photo) return null
    const compressed = await compressPhoto(photo)
    const formData = new FormData()
    formData.set("photo", compressed)
    const response = await fetch("/api/uploads", { method: "POST", body: formData })
    if (!response.ok) throw new Error("Photo upload failed")
    const payload = await response.json() as { url: string }
    return payload.url
  }

  const submit = async () => {
    if (!start || !end) {
      setStatus("Set the flood location first")
      return
    }
    if (!currentPosition) {
      setStatus("Use your current location so the report can be verified")
      return
    }
    const allowedDistance = Math.max(100, currentPosition.accuracy + 50)
    if (distanceBetween(start, currentPosition.coordinate) > allowedDistance || distanceBetween(end, currentPosition.coordinate) > allowedDistance) {
      setStatus(`Both points must be within ${Math.round(allowedDistance)} m of you`)
      return
    }
    const submittedLength = mode === "pin" ? 0 : lengthMeters
    if (mode === "segment" && (submittedLength < 5 || submittedLength > 2000)) {
      setStatus("Flooded stretches must be between 5 m and 2 km")
      return
    }
    if (!streetName.trim() || !barangay.trim()) {
      setStatus("Add the street and barangay so neighbors can find it")
      return
    }
    setIsSubmitting(true)
    try {
      const photoUrl = await uploadPhoto()
      const payload = { coordinates: [start, end] as [Coordinate, Coordinate], startPoint: start, endPoint: end, lengthMeters: submittedLength, depthLevel, photoUrl, note: note.trim() || null, streetName: streetName.trim(), barangay: barangay.trim(), mode, reporterLocation: currentPosition.coordinate, accuracyMeters: currentPosition.accuracy }
      if (!isOnline) {
        await enqueueReport(payload)
        setStatus("Saved offline. It will send when your connection returns.")
        setIsSubmitting(false)
        return
      }
      const response = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || "Report could not be sent")
      setStatus("Report is live. Thank you for keeping the community safe.")
      window.setTimeout(() => router.push("/map"), 900)
    } catch (error) {
      if (!isOnline) {
        setStatus("Connection lost. Submit again to save this report offline.")
      } else setStatus(error instanceof Error ? error.message : "Report could not be sent")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppFrame title="Report flood">
      <div className="storm-grid min-h-[calc(100dvh-4rem)] p-4 lg:min-h-dvh lg:p-6">
        <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(370px,0.8fr)]">
          <ReportMapPicker start={start} end={end} routeCoordinates={routeCoordinates} activePoint={activePoint} onMapPoint={setMapPoint} onUseLocation={requestLocation} locationReady={Boolean(currentPosition)} />
          <section className="rounded-3xl border bg-[hsl(var(--card))] p-5 shadow-float lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-cyan-700 dark:text-cyan-300">Community report</p>
            <h1 className="mt-2 font-display text-3xl font-bold">Mark the flooded stretch</h1>
            <p className="mt-2 text-[hsl(var(--muted-foreground))]">Set where the water starts and ends. Your location is used only to verify that you are nearby.</p>
            <div className="mt-5 grid grid-cols-2 rounded-2xl bg-[hsl(var(--muted))] p-1"><button onClick={() => setMode("segment")} className={cn("min-h-11 rounded-xl font-bold transition", mode === "segment" && "bg-[hsl(var(--card))] shadow-soft")}><Navigation className="mr-2 inline h-4 w-4" />Road segment</button><button onClick={() => setMode("pin")} className={cn("min-h-11 rounded-xl font-bold transition", mode === "pin" && "bg-[hsl(var(--card))] shadow-soft")}><MapPinned className="mr-2 inline h-4 w-4" />Drop pin only</button></div>
            <div className="mt-4 grid grid-cols-2 gap-2"><Button variant={activePoint === "start" ? "primary" : "secondary"} onClick={() => setActivePoint("start")}><span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">1</span>Set flood start{start && <Check className="h-4 w-4" />}</Button><Button variant={activePoint === "end" ? "primary" : "secondary"} onClick={() => setActivePoint("end")} disabled={mode === "pin"}><span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white">2</span>Set flood end{end && <Check className="h-4 w-4" />}</Button></div>
            {start && end && <div className="mt-4 flex items-center justify-between rounded-2xl bg-cyan-50 p-4 text-cyan-950 dark:bg-cyan-950 dark:text-cyan-100"><span className="flex items-center gap-2 font-semibold"><Navigation className="h-5 w-5" />Flooded distance</span><strong className="text-xl">{mode === "pin" ? "Single point" : formatDistance(lengthMeters)}</strong></div>}
            <fieldset className="mt-6"><legend className="font-display text-lg font-bold">How deep is the water?</legend><div className="mt-3 grid grid-cols-2 gap-2">{depthOptions.map((option) => <button key={option.value} onClick={() => setDepthLevel(option.value)} className={cn("min-h-[74px] rounded-2xl border p-3 text-left transition", depthLevel === option.value ? "border-cyan-600 bg-cyan-50 ring-2 ring-cyan-600/20 dark:bg-cyan-950" : "hover:bg-[hsl(var(--muted))]")}><span className="block font-bold">{option.label}</span><span className="text-sm text-[hsl(var(--muted-foreground))]">{option.hint}</span></button>)}</div></fieldset>
            <div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="font-semibold">Street name<input value={streetName} onChange={(event) => setStreetName(event.target.value)} maxLength={120} placeholder="e.g. Mabini Street" className="mt-2 min-h-12 w-full rounded-xl border bg-transparent px-3 outline-none focus:border-cyan-600" /></label><label className="font-semibold">Barangay<input value={barangay} onChange={(event) => setBarangay(event.target.value)} maxLength={120} placeholder="e.g. Barangay 12" className="mt-2 min-h-12 w-full rounded-xl border bg-transparent px-3 outline-none focus:border-cyan-600" /></label></div>
            <label className="mt-4 block font-semibold">Helpful note<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={2} placeholder="Current, open lane, landmarks" className="mt-2 w-full resize-none rounded-xl border bg-transparent p-3 outline-none focus:border-cyan-600" /></label>
            <label className="mt-4 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed font-bold transition hover:bg-[hsl(var(--muted))]"><Camera className="h-5 w-5" />{photo ? photo.name : "Add photo (optional)"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setPhoto(event.target.files?.[0] || null)} /></label>
            {status && <p role="status" className="mt-4 flex items-start gap-2 rounded-xl bg-[hsl(var(--muted))] p-3 text-sm font-semibold">{isOnline ? <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700" /> : <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}{status}</p>}
            <Button className="mt-5 w-full" onClick={submit} disabled={isSubmitting}><Send className="h-5 w-5" />{isSubmitting ? "Sending report" : "Publish flood report"}</Button>
            <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-[hsl(var(--muted-foreground))]"><LocateFixed className="h-3.5 w-3.5" />Reports expire after 3 hours unless reconfirmed</p>
          </section>
        </div>
      </div>
    </AppFrame>
  )
}
