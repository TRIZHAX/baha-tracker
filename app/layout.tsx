import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "maplibre-gl/dist/maplibre-gl.css"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"

export const metadata: Metadata = {
  title: "Baha Tracker",
  description: "Real-time community flood depth and vehicle passability in the Philippines",
  manifest: "/manifest.json",
  applicationName: "Baha Tracker",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Baha Tracker" }
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "hsl(42 45% 97%)" },
    { media: "(prefers-color-scheme: dark)", color: "hsl(205 48% 8%)" }
  ]
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
          <ServiceWorkerRegistration />
          {process.env.VERCEL && <Analytics />}
          {process.env.VERCEL && <SpeedInsights />}
        </ThemeProvider>
      </body>
    </html>
  )
}
