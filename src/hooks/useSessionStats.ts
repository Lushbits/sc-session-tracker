import { useMemo } from 'react'
import { Session } from '../App'

interface SessionStats {
  totalEarnings: number
  totalSpend: number
  sessionProfit: number
  profitPerHour: number
}

export function useSessionStats(
  session: Session,
  elapsedTime: number
): SessionStats {
  return useMemo(() => {
    let totalEarnings = 0
    let totalSpend = 0
    let lastBalance = session.initialBalance

    // Sort events chronologically
    const sortedEvents = [...session.events].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    for (const event of sortedEvents) {
      if (event.type === 'earning') {
        totalEarnings += event.amount
      } else if (event.type === 'spending') {
        totalSpend += event.amount
      } else if (event.type === 'balance') {
        // Calculate difference from last balance and add to appropriate total
        const difference = event.amount - lastBalance
        if (difference > 0) {
          totalEarnings += difference
        } else if (difference < 0) {
          totalSpend += Math.abs(difference)
        }
        lastBalance = event.amount
      }
    }

    const sessionProfit = totalEarnings - totalSpend
    const hours = Math.max(elapsedTime / 3600000, 0.001) // Convert ms to hours, avoid division by zero
    const profitPerHour = Math.round(sessionProfit / hours)

    return {
      totalEarnings,
      totalSpend,
      sessionProfit,
      profitPerHour
    }
  }, [session.events, session.initialBalance, elapsedTime])
} 