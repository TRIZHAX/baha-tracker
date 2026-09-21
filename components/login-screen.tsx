"use client"

import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, MapPin, ShieldCheck, Waves } from "lucide-react"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

export function LoginScreen() {
  const router = useRouter()
  const nextPath = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null
  const destination = nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/map"
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const authenticate = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setStatus("")
    const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: mode, email, password, remember }) })
    const payload = await response.json() as { error?: string; message?: string }
    setSubmitting(false)
    if (!response.ok) {
      setStatus(payload.error || "Unable to continue")
      return
    }
    if (mode === "signup") {
      setStatus(payload.message || "Check your email to confirm your account")
      return
    }
    router.push(destination)
    router.refresh()
  }

  const resetPassword = async () => {
    if (!email) {
      setStatus("Enter your email first")
      return
    }
    const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reset", email }) })
    const payload = await response.json() as { error?: string; message?: string }
    setStatus(payload.message || payload.error || "Check your email")
  }

  return (
    <main className="grid min-h-dvh bg-[hsl(var(--background))] lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-[hsl(var(--navy))] p-12 text-[hsl(var(--background))] lg:flex lg:flex-col dark:bg-cyan-950 dark:text-slate-100">
        <div className="absolute -right-24 -top-20 h-96 w-96 rounded-full border-[70px] border-cyan-400/10" /><div className="absolute -bottom-40 -left-20 h-[34rem] w-[34rem] rounded-full border-[90px] border-amber-400/10" />
        <Logo className="relative" />
        <div className="relative my-auto max-w-xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Know before you go</p><h1 className="mt-5 font-display text-6xl font-bold leading-[0.95] tracking-tight">Flood depth,<br />street by street.</h1><p className="mt-6 max-w-lg text-lg leading-relaxed opacity-75">See the exact flooded stretch and whether your vehicle can safely pass. Community reports update as conditions change.</p><div className="mt-9 grid grid-cols-2 gap-3"><Feature icon={Waves} title="Point-to-point" detail="See where flooding starts and ends" /><Feature icon={ShieldCheck} title="Vehicle-aware" detail="Safety guidance for how you travel" /></div></div>
        <p className="relative text-sm opacity-55">Built for communities navigating severe weather.</p>
      </section>
      <section className="relative flex items-center justify-center p-5 sm:p-10">
        <div className="absolute right-4 top-4"><ThemeToggle /></div>
        <div className="w-full max-w-md animate-rise">
          <Logo className="mb-10 lg:hidden" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Welcome to safer streets</p>
          <h2 className="mt-2 font-display text-4xl font-bold">{mode === "login" ? "Sign in" : "Create your account"}</h2>
          <p className="mt-3 text-[hsl(var(--muted-foreground))]">{mode === "login" ? "Vote on reports and save your vehicle settings." : "Join your neighbors in reporting current road conditions."}</p>
          <form onSubmit={authenticate} className="mt-8 space-y-4">
            <label className="block font-semibold">Email address<div className="relative mt-2"><Mail className="absolute left-4 top-3.5 h-5 w-5 text-[hsl(var(--muted-foreground))]" /><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-h-12 w-full rounded-xl border bg-[hsl(var(--card))] pl-12 pr-4 shadow-soft outline-none focus:border-cyan-600" /></div></label>
            <label className="block font-semibold">Password<div className="relative mt-2"><LockKeyhole className="absolute left-4 top-3.5 h-5 w-5 text-[hsl(var(--muted-foreground))]" /><input type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="min-h-12 w-full rounded-xl border bg-[hsl(var(--card))] pl-12 pr-12 shadow-soft outline-none focus:border-cyan-600" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-1 top-0 flex h-12 w-11 items-center justify-center">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></label>
            {mode === "login" && <div className="flex items-center justify-between text-sm"><label className="flex min-h-11 items-center gap-2 font-semibold"><button type="button" role="checkbox" aria-checked={remember} onClick={() => setRemember((value) => !value)} className={`flex h-5 w-5 items-center justify-center rounded border ${remember ? "border-cyan-700 bg-cyan-700 text-white" : "bg-transparent"}`}>{remember && <Check className="h-3.5 w-3.5" />}</button>Remember me</label><button type="button" onClick={resetPassword} className="min-h-11 font-bold text-cyan-700 dark:text-cyan-300">Forgot password?</button></div>}
            {status && <p role="status" className="rounded-xl bg-[hsl(var(--muted))] p-3 text-sm font-semibold">{status}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Please wait" : mode === "login" ? "Sign in securely" : "Create account"}<ArrowRight className="h-5 w-5" /></Button>
          </form>
          <p className="mt-5 text-center text-sm text-[hsl(var(--muted-foreground))]">{mode === "login" ? "New to Baha Tracker?" : "Already have an account?"} <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setStatus("") }} className="min-h-11 font-bold text-cyan-700 dark:text-cyan-300">{mode === "login" ? "Create account" : "Sign in"}</button></p>
        </div>
      </section>
    </main>
  )
}

function Feature({ icon: Icon, title, detail }: { icon: typeof Waves; title: string; detail: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"><Icon className="h-5 w-5 text-cyan-300" /><p className="mt-3 font-bold">{title}</p><p className="mt-1 text-sm opacity-60">{detail}</p></div>
}
