import { DepthLevel, VehicleType } from "@/lib/types"

export const philippinesBounds = {
  minimumLongitude: 116.8,
  maximumLongitude: 126.7,
  minimumLatitude: 4.5,
  maximumLatitude: 21.3
}

export const defaultMapFocus = {
  longitude: 120.9842,
  latitude: 14.5995,
  zoom: 13.2
}

export const depthOptions: Array<{ value: DepthLevel; label: string; hint: string }> = [
  { value: "ankle", label: "Ankle-deep", hint: "Around 10 cm" },
  { value: "knee", label: "Knee-deep", hint: "Around 50 cm" },
  { value: "waist", label: "Waist-deep", hint: "Around 100 cm" },
  { value: "above_waist", label: "Above waist", hint: "More than 100 cm" }
]

export const vehicleOptions: Array<{ value: VehicleType; label: string }> = [
  { value: "pedestrian", label: "Walking" },
  { value: "bicycle", label: "Bicycle" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "tricycle", label: "Tricycle" },
  { value: "jeepney", label: "Jeepney" },
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" }
]
