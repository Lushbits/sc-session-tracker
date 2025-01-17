import { formatDistanceToNow, formatDuration, intervalToDuration } from 'date-fns'
import { Session } from '../App'
import { Button } from './ui/button'
import { Trash2Icon, SearchIcon } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"

interface SessionListProps {
  sessions: Session[]
  onDeleteSession: (sessionId: string) => void
  onViewSessionDetails: (session: Session) => void
}

export default function SessionList({ sessions, onDeleteSession, onViewSessionDetails }: SessionListProps) {
  const getSessionStats = (session: Session) => {
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
        lastBalance += event.amount
      } else if (event.type === 'spending') {
        totalSpend += event.amount
        lastBalance -= event.amount
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

    const profit = totalEarnings - totalSpend
    const duration = intervalToDuration({ start: session.startTime, end: session.endTime || new Date() })
    const formattedDuration = formatDuration(duration, { format: ['hours', 'minutes'] })

    return {
      totalEarnings,
      totalSpend,
      profit,
      duration: formattedDuration || 'Less than a minute'
    }
  }

  // Sort sessions by start time (newest first)
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No sessions recorded yet. Start a new session to begin tracking.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Session</TableHead>
          <TableHead className="text-right">Earnings</TableHead>
          <TableHead className="text-right">Spend</TableHead>
          <TableHead className="text-right">Profit</TableHead>
          <TableHead className="text-right">Duration</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedSessions.map(session => {
          const stats = getSessionStats(session)
          return (
            <TableRow key={session.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{session.description}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(session.startTime)} ago
                    {session.endTime && ' • Completed'}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span className="event-earning">
                  +{stats.totalEarnings.toLocaleString()} aUEC
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="event-spending">
                  -{stats.totalSpend.toLocaleString()} aUEC
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className={stats.profit >= 0 ? 'event-earning' : 'event-spending'}>
                  {stats.profit >= 0 ? '+' : ''}{stats.profit.toLocaleString()} aUEC
                </span>
              </TableCell>
              <TableCell className="text-right">
                {stats.duration}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewSessionDetails(session)}
                    className="session-view-button"
                  >
                    <SearchIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteSession(session.id)}
                    className="session-delete-button"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
} 