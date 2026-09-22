"use client"

import { Crosshair, LocateFixed, MapPin, Route } from "lucide-react"
import { useEffect, useMemo, useRef } from "react"
import Map, { Layer, MapRef, Marker, Source, type LayerProps } from "react-map-gl/maplibre"
import { Button } from "@/components/ui/button"
import { defaultMapFocus } from "@/lib/constants"
import { Coordinate } from "@/lib/types"

const mapStyle = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["/api/map/tiles/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "OpenStreetMap contributors"
    }
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }]
}

const previewLayer: LayerProps = {
  id: "report-preview",
  type: "line",
  paint: { "line-color": "hsl(190 84% 36%)", "line-width": 8, "line-opacity": 0.9 },
  layout: { "line-cap": "round", "line-join": "round" }
}

export function ReportMapPicker({ start, end, routeCoordinates, activePoint, onMapPoint, onUseLocation, locationReady }: { start: Coordinate | null; end: Coordinate | null; routeCoordinates: Coordinate[]; activePoint: "start" | "end"; onMapPoint: (coordinate: Coordinate) => void; onUseLocation: () => void; locationReady: boolean }) {
  const mapReference = useRef<MapRef>(null)
  const lineData = useMemo(() => ({ type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: routeCoordinates } }), [routeCoordinates])

  useEffect(() => {
    if (start) mapReference.current?.flyTo({ center: start, zoom: 16, duration: 800 })
  }, [start])

  return (
    <div className="relative h-[360px] overflow-hidden rounded-3xl border shadow-soft lg:h-[calc(100dvh-8rem)]">
      <Map ref={mapReference} initialViewState={{ ...defaultMapFocus, zoom: 14 }} mapStyle={mapStyle} onClick={(event) => onMapPoint([event.lngLat.lng, event.lngLat.lat])} cursor="crosshair">
        {routeCoordinates.length >= 2 && <Source id="preview-source" type="geojson" data={lineData}><Layer {...previewLayer} /></Source>}
        {start && <Marker longitude={start[0]} latitude={start[1]} anchor="bottom"><div className="flex flex-col items-center"><span className="rounded-full bg-emerald-700 px-2 py-1 text-xs font-black text-white shadow-soft">START</span><MapPin className="h-8 w-8 fill-emerald-700 text-white drop-shadow" /></div></Marker>}
        {end && <Marker longitude={end[0]} latitude={end[1]} anchor="bottom"><div className="flex flex-col items-center"><span className="rounded-full bg-red-600 px-2 py-1 text-xs font-black text-white shadow-soft">END</span><MapPin className="h-8 w-8 fill-red-600 text-white drop-shadow" /></div></Marker>}
      </Map>
      <div className="glass absolute left-3 top-3 max-w-[calc(100%-6rem)] rounded-2xl border px-4 py-3 text-sm font-bold shadow-soft"><span className="flex items-center gap-2"><Crosshair className="h-4 w-4 text-cyan-700" />Tap the map to set flood {activePoint}</span></div>
      <Button variant="secondary" className="absolute bottom-3 left-3" onClick={onUseLocation}><LocateFixed className="h-5 w-5" />{locationReady ? `Use location for ${activePoint}` : "Allow location"}</Button>
      {routeCoordinates.length >= 2 && <div className="glass absolute bottom-3 right-3 hidden items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold shadow-soft sm:flex"><Route className="h-4 w-4 text-cyan-700" />Road-aligned preview</div>}
    </div>
  )
}
