"use client"

import { Crosshair, LocateFixed, Search, TriangleAlert } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import Map, { Layer, MapLayerMouseEvent, MapRef, Marker, NavigationControl, Source, type LayerProps } from "react-map-gl/maplibre"
import { Button } from "@/components/ui/button"
import { defaultMapFocus } from "@/lib/constants"
import { getPassability, statusPresentation } from "@/lib/passability"
import { FloodReport, VehicleType } from "@/lib/types"

const mapStyle = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png", "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png", "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "OpenStreetMap contributors"
    }
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm", minzoom: 0, maxzoom: 19 }]
}

const segmentLayer: LayerProps = {
  id: "flood-segments",
  type: "line",
  paint: {
    "line-color": ["get", "color"],
    "line-width": ["interpolate", ["linear"], ["zoom"], 10, 6, 16, 12],
    "line-opacity": ["get", "opacity"]
  },
  layout: {
    "line-cap": "round",
    "line-join": "round"
  }
}

const segmentHaloLayer: LayerProps = {
  id: "flood-segment-halo",
  type: "line",
  paint: {
    "line-color": "hsl(0 0% 100%)",
    "line-width": ["interpolate", ["linear"], ["zoom"], 10, 10, 16, 18],
    "line-opacity": 0.8
  },
  layout: {
    "line-cap": "round",
    "line-join": "round"
  }
}

export function FloodMap({ reports, vehicle, selectedReport, onSelectReport }: { reports: FloodReport[]; vehicle: VehicleType; selectedReport: FloodReport | null; onSelectReport: (report: FloodReport | null) => void }) {
  const mapReference = useRef<MapRef>(null)
  const [query, setQuery] = useState("")
  const [locationMessage, setLocationMessage] = useState("")
  const visibleReports = useMemo(() => query.trim() ? reports.filter((report) => `${report.streetName} ${report.barangay}`.toLowerCase().includes(query.toLowerCase())) : reports, [query, reports])
  const lineData = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: visibleReports.filter((report) => report.mode === "segment").map((report) => ({
      type: "Feature" as const,
      properties: { reportId: report.id, color: statusPresentation[getPassability(report.depthLevel, vehicle)].mapColor, opacity: report.verificationStatus === "unverified" ? 0.48 : 0.92 },
      geometry: { type: "LineString" as const, coordinates: report.coordinates }
    }))
  }), [vehicle, visibleReports])

  const findLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Location is not available on this device")
      return
    }
    setLocationMessage("Finding your location")
    navigator.geolocation.getCurrentPosition((position) => {
      mapReference.current?.flyTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 16, duration: 1000 })
      setLocationMessage("Map centered on your location")
    }, () => setLocationMessage("Allow location access to use Near Me"), { enableHighAccuracy: true, timeout: 8000 })
  }

  const handleMapClick = (event: MapLayerMouseEvent) => {
    const reportId = event.features?.[0]?.properties?.reportId as string | undefined
    if (reportId) onSelectReport(reports.find((report) => report.id === reportId) || null)
  }

  return (
    <div className="relative h-full min-h-[calc(100dvh-4rem)] overflow-hidden bg-cyan-100 lg:min-h-dvh">
      <Map ref={mapReference} initialViewState={defaultMapFocus} mapStyle={mapStyle} interactiveLayerIds={["flood-segments"]} onClick={handleMapClick} cursor="pointer" attributionControl={{ compact: true }}>
        <NavigationControl position="bottom-right" showCompass={false} />
        <Source id="flood-report-lines" type="geojson" data={lineData}>
          <Layer {...segmentHaloLayer} />
          <Layer {...segmentLayer} />
        </Source>
        {visibleReports.flatMap((report) => {
          const color = statusPresentation[getPassability(report.depthLevel, vehicle)].mapColor
          if (report.mode === "pin") return [<Marker key={`${report.id}-pin`} longitude={report.startPoint[0]} latitude={report.startPoint[1]} anchor="center" onClick={(event) => { event.originalEvent.stopPropagation(); onSelectReport(report) }}><button aria-label={`Open report on ${report.streetName}`} className="flex h-9 w-9 items-center justify-center rounded-full border-4 border-white text-sm font-black text-white shadow-float" style={{ backgroundColor: color }}><Crosshair className="h-4 w-4" /></button></Marker>]
          return [
            <Marker key={`${report.id}-start`} longitude={report.startPoint[0]} latitude={report.startPoint[1]} anchor="center"><button aria-label={`Start of flood on ${report.streetName}`} onClick={(event) => { event.stopPropagation(); onSelectReport(report) }} className="h-4 w-4 rounded-full border-[3px] border-white shadow-soft" style={{ backgroundColor: color }} /></Marker>,
            <Marker key={`${report.id}-end`} longitude={report.endPoint[0]} latitude={report.endPoint[1]} anchor="center"><button aria-label={`End of flood on ${report.streetName}`} onClick={(event) => { event.stopPropagation(); onSelectReport(report) }} className="h-4 w-4 rounded-full border-[3px] border-white shadow-soft" style={{ backgroundColor: color }} /></Marker>
          ]
        })}
      </Map>
      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start gap-2 sm:inset-x-auto sm:left-4 sm:top-4 sm:w-[min(470px,calc(100%-2rem))]">
        <label className="glass pointer-events-auto flex min-h-12 flex-1 items-center gap-3 rounded-2xl border px-4 shadow-float"><Search className="h-5 w-5 text-cyan-700" /><span className="sr-only">Search street or barangay</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search street or barangay" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-500" /></label>
        <Button className="pointer-events-auto shrink-0" variant="secondary" size="icon" aria-label="Center map near me" onClick={findLocation}><LocateFixed className="h-5 w-5" /></Button>
      </div>
      {locationMessage && <div className="glass absolute left-1/2 top-20 z-10 -translate-x-1/2 rounded-full border px-4 py-2 text-xs font-semibold shadow-soft">{locationMessage}</div>}
      {visibleReports.some((report) => getPassability(report.depthLevel, vehicle) === "blocked") && !selectedReport && <div className="glass absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-800 shadow-float sm:flex dark:border-red-900 dark:text-red-200"><TriangleAlert className="h-4 w-4" />Red segments are not passable for your vehicle</div>}
    </div>
  )
}
