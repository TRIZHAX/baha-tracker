"use client"

import { useEffect } from "react"
import { syncQueuedReports } from "@/lib/offline-queue"

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js")
    const sync = () => syncQueuedReports().catch(() => undefined)
    window.addEventListener("online", sync)
    sync()
    return () => window.removeEventListener("online", sync)
  }, [])
  return null
}
