import { useState, useMemo, useEffect } from 'react'
import { Session } from '../types'
import { Button } from './ui/button'
import { Search, Trash2 } from 'lucide-react'
import { formatNumber } from '../utils/numberFormatting'
import { useSessionStats } from '../hooks/useSessionStats'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog'
import { Input } from './ui/input'
import { SessionDetailsDialog } from './SessionDetailsDialog'
import { DeleteSessionDialog } from './DeleteSessionDialog'
import { useCaptainLogs } from '../hooks/useCaptainLogs'
import { formatTimeAgo } from '../utils/timeFormatting'
import { formatLocalDateTime } from '../utils/dateFormatting'
import { numberUtils } from '../utils/numberHandling'

interface SessionListProps {
  sessions: Session[]
  onDeleteSession: (sessionId: string) => void
  onCreateSession: (description: string, initialBalance: number) => void
  lastCompletedSessionBalance?: number
}

export default function SessionList({ sessions, onDeleteSession, onCreateSession, lastCompletedSessionBalance }: SessionListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [initialBalance, setInitialBalance] = useState(lastCompletedSessionBalance || 0)

  // Get logs for the session being deleted
  const { logs } = useCaptainLogs(sessionToDelete)

  useEffect(() => {
    if (isDialogOpen) {
      setInitialBalance(lastCompletedSessionBalance || 0)
    }
  }, [isDialogOpen, lastCompletedSessionBalance])

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
          stats,
          duration: { hours, minutes }
        }
      })
  }, [sessions])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateSession(description, initialBalance)
    setDescription('')
    setInitialBalance(0)
    setIsDialogOpen(false)
  }

  const handleViewDetails = (session: Session) => {
    setSelectedSession(session)
    setIsDetailsDialogOpen(true)
  }

  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId)
  }

  const handleDeleteConfirm = async () => {
    if (sessionToDelete) {
      try {
        await onDeleteSession(sessionToDelete)
        setSessionToDelete(null)
      } catch (error) {
        console.error('Failed to delete session:', error)
        throw error
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold">Previous Sessions</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground shadow hover:bg-primary/90">Start New Session</Button>
          </DialogTrigger>
          <DialogContent className="bg-background/95 border">
            <DialogHeader>
              <DialogTitle>Start New Session</DialogTitle>
              <DialogDescription>
                Enter the session details to start tracking your earnings.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Activity Description
                </label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Mining, Trading, Bounty Hunting"
                  className="border-primary/20 focus:border-primary bg-background/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="initialBalance" className="text-sm font-medium">
                  Initial Balance (aUEC)
                </label>
                <Input
                  id="initialBalance"
                  type="text"
                  value={numberUtils.formatDisplayNumber(initialBalance)}
                  onChange={(e) => {
                    const value = numberUtils.parseDisplayNumber(e.target.value)
                    setInitialBalance(value)
                  }}
                  className="border-primary/20 focus:border-primary bg-background/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  variant="default"
                  disabled={!description.trim()}
                >
                  Start Session
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-2 px-4 text-xs font-normal text-muted-foreground">Session</th>
              <th className="text-right py-2 px-4 text-xs font-normal text-muted-foreground">Earnings</th>
              <th className="text-right py-2 px-4 text-xs font-normal text-muted-foreground">Spend</th>
              <th className="text-right py-2 px-4 text-xs font-normal text-muted-foreground">Profit</th>
              <th className="text-right py-2 px-4 text-xs font-normal text-muted-foreground">Duration</th>
              <th className="text-right py-2 px-4 text-xs font-normal text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessionStats.map(({ session, stats, duration }) => (
              <tr key={session.id} className="hover:bg-white/5 border-t border-white/5">
                <td className="py-5 px-4">
                  <div className="text-sm">{session.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatTimeAgo(session.startTime)} • {formatLocalDateTime(session.startTime)} • Completed
                  </div>
                </td>
                <td className="py-5 px-4 text-right whitespace-nowrap">
                  <span className="event-earning text-sm">
                    {stats.totalEarnings > 0 ? `+${formatNumber(stats.totalEarnings)} aUEC` : '+0 aUEC'}
                  </span>
                </td>
                <td className="py-5 px-4 text-right whitespace-nowrap">
                  <span className="event-spending text-sm">
                    {stats.totalSpend > 0 ? `-${formatNumber(stats.totalSpend)} aUEC` : '-0 aUEC'}
                  </span>
                </td>
                <td className="py-5 px-4 text-right whitespace-nowrap">
                  <span className={`${stats.sessionProfit >= 0 ? 'event-earning' : 'event-spending'} text-sm`}>
                    {stats.sessionProfit > 0 ? '+' : ''}{formatNumber(stats.sessionProfit)} aUEC
                  </span>
                </td>
                <td className="py-5 px-4 text-right whitespace-nowrap text-muted-foreground text-sm">
                  {duration.hours} hours {duration.minutes} minutes
                </td>
                <td className="py-5 px-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => handleViewDetails(session)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => handleDeleteClick(session.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SessionDetailsDialog
        session={selectedSession}
        isOpen={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />

      <DeleteSessionDialog
        sessionId={sessionToDelete}
        isOpen={!!sessionToDelete}
        onOpenChange={(open) => !open && setSessionToDelete(null)}
        onConfirmDelete={handleDeleteConfirm}
        logCount={logs.length}
      />
    </div>
  )
} 