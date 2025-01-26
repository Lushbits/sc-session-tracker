import { Session } from '../../types'
import { SessionTableRow } from './SessionTableRow'
import { useMemo } from 'react'
import { useSessionStats } from '../../hooks/useSessionStats'

interface SessionListTableProps {
  sessions: Session[]
  onViewSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
}

export function SessionListTable({ sessions, onViewSession, onDeleteSession }: SessionListTableProps) {
  const sessionStats = useMemo(() => {
    return sessions
      .filter(s => s.endTime)
      .map(session => {
        const duration = session.endTime 
          ? Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()))
          : 0
        const stats = useSessionStats(session, duration)
        const durationInMinutes = Math.floor(duration / (1000 * 60))
        const hours = Math.floor(durationInMinutes / 60)
        const minutes = durationInMinutes % 60

        return {
          session,
          stats: {
            ...stats,
            duration: { hours, minutes }
          }
        }
      })
  }, [sessions])

  return (
    <div className="space-y-4">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left text-xs text-muted-foreground font-normal py-2 px-4">Session</th>
            <th className="text-right text-xs text-muted-foreground font-normal py-2 px-4">Earnings</th>
            <th className="text-right text-xs text-muted-foreground font-normal py-2 px-4">Spend</th>
            <th className="text-right text-xs text-muted-foreground font-normal py-2 px-4">Profit</th>
            <th className="text-right text-xs text-muted-foreground font-normal py-2 px-4">Duration</th>
            <th className="text-right text-xs text-muted-foreground font-normal py-2 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessionStats.map(({ session, stats }) => (
            <SessionTableRow
              key={session.id}
              session={session}
              stats={stats}
              onView={() => onViewSession(session.id)}
              onDelete={() => onDeleteSession(session.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
} 