import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 

export function formatDurationHours(
  totalHours: number | null | undefined,
  options?: { showSecondsUnderOneHour?: boolean }
): string {
  if (totalHours === null || totalHours === undefined || Number.isNaN(totalHours)) {
    return '-'
  }

  const showSecondsUnderOneHour = options?.showSecondsUnderOneHour ?? true

  // Convert hours (possibly fractional) to whole seconds for stable formatting
  const totalSeconds = Math.max(0, Math.round(totalHours * 3600))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours >= 1) {
    const hourLabel = hours === 1 ? 'hr' : 'hrs'
    return `${hours} ${hourLabel} ${minutes} min`
  }

  if (showSecondsUnderOneHour) {
    return `${minutes} min ${seconds} sec`
  }

  return `${minutes} min`
}