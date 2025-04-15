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

  // If there are no sessions, show a helpful message
  if (sessions.length === 0) {
    return (
      <div className="text-center p-8 border border-white/5 rounded-md bg-black/20">
        <p className="text-muted-foreground">No sessions found. Create a new session to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr>
            <th className="text-left text-xs text-muted-foreground font-normal py-2 px-4">Session</th>
            <th className="text-right text-xs text-muted-foreground font-normal py-2 px-4">Start Balance</th>
            <th className="text-right text-xs text-muted-foreground font-normal py-2 px-4">Profit</th>
            <th className="text-right text-xs text-muted-foreground font-normal py-2 px-4">End Balance</th>
            <th className="text-right text-xs text-muted-foreground font-normal py-2 px-4">Duration</th>
            <th className="text-right text-xs text-muted-foreground font-normal py-2 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessionStats.length > 0 ? (
            sessionStats.map(({ session, stats }) => (
              <SessionTableRow
                key={session.id}
                session={session}
                stats={stats}
                onView={() => onViewSession(session.id)}
                onDelete={() => onDeleteSession(session.id)}
              />
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-8 text-muted-foreground">
                No completed sessions found. 
                {sessions.some(s => !s.endTime) && " You have active sessions that aren't shown here."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
} 