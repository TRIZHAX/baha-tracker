export type Coordinate = [number, number]

export type DepthLevel = "ankle" | "knee" | "waist" | "above_waist"

export type VehicleType = "pedestrian" | "bicycle" | "motorcycle" | "tricycle" | "jeepney" | "sedan" | "suv"

export type PassabilityStatus = "passable" | "caution" | "blocked"

export type VerificationStatus = "verified" | "unverified" | "hidden" | "expired"

export type FloodReport = {
  id: string
  userId: string | null
  coordinates: Coordinate[]
  startPoint: Coordinate
  endPoint: Coordinate
  lengthMeters: number
  depthLevel: DepthLevel
  photoUrl: string | null
  note: string | null
  streetName: string
  barangay: string
  createdAt: string
  expiresAt: string
  verificationStatus: VerificationStatus
  upvotes: number
  downvotes: number
  mode: "segment" | "pin"
}

export type SosStatus = "sent" | "acknowledged" | "en_route" | "resolved"

export type SosType = "stranded" | "medical" | "supplies"

export type MapFocus = {
  longitude: number
  latitude: number
  zoom: number
}
