import { Session } from '../types'

interface SessionStats {
  totalEarnings: number
  totalSpend: number
  sessionProfit: number
  profitPerHour: number
  duration: number
}

export function useSessionStats(session: Session, duration: number): SessionStats {
  // Calculate totals including balance adjustments
  let runningBalance = session.initialBalance
  let totalEarnings = 0
  let totalSpend = 0

  // Sort events chronologically
  const sortedEvents = [...session.events].sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  )

  for (const event of sortedEvents) {
    switch (event.type) {
      case 'earning':
        totalEarnings += event.amount
        runningBalance += event.amount
        break
      case 'spending':
        totalSpend += event.amount
        runningBalance -= event.amount
        break
      case 'balance':
        // Calculate difference from previous balance
        const difference = event.amount - runningBalance
        if (difference > 0) {
          totalEarnings += difference
        } else if (difference < 0) {
          totalSpend += Math.abs(difference)
        }
        runningBalance = event.amount
        break
    }
  }

  const sessionProfit = totalEarnings - totalSpend
  const profitPerHour = duration > 0
    ? (sessionProfit / duration) * (1000 * 60 * 60)
    : 0

  return {
    totalEarnings,
    totalSpend,
    sessionProfit,
    profitPerHour,
    duration
  }
} 