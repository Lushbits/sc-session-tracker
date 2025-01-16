import { Event } from '../App'
import { Card, CardContent } from '../components/ui/card'
import { formatElapsedTime } from '../utils/timeFormatting'

interface SessionEventProps {
  event: Event
  runningBalance: number
  prevBalance: number
  isHighlighted: boolean
  onHover: (time: string | null) => void
  startTime: Date
}

export function SessionEvent({ event, runningBalance, prevBalance, isHighlighted, onHover, startTime }: SessionEventProps) {
  const elapsedTime = formatElapsedTime(event.timestamp, startTime)

  const renderEventContent = () => {
    switch (event.type) {
      case 'session_start':
        return (
          <div className="flex items-center space-x-1">
            <span className="event-starting-balance">Starting balance: <span className="font-bold">{event.amount.toLocaleString()} aUEC</span></span>
          </div>
        )
      case 'session_end':
        return (
          <div className="flex items-center space-x-1">
            <span className="event-starting-balance">Ending balance: <span className="font-bold">{event.amount.toLocaleString()} aUEC</span></span>
          </div>
        )
      case 'earning':
        return (
          <div className="flex items-center space-x-1">
            <span className="event-earning">Earned <span className="font-bold">{event.amount.toLocaleString()} aUEC</span></span>
            {event.description && (
              <>
                <span className="text-muted-foreground">from</span>
                <span className="text-muted-foreground">{event.description}</span>
              </>
            )}
          </div>
        )
      case 'spending':
        return (
          <div className="flex items-center space-x-1">
            <span className="event-spending">Spent <span className="font-bold">{event.amount.toLocaleString()} aUEC</span></span>
            {event.description && (
              <>
                <span className="text-muted-foreground">on</span>
                <span className="text-muted-foreground">{event.description}</span>
              </>
            )}
          </div>
        )
      case 'balance':
        const difference = event.amount - prevBalance
        return (
          <div className="flex items-center space-x-1">
            <span className="event-balance-adjust">Balance adjusted to <span className="font-bold">{event.amount.toLocaleString()} aUEC</span></span>
            <span>
              <span>(</span>
              <span className={difference > 0 ? 'event-earning' : 'event-spending'}>
                <span className="font-bold">{difference > 0 ? '+' : '-'}{Math.abs(difference).toLocaleString()} aUEC</span>
              </span>
              <span>)</span>
            </span>
          </div>
        )
    }
  }

  return (
    <Card 
      className={`border-0 ${isHighlighted ? 'bg-muted' : 'hover:bg-muted/50'} transition-colors`}
      onMouseEnter={() => onHover(event.timestamp.getTime().toString())}
      onMouseLeave={() => onHover(null)}
    >
      <CardContent className="flex justify-between items-center p-2">
        <div className="flex items-center">
          <span className="text-muted-foreground w-20">{elapsedTime}</span>
          {renderEventContent()}
        </div>
        <div className="flex items-center text-muted-foreground">
          <span className="font-bold">{runningBalance.toLocaleString()}</span>
          <span className="ml-1">aUEC</span>
        </div>
      </CardContent>
    </Card>
  )
} 