"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createBrowserSupabase } from "@/lib/supabase/browser"
import { FloodReport } from "@/lib/types"

const notExpired = (report: FloodReport) => report.verificationStatus !== "hidden" && report.verificationStatus !== "expired" && new Date(report.expiresAt).getTime() > Date.now()

export function useReports() {
  const [reports, setReports] = useState<FloodReport[]>([])
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isOffline, setIsOffline] = useState(false)
  const mounted = useRef(true)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/reports", { cache: "no-store" })
      if (!response.ok) throw new Error("Reports unavailable")
      const payload = await response.json() as { reports: FloodReport[] }
      if (mounted.current) {
        setReports(payload.reports.filter(notExpired))
        setLastUpdated(new Date())
        setIsOffline(false)
      }
    } catch {
      if (mounted.current) {
        setReports((current) => current.filter(notExpired))
        setIsOffline(true)
      }
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    refresh()
    const polling = window.setInterval(refresh, 45000)
    const handleNetwork = () => setIsOffline(!navigator.onLine)
    window.addEventListener("online", handleNetwork)
    window.addEventListener("offline", handleNetwork)
    const supabase = createBrowserSupabase()
    const channel = supabase?.channel("live-flood-reports").on("postgres_changes", { event: "*", schema: "public", table: "reports" }, refresh).subscribe()
    return () => {
      mounted.current = false
      window.clearInterval(polling)
      window.removeEventListener("online", handleNetwork)
      window.removeEventListener("offline", handleNetwork)
      if (channel) supabase?.removeChannel(channel)
    }
  }, [refresh])

  return { reports, lastUpdated, isOffline, refresh }
}
