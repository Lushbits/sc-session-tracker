import { useState } from 'react'
import { Session } from '../../types'
import { CreateSessionDialog } from './CreateSessionDialog'
import { SessionListHeader } from './SessionListHeader'
import { SessionListTable } from './SessionListTable'
import { DeleteSessionDialog } from '../DeleteSessionDialog'
import { useCaptainLogs } from '../../hooks/useCaptainLogs'

interface SessionListProps {
  sessions: Session[]
  onCreateSession: (description: string, initialBalance: number) => void
  onViewSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => Promise<void>
  lastCompletedSessionBalance?: number
  hasActiveSession?: boolean
}

export function SessionList({
  sessions,
  onCreateSession,
  onViewSession,
  onDeleteSession,
  lastCompletedSessionBalance,
  hasActiveSession
}: SessionListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const { logs } = useCaptainLogs(sessionToDelete)

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
      <SessionListHeader 
        onCreateClick={() => setIsCreateDialogOpen(true)} 
        hasActiveSession={hasActiveSession}
      />
      <SessionListTable
        sessions={sessions}
        onViewSession={onViewSession}
        onDeleteSession={handleDeleteClick}
      />
      <CreateSessionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={onCreateSession}
        lastCompletedSessionBalance={lastCompletedSessionBalance}
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