"use client"

import { Button } from "@/components/ui/button"

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center p-6"><section className="max-w-md rounded-2xl border bg-[hsl(var(--card))] p-8 text-center shadow-float"><p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">Connection interrupted</p><h1 className="mt-3 font-display text-3xl font-bold">The map needs a fresh start</h1><p className="mt-3 text-[hsl(var(--muted-foreground))]">Your safety data remains protected. Try loading the latest reports again.</p><Button className="mt-6 w-full" onClick={reset}>Reload map</Button></section></main>
}
