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


export type AdminReport = {
  id: string
  user_id: string | null
  reporter_name: string | null
  reporter_email: string | null
  length_meters: number
  depth_level: DepthLevel
  photo_url: string | null
  note: string | null
  street_name: string
  barangay: string
  report_mode: "segment" | "pin"
  created_at: string
  updated_at: string
  expires_at: string
  verification_status: VerificationStatus
  upvotes: number
  downvotes: number
  start_latitude: number
  start_longitude: number
  end_latitude: number
  end_longitude: number
}

export type SosAdminAlert = {
  id: string
  user_id: string | null
  reporter_name: string | null
  reporter_email: string | null
  latitude: number
  longitude: number
  accuracy_meters: number
  emergency_types: SosType[]
  status: SosStatus
  created_at: string
  acknowledged_at: string | null
  updated_at: string
}
