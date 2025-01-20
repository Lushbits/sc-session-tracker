import { Session } from '../types'

interface SessionStats {
  totalEarnings: number
  totalSpend: number
  sessionProfit: number
  profitPerHour: number
  duration: number
}

export function useSessionStats(session: Session, duration: number): SessionStats {
  const totalEarnings = session.events
    .filter(event => event.type === 'earning')
    .reduce((sum, event) => sum + event.amount, 0)

  const totalSpend = session.events
    .filter(event => event.type === 'spending')
    .reduce((sum, event) => sum + event.amount, 0)

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