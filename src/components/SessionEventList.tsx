import { SessionEvent } from '../types'
import { SessionEvent as SessionEventComponent } from './SessionEvent'
import { useState } from 'react'

interface SessionEventListProps {
  events: SessionEvent[]
  startTime: Date
  initialBalance: number
  hoveredEventTime: string | null
  onHover: (time: string | null) => void
}

export function SessionEventList({ events, startTime, initialBalance, hoveredEventTime, onHover }: SessionEventListProps) {
  const [localHoveredEventTime, setLocalHoveredEventTime] = useState<string | null>(null)

  // Create initial balance event
  const initialEvent: SessionEvent = {
    timestamp: startTime,
    type: 'session_start',
    amount: initialBalance,
    description: 'Starting balance'
  }

  // Sort events chronologically (oldest first) for balance calculation
  const sortedEvents = [initialEvent, ...events].sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  )

  // Calculate running balance for each event according to the prompt specifications
  const getBalancesForEvent = (events: SessionEvent[], targetIndex: number): { prevBalance: number, currentBalance: number } => {
    let balance = initialBalance
    
    // Calculate balance before the event
    for (let i = 0; i < targetIndex; i++) {
      const event = events[i]
      if (event.type === 'earning') {
        balance += event.amount
      } else if (event.type === 'spending') {
        balance -= event.amount
      } else if (event.type === 'balance') {
        balance = event.amount
      }
    }
    
    const prevBalance = balance
    
    // Apply the current event
    const currentEvent = events[targetIndex]
    if (currentEvent.type === 'earning') {
      balance += currentEvent.amount
    } else if (currentEvent.type === 'spending') {
      balance -= currentEvent.amount
    } else if (currentEvent.type === 'balance') {
      balance = currentEvent.amount
    }
    
    return { prevBalance, currentBalance: balance }
  }

  // Reverse events for display (newest first)
  const displayEvents = [...sortedEvents].reverse()

  return (
    <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-800">
      {displayEvents.map((event, index) => {
        const eventIndex = sortedEvents.length - 1 - index
        const { prevBalance, currentBalance } = getBalancesForEvent(sortedEvents, eventIndex)
        return (
          <SessionEventComponent
            key={`${event.timestamp.getTime()}-${index}`}
            event={event}
            prevBalance={prevBalance}
            runningBalance={currentBalance}
            isHighlighted={hoveredEventTime === event.timestamp.getTime().toString() || localHoveredEventTime === event.timestamp.getTime().toString()}
            onHover={(time) => {
              setLocalHoveredEventTime(time)
              onHover(time)
            }}
            startTime={startTime}
          />
        )
      })}
    </div>
  )
} 