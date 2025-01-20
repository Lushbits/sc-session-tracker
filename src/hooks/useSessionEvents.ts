import { useCallback, useMemo } from 'react'
import { Session, SessionEvent } from '../types'

interface UseSessionEventsReturn {
  currentBalance: number
  handleAddEvent: (type: SessionEvent['type'], amount: number, description?: string) => void
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
  const handleAddEvent = useCallback((type: SessionEvent['type'], amount: number, description?: string) => {
    const newEvent: SessionEvent = {
      timestamp: new Date(),
      amount,
      type,
      description: description || 'No description'
    }

    onUpdateSession({
      ...session,
      events: [...session.events, newEvent]
    })
  }, [session, onUpdateSession])

  // Handler for direct balance updates
  const handleUpdateBalance = useCallback((newBalance: number) => {
    const newEvent: SessionEvent = {
      timestamp: new Date(),
      amount: newBalance,
      type: 'balance',
      description: 'Balance updated'
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