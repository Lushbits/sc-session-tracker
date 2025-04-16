import { useState, useMemo } from 'react'
import { Session } from '../../types'
import { CreateSessionDialog } from './CreateSessionDialog'
import { SessionListHeader } from './SessionListHeader'
import { SessionListTable } from './SessionListTable'
import { DeleteSessionDialog } from '../DeleteSessionDialog'
import { useCaptainLogs } from '../../hooks/useCaptainLogs'
import { SessionPagination } from './SessionPagination'
import { UserSessionStats } from './UserSessionStats'

interface SessionListProps {
  sessions: Session[]
  onCreateSession: (description: string, initialBalance: number) => void
  onViewSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => Promise<void>
  lastCompletedSessionBalance?: number
  hasActiveSession?: boolean
}

// Number of sessions to show per page
const ITEMS_PER_PAGE = 10

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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  
  // Sort and paginate sessions
  const sortedAndPaginatedSessions = useMemo(() => {
    // Sort sessions by start time, newest first
    const sortedSessions = [...sessions].sort((a, b) => {
      const aTime = new Date(a.startTime).getTime()
      const bTime = new Date(b.startTime).getTime()
      return bTime - aTime // Descending order (newest first)
    })
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return sortedSessions.slice(startIndex, endIndex)
  }, [sessions, currentPage])
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(sessions.length / ITEMS_PER_PAGE))
  
  // Reset to page 1 if we change to having fewer pages than current
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of table when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      <SessionListHeader 
        onCreateClick={() => setIsCreateDialogOpen(true)} 
        hasActiveSession={hasActiveSession}
      />

      {/* Render the overall stats component */}
      <UserSessionStats sessions={sessions} />

      <SessionListTable
        sessions={sortedAndPaginatedSessions}
        onViewSession={onViewSession}
        onDeleteSession={handleDeleteClick}
      />
      
      {/* Show session count and pagination */}
      <div className="mt-6 flex flex-col sm:flex-row sm:justify-between items-center">
        <div className="text-sm text-muted-foreground mb-4 sm:mb-0">
          Showing {sortedAndPaginatedSessions.length} of {sessions.length} sessions
        </div>
        <SessionPagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
      
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