"use client"

import { AlertTriangle, CheckCircle2, Clock3, FileWarning, MapPinned, RefreshCw, ShieldCheck, Trash2 } from "lucide-react"
import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AdminReport, SosAdminAlert, SosStatus, VerificationStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"

const AdminSosMap = dynamic(() => import("@/components/admin-sos-map").then((module) => module.AdminSosMap), {
  ssr: false,
  loading: () => <div className="flex h-[420px] items-center justify-center rounded-3xl border bg-cyan-50 font-semibold dark:bg-cyan-950 lg:h-[560px]">Preparing SOS map…</div>
})

const reportStatuses: VerificationStatus[] = ["verified", "unverified", "hidden", "expired"]
const sosStatuses: SosStatus[] = ["sent", "acknowledged", "en_route", "resolved"]

const statusText: Record<string, string> = {
  sent: "Sent",
  acknowledged: "Acknowledged",
  en_route: "En route",
  resolved: "Resolved",
  verified: "Verified",
  unverified: "Unverified",
  hidden: "Hidden",
  expired: "Expired"
}

export function AdminDashboard() {
  const [reports, setReports] = useState<AdminReport[]>([])
  const [sos, setSos] = useState<SosAdminAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState("")

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    setError("")
    try {
      const [reportsResponse, sosResponse] = await Promise.all([fetch("/api/admin/reports", { cache: "no-store" }), fetch("/api/admin/sos", { cache: "no-store" })])
      const reportsJson = await reportsResponse.json().catch(() => ({}))
      const sosJson = await sosResponse.json().catch(() => ({}))
      if (!reportsResponse.ok) throw new Error(reportsJson.error || "Reports could not be loaded")
      if (!sosResponse.ok) throw new Error(sosJson.error || "SOS alerts could not be loaded")
      setReports(reportsJson.reports ?? [])
      setSos(sosJson.sos ?? [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Admin data could not be loaded")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const updateReport = async (id: string, verificationStatus: VerificationStatus) => {
    setBusyId(id)
    try {
      const response = await fetch("/api/admin/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, verificationStatus }) })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(json.error || "Report could not be updated")
      setReports((current) => current.map((report) => report.id === id ? { ...report, verification_status: verificationStatus } : report))
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Report could not be updated") } finally { setBusyId("") }
  }

  const deleteReport = async (id: string) => {
    if (!window.confirm("Delete this report? This cannot be undone.")) return
    setBusyId(id)
    try {
      const response = await fetch(`/api/admin/reports?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(json.error || "Report could not be deleted")
      setReports((current) => current.filter((report) => report.id !== id))
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Report could not be deleted") } finally { setBusyId("") }
  }

  const updateSos = async (id: string, status: SosStatus) => {
    setBusyId(id)
    try {
      const response = await fetch("/api/admin/sos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(json.error || "SOS status could not be updated")
      setSos((current) => current.map((alert) => alert.id === id ? { ...alert, status, acknowledged_at: status === "acknowledged" ? new Date().toISOString() : alert.acknowledged_at } : alert))
    } catch (cause) { setError(cause instanceof Error ? cause.message : "SOS status could not be updated") } finally { setBusyId("") }
  }

  const activeSos = useMemo(() => sos.filter((alert) => alert.status !== "resolved"), [sos])
  const verifiedReports = useMemo(() => reports.filter((report) => report.verification_status === "verified").length, [reports])

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300"><ShieldCheck className="h-4 w-4" />Administrator</p>
          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Admin Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-[hsl(var(--muted-foreground))]">Monitor reports, review emergency SOS alerts, and view protected SOS locations.</p>
        </div>
        <Button variant="secondary" onClick={() => void load(true)} disabled={refreshing}><RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</Button>
      </header>

      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">{error}</div>}

      <section aria-label="Overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewCard icon={FileWarning} label="Total reports" value={reports.length} />
        <OverviewCard icon={CheckCircle2} label="Verified reports" value={verifiedReports} />
        <OverviewCard icon={AlertTriangle} label="Active SOS" value={activeSos.length} />
        <OverviewCard icon={MapPinned} label="Mapped SOS" value={sos.filter((alert) => Number.isFinite(alert.latitude) && Number.isFinite(alert.longitude)).length} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
        <div className="rounded-3xl border bg-[hsl(var(--card))] p-4 shadow-soft sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-display text-xl font-bold">SOS Alerts</h2><p className="text-sm text-[hsl(var(--muted-foreground))]">Status and emergency details from the protected admin API.</p></div><span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 dark:bg-red-950 dark:text-red-200">{sos.length}</span></div>
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-[hsl(var(--muted))] text-xs uppercase tracking-wide"><tr><th className="p-3">SOS</th><th className="p-3">Reporter</th><th className="p-3">Status</th><th className="p-3">Created</th><th className="p-3">Location</th><th className="p-3">Action</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="p-6 text-center">Loading SOS alerts…</td></tr> : sos.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-[hsl(var(--muted-foreground))]">No SOS alerts found.</td></tr> : sos.map((alert) => <tr key={alert.id} className="border-t align-top"><td className="p-3 font-mono text-xs">{alert.id.slice(0, 8)}…</td><td className="p-3"><div className="font-semibold">{alert.reporter_name ?? "Unknown reporter"}</div><div className="text-xs text-[hsl(var(--muted-foreground))]">{alert.reporter_email ?? "No email"}</div></td><td className="p-3"><select aria-label={`Update SOS ${alert.id} status`} disabled={busyId === alert.id} value={alert.status} onChange={(event) => void updateSos(alert.id, event.target.value as SosStatus)} className="rounded-xl border bg-transparent px-2 py-2 font-semibold">{sosStatuses.map((status) => <option key={status} value={status}>{statusText[status]}</option>)}</select></td><td className="p-3 whitespace-nowrap">{new Date(alert.created_at).toLocaleString()}</td><td className="p-3 font-mono text-xs">{Number.isFinite(alert.latitude) ? `${alert.latitude.toFixed(5)}, ${alert.longitude.toFixed(5)}` : "No coordinates"}</td><td className="p-3">{alert.emergency_types.join(", ")}</td></tr>)}</tbody></table>
          </div>
        </div>

        <div className="rounded-3xl border bg-[hsl(var(--card))] p-4 shadow-soft sm:p-5"><div className="mb-4 flex items-center gap-2"><MapPinned className="h-5 w-5 text-red-600" /><div><h2 className="font-display text-xl font-bold">SOS Map</h2><p className="text-sm text-[hsl(var(--muted-foreground))]">Only administrators receive these locations.</p></div></div><AdminSosMap alerts={sos} /></div>
      </section>

      <section className="rounded-3xl border bg-[hsl(var(--card))] p-4 shadow-soft sm:p-5">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-xl font-bold">Reports</h2><p className="text-sm text-[hsl(var(--muted-foreground))]">Review status, reporter details, timestamps, and moderation actions.</p></div><span className="rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-xs font-bold">{reports.length}</span></div>
        <div className="overflow-x-auto rounded-2xl border"><table className="w-full min-w-[1320px] text-left text-sm"><thead className="bg-[hsl(var(--muted))] text-xs uppercase tracking-wide"><tr><th className="p-3">Report</th><th className="p-3">Who reported</th><th className="p-3">Location</th><th className="p-3">Depth</th><th className="p-3">Status</th><th className="p-3">Created</th><th className="p-3">Votes</th><th className="p-3">Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan={8} className="p-6 text-center">Loading reports…</td></tr> : reports.length === 0 ? <tr><td colSpan={8} className="p-6 text-center text-[hsl(var(--muted-foreground))]">No reports found.</td></tr> : reports.map((report) => <tr key={report.id} className="border-t align-top"><td className="p-3"><div className="font-mono text-xs">{report.id.slice(0, 8)}…</div><div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{report.report_mode}</div></td><td className="p-3"><div className="font-semibold">{report.reporter_name ?? (report.user_id ? "Name not provided" : "Guest / unknown")}</div><div className="text-xs text-[hsl(var(--muted-foreground))]">{report.reporter_email ?? "No email"}</div></td><td className="p-3"><div className="font-semibold">{report.street_name}</div><div className="text-xs text-[hsl(var(--muted-foreground))]">{report.barangay}</div><div className="mt-1 font-mono text-[11px]">Start: {report.start_latitude.toFixed(5)}, {report.start_longitude.toFixed(5)}</div>{(report.start_latitude !== report.end_latitude || report.start_longitude !== report.end_longitude) && <div className="font-mono text-[11px]">End: {report.end_latitude.toFixed(5)}, {report.end_longitude.toFixed(5)}</div>}</td><td className="p-3 capitalize">{report.depth_level.replace("_", " ")}</td><td className="p-3"><select aria-label={`Update report ${report.id} status`} disabled={busyId === report.id} value={report.verification_status} onChange={(event) => void updateReport(report.id, event.target.value as VerificationStatus)} className="rounded-xl border bg-transparent px-2 py-2 font-semibold">{reportStatuses.map((status) => <option key={status} value={status}>{statusText[status]}</option>)}</select></td><td className="p-3 whitespace-nowrap"><div>{new Date(report.created_at).toLocaleString()}</div><div className="text-xs text-[hsl(var(--muted-foreground))]">expires {new Date(report.expires_at).toLocaleString()}</div></td><td className="p-3 whitespace-nowrap">↑ {report.upvotes} · ↓ {report.downvotes}</td><td className="p-3"><div className="flex flex-wrap gap-2"><button type="button" disabled={busyId === report.id || report.verification_status === "verified"} onClick={() => void updateReport(report.id, "verified")} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 px-3 font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950"><CheckCircle2 className="h-4 w-4" />{report.verification_status === "verified" ? "Verified" : "Verify"}</button><button type="button" disabled={busyId === report.id} onClick={() => void deleteReport(report.id)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 px-3 font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"><Trash2 className="h-4 w-4" />Delete</button></div></td></tr>)}</tbody></table></div>
      </section>

      <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><Clock3 className="h-4 w-4" />Admin data is fetched without client-side service credentials and is not exposed through the normal user APIs.</div>
    </div>
  )
}

function OverviewCard({ icon: Icon, label, value }: { icon: typeof FileWarning; label: string; value: number }) {
  return <div className="rounded-3xl border bg-[hsl(var(--card))] p-5 shadow-soft"><div className="flex items-center justify-between"><span className="rounded-2xl bg-cyan-50 p-3 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"><Icon className="h-5 w-5" /></span><span className="font-display text-3xl font-bold">{value}</span></div><p className="mt-3 text-sm font-semibold text-[hsl(var(--muted-foreground))]">{label}</p></div>
}
