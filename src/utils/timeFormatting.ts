/**
 * Formats a timestamp relative to a session start time.
 * Returns time in HH:MM:SS format.
 */
export function formatElapsedTime(timestamp: Date, startTime: Date): string {
  const elapsedMs = timestamp.getTime() - startTime.getTime()
  const elapsedSecs = Math.floor(elapsedMs / 1000)
  
  const hours = Math.floor(elapsedSecs / 3600)
  const minutes = Math.floor((elapsedSecs % 3600) / 60)
  const seconds = elapsedSecs % 60
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Formats a timestamp relative to a session start time.
 * Returns time in MM:SS format.
 */
export function formatShortTime(timestamp: Date, startTime: Date): string {
  const elapsed = timestamp.getTime() - startTime.getTime()
  const minutes = Math.floor(elapsed / 60000)
  const seconds = Math.floor((elapsed % 60000) / 1000)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Formats seconds into HH:MM or MM:SS format depending on duration.
 */
export function formatSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return hours > 0 
    ? `${hours}:${remainingMinutes.toString().padStart(2, '0')}`
    : `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
} 