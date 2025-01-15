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
    const totalEarnings = session.events
      .filter(event => event.type === 'earning')
      .reduce((sum, event) => sum + event.amount, 0)

    const totalSpend = session.events
      .filter(event => event.type === 'spending')
      .reduce((sum, event) => sum + event.amount, 0)

    const profit = totalEarnings - totalSpend
    const elapsed = ((session.endTime?.getTime() || new Date().getTime()) - session.startTime.getTime())
    const elapsedHours = elapsed / 3600000 // hours
    const profitPerHour = Math.round(profit / elapsedHours)

    const duration = intervalToDuration({ start: session.startTime, end: session.endTime || new Date() })
    const formattedDuration = formatDuration(duration, { format: ['hours', 'minutes'] })

    return {
      profit,
      profitPerHour,
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
          <TableHead className="text-right">Profit</TableHead>
          <TableHead className="text-right">Profit/Hour</TableHead>
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
                <span className={stats.profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {stats.profit >= 0 ? '+' : ''}{stats.profit.toLocaleString()} aUEC
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className={stats.profitPerHour >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {stats.profitPerHour >= 0 ? '+' : ''}{stats.profitPerHour.toLocaleString()} aUEC
                </span>
              </TableCell>
              <TableCell className="text-right font-mono">
                {stats.duration}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewSessionDetails(session)}
                  >
                    <SearchIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteSession(session.id)}
                    className="text-destructive hover:text-destructive"
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