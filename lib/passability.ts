import { DepthLevel, PassabilityStatus, VehicleType } from "@/lib/types"

const allVehicles: VehicleType[] = ["pedestrian", "bicycle", "motorcycle", "tricycle", "jeepney", "sedan", "suv"]

const createUniformStatuses = (status: PassabilityStatus) => Object.fromEntries(allVehicles.map((vehicle) => [vehicle, status])) as Record<VehicleType, PassabilityStatus>

export const passabilityMatrix: Record<DepthLevel, Record<VehicleType, PassabilityStatus>> = {
  ankle: createUniformStatuses("passable"),
  knee: {
    pedestrian: "caution",
    bicycle: "caution",
    motorcycle: "caution",
    tricycle: "passable",
    jeepney: "passable",
    sedan: "caution",
    suv: "passable"
  },
  waist: {
    pedestrian: "blocked",
    bicycle: "blocked",
    motorcycle: "blocked",
    tricycle: "blocked",
    jeepney: "blocked",
    sedan: "blocked",
    suv: "caution"
  },
  above_waist: createUniformStatuses("blocked")
}

export const statusPresentation: Record<PassabilityStatus, { label: string; color: string; mapColor: string; symbol: string }> = {
  passable: { label: "Passable", color: "text-emerald-700 dark:text-emerald-300", mapColor: "hsl(158 78% 34%)", symbol: "✓" },
  caution: { label: "Use caution", color: "text-amber-700 dark:text-amber-300", mapColor: "hsl(42 94% 48%)", symbol: "!" },
  blocked: { label: "Not passable", color: "text-red-700 dark:text-red-300", mapColor: "hsl(1 76% 52%)", symbol: "×" }
}

export const getPassability = (depth: DepthLevel, vehicle: VehicleType) => passabilityMatrix[depth][vehicle]
