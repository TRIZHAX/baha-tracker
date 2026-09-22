"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, ClipboardPlus, Droplets, LifeBuoy, MapPinned, RefreshCw, ShieldCheck, Trash2, X } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

type Report = { id: string; streetName: string; barangay: string; depthLevel: string; verificationStatus: string; lengthMeters: number; createdAt: string; expiresAt: string; upvotes: number; downvotes: number; note: string | null }
type Sos = { id: string; user_id: string | null; accuracy_meters: number | null; emergency_types: string[]; status: string; created_at: string; acknowledged_at: string | null; updated_at: string }

const depthLabels: Record<string,string> = { ankle: "Ankle", knee: "Knee", waist: "Waist", above_waist: "Above waist" }
const statusLabels: Record<string,string> = { sent: "Sent", acknowledged: "Acknowledged", en_route: "En route", resolved: "Resolved" }

export function AdminDashboard({ email }: { email: string }) {
  const [reports, setReports] = useState<Report[]>([])
  const [sos, setSos] = useState<Sos[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ streetName: "", barangay: "", depthLevel: "ankle", lengthMeters: "20", startLongitude: "120.9842", startLatitude: "14.5995", endLongitude: "120.9852", endLatitude: "14.6005", note: "" })

  const load = async () => {
    setLoading(true)
    const [r, s] = await Promise.all([fetch("/api/admin/reports", { cache: "no-store" }), fetch("/api/admin/sos", { cache: "no-store" })])
    if (r.ok) setReports((await r.json()).reports || [])
    if (s.ok) setSos((await s.json()).alerts || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const activeSos = useMemo(() => sos.filter((x) => x.status !== "resolved").length, [sos])

  const deleteReport = async (id: string) => {
    if (!window.confirm("Delete this flood report permanently?")) return
    const res = await fetch(`/api/admin/reports?id=${encodeURIComponent(id)}`, { method: "DELETE" })
    if (res.ok) { setMessage("Report deleted."); await load() } else setMessage("Could not delete the report.")
  }

  const addReport = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch("/api/admin/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, lengthMeters: Number(form.lengthMeters) }) })
    if (res.ok) { setShowAdd(false); setMessage("Flood report added and marked verified."); setForm({ streetName: "", barangay: "", depthLevel: "ankle", lengthMeters: "20", startLongitude: "120.9842", startLatitude: "14.5995", endLongitude: "120.9852", endLatitude: "14.6005", note: "" }); await load() }
    else { const data = await res.json().catch(() => null); setMessage(data?.error || "Could not add report.") }
  }

  const updateSos = async (id: string, status: string) => {
    const res = await fetch("/api/admin/sos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) })
    if (res.ok) { setMessage("SOS status updated."); await load() } else setMessage("Could not update SOS status.")
  }

  return <div className="min-h-dvh bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
    <header className="sticky top-0 z-40 border-b bg-[hsl(var(--card)/.92)] px-4 py-3 backdrop-blur lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-cyan-700 dark:text-cyan-300"><ShieldCheck className="h-4 w-4" />Admin Control Center</p><h1 className="font-display text-2xl font-bold">Baha Tracker Administration</h1><p className="text-sm text-[hsl(var(--muted-foreground))]">{email}</p></div>
        <div className="flex items-center gap-2"><Link href="/map" className="rounded-xl border px-3 py-2 text-sm font-bold hover:bg-[hsl(var(--muted))]">Back to map</Link><ThemeToggle /></div>
      </div>
    </header>

    <main className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8">
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-[hsl(var(--card))] p-5"><p className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">All reports</p><p className="mt-1 text-3xl font-bold">{reports.length}</p></div>
        <div className="rounded-2xl border bg-[hsl(var(--card))] p-5"><p className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">Verified reports</p><p className="mt-1 text-3xl font-bold">{reports.filter(r => r.verificationStatus === "verified").length}</p></div>
        <div className="rounded-2xl border bg-[hsl(var(--card))] p-5"><p className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">Active SOS</p><p className="mt-1 text-3xl font-bold text-red-600">{activeSos}</p></div>
      </section>

      {message && <div className="flex items-center justify-between rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-900 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-100"><span>{message}</span><button onClick={() => setMessage("")} aria-label="Close message"><X className="h-4 w-4" /></button></div>}

      <section className="rounded-2xl border bg-[hsl(var(--card))] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 lg:p-5"><div><h2 className="flex items-center gap-2 text-xl font-bold"><Droplets className="h-5 w-5 text-cyan-600" />Flood Reports</h2><p className="text-sm text-[hsl(var(--muted-foreground))]">View, add, and permanently delete reports.</p></div><div className="flex gap-2"><button onClick={load} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold"><RefreshCw className="h-4 w-4" />Refresh</button><button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-bold text-white"><ClipboardPlus className="h-4 w-4" />Add report</button></div></div>
        {loading ? <div className="p-8 text-center font-semibold">Loading reports…</div> : reports.length === 0 ? <div className="p-8 text-center text-[hsl(var(--muted-foreground))]">No reports found.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead><tr className="border-b text-left text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]"><th className="p-4">Road / Barangay</th><th className="p-4">Depth</th><th className="p-4">Status</th><th className="p-4">Community</th><th className="p-4">Created</th><th className="p-4">Action</th></tr></thead><tbody>{reports.map(r => <tr key={r.id} className="border-b last:border-0"><td className="p-4"><p className="font-bold">{r.streetName}</p><p className="text-xs text-[hsl(var(--muted-foreground))]">{r.barangay}</p>{r.note && <p className="mt-1 max-w-xs truncate text-xs">{r.note}</p>}</td><td className="p-4">{depthLabels[r.depthLevel] || r.depthLevel}<div className="text-xs text-[hsl(var(--muted-foreground))]">{r.lengthMeters} m</div></td><td className="p-4"><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{r.verificationStatus}</span></td><td className="p-4">👍 {r.upvotes} · 👎 {r.downvotes}</td><td className="p-4">{new Date(r.createdAt).toLocaleString()}</td><td className="p-4"><button onClick={() => deleteReport(r.id)} className="flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 font-bold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"><Trash2 className="h-4 w-4" />Delete</button></td></tr>)}</tbody></table></div>}
      </section>

      <section className="rounded-2xl border bg-[hsl(var(--card))] shadow-sm">
        <div className="border-b p-4 lg:p-5"><h2 className="flex items-center gap-2 text-xl font-bold"><LifeBuoy className="h-5 w-5 text-red-600" />Emergency SOS</h2><p className="text-sm text-[hsl(var(--muted-foreground))]">Monitor incoming emergency alerts and update their response status.</p></div>
        {sos.length === 0 ? <div className="p-8 text-center text-[hsl(var(--muted-foreground))]">No SOS alerts found.</div> : <div className="grid gap-3 p-4 lg:p-5">{sos.map(a => <div key={a.id} className="rounded-2xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4 text-red-600" />{(a.emergency_types || []).join(", ") || "Emergency"}</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{new Date(a.created_at).toLocaleString()} · Accuracy {a.accuracy_meters ?? "—"} m</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Alert ID: {a.id}</p></div><span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 dark:bg-red-950 dark:text-red-200">{statusLabels[a.status] || a.status}</span></div><div className="mt-3 flex flex-wrap gap-2">{["acknowledged","en_route","resolved"].map(s => <button key={s} onClick={() => updateSos(a.id, s)} disabled={a.status === s} className="rounded-xl border px-3 py-2 text-xs font-bold disabled:opacity-40">{statusLabels[s]}</button>)}</div></div>)}</div>}
      </section>

      <div className="flex flex-wrap gap-4 rounded-2xl border bg-[hsl(var(--card))] p-4 text-sm text-[hsl(var(--muted-foreground))]"><MapPinned className="h-5 w-5 text-cyan-600" /><p><strong className="text-[hsl(var(--foreground))]">Admin access is server-protected.</strong> This page only loads for an authenticated account whose `public.users.role` is `admin`.</p><CheckCircle2 className="ml-auto h-5 w-5 text-emerald-600" /></div>
    </main>

    {showAdd && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4"><div className="mx-auto my-8 max-w-2xl rounded-2xl bg-[hsl(var(--card))] p-5 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Add flood report</h2><p className="text-sm text-[hsl(var(--muted-foreground))]">Admin-created reports are marked verified.</p></div><button onClick={() => setShowAdd(false)}><X /></button></div><form onSubmit={addReport} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm font-semibold">Street name<input required value={form.streetName} onChange={e => setForm({...form,streetName:e.target.value})} className="rounded-xl border bg-transparent px-3 py-2" /></label><label className="grid gap-1 text-sm font-semibold">Barangay<input required value={form.barangay} onChange={e => setForm({...form,barangay:e.target.value})} className="rounded-xl border bg-transparent px-3 py-2" /></label><label className="grid gap-1 text-sm font-semibold">Flood depth<select value={form.depthLevel} onChange={e => setForm({...form,depthLevel:e.target.value})} className="rounded-xl border bg-transparent px-3 py-2"><option value="ankle">Ankle</option><option value="knee">Knee</option><option value="waist">Waist</option><option value="above_waist">Above waist</option></select></label><label className="grid gap-1 text-sm font-semibold">Length (meters)<input type="number" min="0" max="2000" required value={form.lengthMeters} onChange={e => setForm({...form,lengthMeters:e.target.value})} className="rounded-xl border bg-transparent px-3 py-2" /></label><label className="grid gap-1 text-sm font-semibold">Start longitude<input type="number" step="any" required value={form.startLongitude} onChange={e => setForm({...form,startLongitude:e.target.value})} className="rounded-xl border bg-transparent px-3 py-2" /></label><label className="grid gap-1 text-sm font-semibold">Start latitude<input type="number" step="any" required value={form.startLatitude} onChange={e => setForm({...form,startLatitude:e.target.value})} className="rounded-xl border bg-transparent px-3 py-2" /></label><label className="grid gap-1 text-sm font-semibold">End longitude<input type="number" step="any" required value={form.endLongitude} onChange={e => setForm({...form,endLongitude:e.target.value})} className="rounded-xl border bg-transparent px-3 py-2" /></label><label className="grid gap-1 text-sm font-semibold">End latitude<input type="number" step="any" required value={form.endLatitude} onChange={e => setForm({...form,endLatitude:e.target.value})} className="rounded-xl border bg-transparent px-3 py-2" /></label><label className="grid gap-1 text-sm font-semibold sm:col-span-2">Note<textarea value={form.note} onChange={e => setForm({...form,note:e.target.value})} className="min-h-20 rounded-xl border bg-transparent px-3 py-2" /></label><div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setShowAdd(false)} className="rounded-xl border px-4 py-2 font-bold">Cancel</button><button type="submit" className="rounded-xl bg-cyan-700 px-4 py-2 font-bold text-white">Create verified report</button></div></form></div></div>}
  </div>
}
