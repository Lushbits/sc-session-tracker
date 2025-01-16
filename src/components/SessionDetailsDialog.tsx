import { Session } from '../App'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { SessionChart } from './SessionChart'
import { SessionStats } from './SessionStats'
import { SessionEventList } from './SessionEventList'
import { useSessionStats } from '../hooks/useSessionStats'
import { useChartData } from '../hooks/useChartData'
import { formatShortTime } from '../utils/timeFormatting'
import { formatDistanceToNow, formatDuration, intervalToDuration } from 'date-fns'

interface SessionDetailsDialogProps {
  session: Session | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function SessionDetailsDialog({
  session,
  isOpen,
  onOpenChange
}: SessionDetailsDialogProps) {
  if (!session) return null

  console.log('Session in details dialog:', session)
  console.log('Session log:', session.sessionLog)

  const elapsedTime = session.endTime 
    ? session.endTime.getTime() - session.startTime.getTime()
    : new Date().getTime() - session.startTime.getTime()

  const stats = useSessionStats(session, elapsedTime)
  const { chartData, hoveredEventTime, setHoveredEventTime } = useChartData(session)

  const duration = intervalToDuration({ 
    start: session.startTime, 
    end: session.endTime || new Date() 
  })
  const formattedDuration = formatDuration(duration, { format: ['hours', 'minutes'] })

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <div>
              <span className="mr-2">{session.description}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {formatDistanceToNow(session.startTime)} ago
                {session.endTime && ' • Completed'}
              </span>
            </div>
            <span className="text-sm font-normal text-muted-foreground">
              Duration: {formattedDuration}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <SessionStats
            currentBalance={session.events[session.events.length - 1]?.amount || session.initialBalance}
            stats={stats}
            hideUpdateBalance
          />

          {session.sessionLog && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Session Summary</h3>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap rounded-md bg-muted/50 p-4">
                {session.sessionLog}
              </div>
            </div>
          )}

          <SessionChart
            chartData={chartData}
            hoveredEventTime={hoveredEventTime}
            onHover={setHoveredEventTime}
            formatTime={(timestamp) => formatShortTime(timestamp, session.startTime)}
            profitPerHour={stats.profitPerHour}
          />

          <SessionEventList
            events={session.events}
            startTime={session.startTime}
            initialBalance={session.initialBalance}
            hoveredEventTime={hoveredEventTime}
            onHover={setHoveredEventTime}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 