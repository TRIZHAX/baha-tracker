"use client"

import { MapPin } from "lucide-react"
import { useState } from "react"
import Map, { Marker, NavigationControl as MapNavigationControl, Popup } from "react-map-gl/maplibre"
import type { SosAdminAlert } from "@/lib/types"
import { defaultMapFocus } from "@/lib/constants"

const mapStyle = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "OpenStreetMap contributors"
    }
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm", minzoom: 0, maxzoom: 19 }]
}

const statusLabel: Record<SosAdminAlert["status"], string> = {
  sent: "Sent",
  acknowledged: "Acknowledged",
  en_route: "En route",
  resolved: "Resolved"
}

export function AdminSosMap({ alerts }: { alerts: SosAdminAlert[] }) {
  const [selected, setSelected] = useState<SosAdminAlert | null>(null)
  const validAlerts = alerts.filter((alert) => Number.isFinite(alert.latitude) && Number.isFinite(alert.longitude))

  return (
    <div className="relative h-[420px] overflow-hidden rounded-3xl border bg-cyan-50 dark:bg-cyan-950 lg:h-[560px]">
      <Map initialViewState={defaultMapFocus} mapStyle={mapStyle} attributionControl={{ compact: true }}>
        <MapNavigationControl position="bottom-right" showCompass={false} />
        {validAlerts.map((alert) => (
          <Marker key={alert.id} longitude={alert.longitude} latitude={alert.latitude} anchor="center">
            <button
              type="button"
              aria-label={`Open SOS ${alert.id}`}
              onClick={() => setSelected(alert)}
              className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-red-600 text-white shadow-lg transition hover:scale-110 focus-visible:scale-110"
            >
              <MapPin className="h-5 w-5 fill-current" />
            </button>
          </Marker>
        ))}
        {selected && (
          <Popup
            longitude={selected.longitude}
            latitude={selected.latitude}
            anchor="bottom"
            closeButton
            closeOnClick={false}
            onClose={() => setSelected(null)}
          >
            <div className="min-w-[220px] space-y-2 p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <strong className="font-display text-base">SOS Alert</strong>
                <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-800">{statusLabel[selected.status]}</span>
              </div>
              <p><span className="font-semibold">Reporter:</span> {selected.reporter_email ?? "Unknown"}</p>
              <p><span className="font-semibold">Time:</span> {new Date(selected.created_at).toLocaleString()}</p>
              <p><span className="font-semibold">Coordinates:</span> {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}</p>
              <p><span className="font-semibold">Type:</span> {selected.emergency_types.join(", ")}</p>
              <p><span className="font-semibold">Accuracy:</span> {Number(selected.accuracy_meters).toFixed(0)} m</p>
            </div>
          </Popup>
        )}
      </Map>
      <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border bg-white/90 px-3 py-2 text-xs font-bold shadow-lg dark:bg-slate-950/90">
        {validAlerts.length} mapped SOS location{validAlerts.length === 1 ? "" : "s"}
      </div>
    </div>
  )
}
