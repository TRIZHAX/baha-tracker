"use client"

import { Bike, Bus, CarFront, Footprints, Gauge, Truck } from "lucide-react"
import { vehicleOptions } from "@/lib/constants"
import { VehicleType } from "@/lib/types"
import { cn } from "@/lib/utils"

const icons = {
  pedestrian: Footprints,
  bicycle: Bike,
  motorcycle: Gauge,
  tricycle: CarFront,
  jeepney: Bus,
  sedan: CarFront,
  suv: Truck
}

export function VehicleSelector({ value, onChange, compact = false }: { value: VehicleType; onChange: (value: VehicleType) => void; compact?: boolean }) {
  return (
    <div className={cn("glass rounded-2xl border p-2 shadow-float", compact ? "w-full" : "w-[min(540px,calc(100vw-2rem))]")}>
      <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))]">Show roads safe for</p>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {vehicleOptions.map((vehicle) => {
          const Icon = icons[vehicle.value]
          return <button key={vehicle.value} aria-pressed={value === vehicle.value} onClick={() => onChange(vehicle.value)} className={cn("flex min-h-12 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-bold transition", value === vehicle.value ? "bg-[hsl(var(--navy))] text-[hsl(var(--background))] dark:bg-cyan-400 dark:text-slate-950" : "hover:bg-[hsl(var(--muted))]")}><Icon className="h-4 w-4" />{vehicle.label}</button>
        })}
      </div>
    </div>
  )
}
