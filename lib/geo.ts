import { Coordinate } from "@/lib/types"

const earthRadiusMeters = 6371000

const toRadians = (degrees: number) => degrees * Math.PI / 180

export const distanceBetween = (start: Coordinate, end: Coordinate) => {
  const latitudeDelta = toRadians(end[1] - start[1])
  const longitudeDelta = toRadians(end[0] - start[0])
  const startLatitude = toRadians(start[1])
  const endLatitude = toRadians(end[1])
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2
  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const pathLength = (coordinates: Coordinate[]) => coordinates.slice(1).reduce((total, coordinate, index) => total + distanceBetween(coordinates[index], coordinate), 0)

export const formatDistance = (meters: number) => meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`

export const reduceCoordinatePrecision = (coordinate: Coordinate): Coordinate => [Number(coordinate[0].toFixed(5)), Number(coordinate[1].toFixed(5))]
