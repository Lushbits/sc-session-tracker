/**
 * Formats a number with thousands separators
 * @param value The number to format
 * @returns The formatted number as a string
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
} 