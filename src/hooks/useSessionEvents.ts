import { useCallback, useMemo } from 'react'
import { Session, Event } from '../App'

interface UseSessionEventsReturn {
  currentBalance: number
  handleAddEvent: (type: Event['type'], amount: number, description?: string) => void
  handleUpdateBalance: (newBalance: number) => void
}

export function useSessionEvents(
  session: Session,
  onUpdateSession: (session: Session) => void
): UseSessionEventsReturn {
  // Calculate current balance based on all events
  const currentBalance = useMemo(() => {
    let balance = session.initialBalance
    const sortedEvents = [...session.events].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    
    for (const event of sortedEvents) {
      switch (event.type) {
        case 'earning':
          balance += event.amount
          break
        case 'spending':
          balance -= event.amount
          break
        case 'balance':
          balance = event.amount
          break
        // session_start and session_end don't affect the balance
      }
    }
    return balance
  }, [session.events, session.initialBalance])

  // Handler for adding new events
  const handleAddEvent = useCallback((type: Event['type'], amount: number, description?: string) => {
    const newEvent: Event = {
      timestamp: new Date(),
      amount,
      type,
      description
    }

    onUpdateSession({
      ...session,
      events: [...session.events, newEvent]
    })
  }, [session, onUpdateSession])

  // Handler for direct balance updates
  const handleUpdateBalance = useCallback((newBalance: number) => {
    const newEvent: Event = {
      timestamp: new Date(),
      amount: newBalance,
      type: 'balance'
    }

    onUpdateSession({
      ...session,
      events: [...session.events, newEvent]
    })
  }, [session, onUpdateSession])

  return {
    currentBalance,
    handleAddEvent,
    handleUpdateBalance
  }
} 