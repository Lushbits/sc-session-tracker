import { Event } from '../App'

function formatElapsedTime(eventTime: Date, startTime: Date): string {
  const elapsedMs = eventTime.getTime() - startTime.getTime()
  const elapsedSecs = Math.floor(elapsedMs / 1000)
  
  const hours = Math.floor(elapsedSecs / 3600)
  const minutes = Math.floor((elapsedSecs % 3600) / 60)
  const seconds = elapsedSecs % 60
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

interface SessionEventProps {
  event: Event
  runningBalance: number
  isHighlighted: boolean
  onHover: (time: string | null) => void
  startTime: Date
}

export function SessionEvent({ event, runningBalance, isHighlighted, onHover, startTime }: SessionEventProps) {
  const elapsedTime = formatElapsedTime(event.timestamp, startTime)

  const renderEventContent = () => {
    switch (event.type) {
      case 'session_start':
        return (
          <div className="flex items-center">
            <span className="text-white">Starting balance: {event.amount.toLocaleString()} aUEC</span>
          </div>
        )
      case 'session_end':
        return (
          <div className="flex items-center">
            <span className="text-white">Ending balance: {event.amount.toLocaleString()} aUEC</span>
          </div>
        )
      case 'earning':
        return (
          <div className="flex items-center space-x-1">
            <span className="text-green-500">Earned</span>
            <span className="text-green-500">{(event.amount - runningBalance).toLocaleString()}</span>
            <span className="text-green-500">aUEC</span>
            {event.description && (
              <span className="text-gray-400">from {event.description}</span>
            )}
          </div>
        )
      case 'spending':
        return (
          <div className="flex items-center space-x-1">
            <span className="text-red-500">Spent</span>
            <span className="text-red-500">{(runningBalance - event.amount).toLocaleString()}</span>
            <span className="text-red-500">aUEC</span>
            {event.description && (
              <span className="text-gray-400">on {event.description}</span>
            )}
          </div>
        )
      case 'balance':
        const difference = event.amount - runningBalance
        return (
          <div className="flex items-center space-x-1">
            <span className="text-cyan-500">Balance adjusted to {event.amount.toLocaleString()} aUEC</span>
            {difference !== 0 && (
              <span>
                <span>(</span>
                <span className={difference > 0 ? 'text-green-500' : 'text-red-500'}>
                  {difference > 0 ? '+' : '-'}{Math.abs(difference).toLocaleString()} aUEC
                </span>
                <span>)</span>
              </span>
            )}
          </div>
        )
    }
  }

  return (
    <div 
      className={`flex justify-between items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
        isHighlighted ? 'bg-gray-100 dark:bg-gray-800' : ''
      }`}
      onMouseEnter={() => onHover(event.timestamp.getTime().toString())}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-center">
        <span className="text-gray-400 w-20">{elapsedTime}</span>
        {renderEventContent()}
      </div>
      <div className="flex items-center text-gray-400">
        <span>{event.amount.toLocaleString()}</span>
        <span className="ml-1">aUEC</span>
      </div>
    </div>
  )
} 