import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const formatRelativeTime = (dateValue: string) => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(dateValue).getTime()) / 60000))
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  return `${hours} hr${hours === 1 ? "" : "s"} ago`
}
