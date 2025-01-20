import { format, formatDistanceToNow, Locale } from 'date-fns'
import { enUS } from 'date-fns/locale'

// Get user's locale from browser
const USER_LOCALE = navigator.language || 'en-US'

// Default locale - can be extended to support more locales
const DEFAULT_LOCALE = enUS

// Time formats
export const TIME_FORMATS = {
  SHORT: 'h:mm a',           // 3:45 PM
  LONG: 'h:mm:ss a',        // 3:45:30 PM
  MILITARY: 'HH:mm:ss',     // 15:45:30
} as const

// Date formats
export const DATE_FORMATS = {
  SHORT: 'M/d/yyyy',        // 1/19/2024
  LONG: 'MMMM d, yyyy',     // January 19, 2024
  WITH_DAY: 'EEE, MMM d',   // Fri, Jan 19
  FULL: 'EEEE, MMMM d, yyyy', // Friday, January 19, 2024
} as const

// Combined date and time formats
export const DATETIME_FORMATS = {
  SHORT: `${DATE_FORMATS.SHORT} ${TIME_FORMATS.SHORT}`,       // 1/19/2024 3:45 PM
  LONG: `${DATE_FORMATS.LONG} ${TIME_FORMATS.LONG}`,         // January 19, 2024 3:45:30 PM
  LOG_ENTRY: `${DATE_FORMATS.WITH_DAY} ${TIME_FORMATS.SHORT}`, // Fri, Jan 19 3:45 PM
} as const

interface FormatOptions {
  locale?: Locale
  includeSeconds?: boolean
  relative?: boolean
}

/**
 * Format a date using the user's locale preferences
 */
export function formatLocalDateTime(date: Date) {
  return new Intl.DateTimeFormat(USER_LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: USER_LOCALE.startsWith('en'), // Use 24-hour time for non-English locales
  }).format(date)
}

/**
 * Format a date in a short format using the user's locale preferences
 */
export function formatLocalDate(date: Date) {
  return new Intl.DateTimeFormat(USER_LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * Format a time using the user's locale preferences
 */
export function formatLocalTime(date: Date) {
  return new Intl.DateTimeFormat(USER_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: USER_LOCALE.startsWith('en'), // Use 24-hour time for non-English locales
  }).format(date)
}

/**
 * Formats a date for log entries with smart relative time
 * Recent entries (< 24h) show relative time
 * Older entries show the full date in user's locale
 */
export function formatLogDate(date: Date) {
  const now = new Date()
  const isToday = now.getDate() === date.getDate() && 
                  now.getMonth() === date.getMonth() && 
                  now.getFullYear() === date.getFullYear()
  const isYesterday = new Date(now.setDate(now.getDate() - 1)).getDate() === date.getDate()
  
  if (isToday) {
    return formatLocalTime(date)
  }
  
  if (isYesterday) {
    return `Yesterday, ${formatLocalTime(date)}`
  }
  
  return formatLocalDateTime(date)
}

/**
 * Formats a timestamp for display in the UI
 */
export function formatTimestamp(date: Date, options: FormatOptions = {}) {
  if (options.relative) {
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: options.locale || DEFAULT_LOCALE
    })
  }

  const formatString = options.includeSeconds ? TIME_FORMATS.LONG : TIME_FORMATS.SHORT
  return format(date, formatString, { locale: options.locale || DEFAULT_LOCALE })
}

/**
 * Formats a date for display in the UI
 */
export function formatDate(date: Date, options: FormatOptions = {}) {
  if (options.relative) {
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: options.locale || DEFAULT_LOCALE
    })
  }

  return format(date, DATE_FORMATS.LONG, { locale: options.locale || DEFAULT_LOCALE })
}

/**
 * Formats a full datetime for display in the UI
 */
export function formatDateTime(date: Date, options: FormatOptions = {}) {
  if (options.relative) {
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: options.locale || DEFAULT_LOCALE
    })
  }

  const formatString = options.includeSeconds ? DATETIME_FORMATS.LONG : DATETIME_FORMATS.SHORT
  return format(date, formatString, { locale: options.locale || DEFAULT_LOCALE })
} 