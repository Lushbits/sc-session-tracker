import { Event } from '../App'
import { SessionEvent } from './SessionEvent'
import { useState } from 'react'

interface SessionEventListProps {
  events: Event[]
  startTime: Date
  initialBalance: number
  hoveredEventTime: string | null
  onHover: (time: string | null) => void
}

export function SessionEventList({ events, startTime, initialBalance, hoveredEventTime, onHover }: SessionEventListProps) {
  const [localHoveredEventTime, setLocalHoveredEventTime] = useState<string | null>(null)

  // Create initial balance event
  const initialEvent: Event = {
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
  const getBalanceAtEvent = (events: Event[], targetIndex: number): number => {
    // For the target event, we want the balance AFTER this event
    // This helps us show the correct running balance
    let balance = initialBalance
    
    // Process events from oldest to target (inclusive)
    // We're calculating the balance up to and including the target event
    for (let i = 0; i <= targetIndex; i++) {
      const event = events[i]
      
      if (event.type === 'earning') {
        balance += event.amount
      } else if (event.type === 'spending') {
        balance -= event.amount
      } else if (event.type === 'balance') {
        balance = event.amount
      }
      // session_start and session_end don't affect the balance
    }
    
    return balance
  }

  // Reverse events for display (newest first)
  const displayEvents = [...sortedEvents].reverse()

  return (
    <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-800">
      {displayEvents.map((event, index) => (
        <SessionEvent
          key={`${event.timestamp.getTime()}-${index}`}
          event={event}
          runningBalance={getBalanceAtEvent(sortedEvents, sortedEvents.length - 1 - index)}
          isHighlighted={hoveredEventTime === event.timestamp.getTime().toString() || localHoveredEventTime === event.timestamp.getTime().toString()}
          onHover={(time) => {
            setLocalHoveredEventTime(time)
            onHover(time)
          }}
          startTime={startTime}
        />
      ))}
    </div>
  )
} 