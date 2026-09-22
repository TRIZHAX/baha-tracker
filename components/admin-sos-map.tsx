"use client"

import { useMemo, useRef, useState } from "react"
import Map, { Marker, NavigationControl, Popup, type MapRef } from "react-map-gl/maplibre"
import { LocateFixed, MapPin } from "lucide-react"

type SosLocation = {
  id: string
  user_id: string | null
  longitude: number
  latitude: number
  accuracy_meters: number | null
  emergency_types: string[]
  status: string
  created_at: string
}

const mapStyle = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution: "OpenStreetMap contributors"
    }
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm", minzoom: 0, maxzoom: 19 }]
}

export function AdminSosMap({ alerts }: { alerts: SosLocation[] }) {
  const mapRef = useRef<MapRef>(null)
  const [selected, setSelected] = useState<SosLocation | null>(null)

  const initial = useMemo(() => {
    if (alerts.length) return { longitude: alerts[0].longitude, latitude: alerts[0].latitude, zoom: 11 }
    return { longitude: 120.9842, latitude: 14.5995, zoom: 10 }
  }, [alerts])

  const focusAll = () => {
    if (!alerts.length) return
    const lngs = alerts.map(a => a.longitude)
    const lats = alerts.map(a => a.latitude)
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
    const minLat = Math.min(...lats), maxLat = Math.max(...lats)
    if (minLng === maxLng && minLat === maxLat) {
      mapRef.current?.flyTo({ center: [minLng, minLat], zoom: 16, duration: 700 })
      return
    }
    mapRef.current?.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 70, duration: 700, maxZoom: 15 })
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border">
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-xl border bg-white/90 px-3 py-2 text-xs font-bold shadow dark:bg-slate-950/90">
        <MapPin className="h-4 w-4 text-red-600" /> {alerts.length} SOS location{alerts.length === 1 ? "" : "s"}
      </div>
      <button onClick={focusAll} disabled={!alerts.length} className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-xl border bg-white/90 px-3 py-2 text-xs font-bold shadow disabled:opacity-40 dark:bg-slate-950/90">
        <LocateFixed className="h-4 w-4" /> Show all
      </button>
      <Map ref={mapRef} initialViewState={initial} mapStyle={mapStyle} style={{ height: 430, width: "100%" }} attributionControl={{ compact: true }}>
        <NavigationControl position="bottom-right" showCompass={false} />
        {alerts.map(alert => (
          <Marker key={alert.id} longitude={alert.longitude} latitude={alert.latitude} anchor="center" onClick={(event) => { event.originalEvent.stopPropagation(); setSelected(alert) }}>
            <button aria-label="View SOS location" className="flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-red-600 text-white shadow-lg hover:scale-110">
              <MapPin className="h-4 w-4" />
            </button>
          </Marker>
        ))}
        {selected && (
          <Popup longitude={selected.longitude} latitude={selected.latitude} anchor="top" onClose={() => setSelected(null)} closeOnClick={false}>
            <div className="min-w-52 space-y-1 p-1 text-xs">
              <p className="font-bold text-red-700">Emergency SOS</p>
              <p><strong>Type:</strong> {selected.emergency_types.join(", ") || "Emergency"}</p>
              <p><strong>Status:</strong> {selected.status}</p>
              <p><strong>Accuracy:</strong> {selected.accuracy_meters ?? "—"} m</p>
              <p><strong>Coordinates:</strong> {selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}</p>
              <p><strong>Time:</strong> {new Date(selected.created_at).toLocaleString()}</p>
              <a className="mt-2 inline-block font-bold text-cyan-700 underline" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=17/${selected.latitude}/${selected.longitude}`}>
                Open location
              </a>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
