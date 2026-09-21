import { z } from "zod"
import { philippinesBounds } from "@/lib/constants"

const coordinateSchema = z.tuple([
  z.number().min(philippinesBounds.minimumLongitude).max(philippinesBounds.maximumLongitude),
  z.number().min(philippinesBounds.minimumLatitude).max(philippinesBounds.maximumLatitude)
])

export const reportSchema = z.object({
  coordinates: z.array(coordinateSchema).length(2),
  startPoint: coordinateSchema,
  endPoint: coordinateSchema,
  lengthMeters: z.number().min(0).max(2000),
  depthLevel: z.enum(["ankle", "knee", "waist", "above_waist"]),
  photoUrl: z.string().url().max(1000).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
  streetName: z.string().trim().min(2).max(120),
  barangay: z.string().trim().min(2).max(120),
  mode: z.enum(["segment", "pin"]),
  reporterLocation: coordinateSchema,
  accuracyMeters: z.number().min(0).max(5000)
}).superRefine((value, context) => {
  if (value.mode === "segment" && value.coordinates.length < 2) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "A segment needs start and end coordinates", path: ["coordinates"] })
  }
  if (value.mode === "segment" && value.lengthMeters < 5) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Flood segments must be at least 5 meters", path: ["lengthMeters"] })
  }
})

export const voteSchema = z.object({
  reportId: z.string().uuid(),
  vote: z.union([z.literal(1), z.literal(-1)])
})

export const sosSchema = z.object({
  location: coordinateSchema,
  accuracyMeters: z.number().min(0).max(5000),
  emergencyTypes: z.array(z.enum(["stranded", "medical", "supplies"])).min(1).max(3)
})

export const authSchema = z.object({
  action: z.enum(["login", "signup", "reset"]),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128).optional(),
  remember: z.boolean().optional()
}).superRefine((value, context) => {
  if (value.action !== "reset" && !value.password) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Password is required", path: ["password"] })
  }
})
