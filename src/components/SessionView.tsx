import { useState, useCallback } from 'react'
import { Session } from '../App'
import { SessionHeader } from './SessionHeader'
import { SessionStats } from './SessionStats'
import { SessionChart } from './SessionChart'
import { SessionEventList } from './SessionEventList'
import { SessionDialogs } from './SessionDialogs'
import { useTimer } from '../hooks/useTimer'
import { EndSessionDialog } from './EndSessionDialog'
import { useSessionEvents } from '../hooks/useSessionEvents'
import { useSessionStats } from '../hooks/useSessionStats'
import { useChartData } from '../hooks/useChartData'
import { formatShortTime } from '../utils/timeFormatting'

interface SessionViewProps {
  session: Session
  onEndSession: () => void
  onUpdateSession: (session: Session) => void
}

/**
 * Main component for displaying and managing an active session.
 * Handles session timing, event tracking, and coordinates between child components.
 */
export default function SessionView({ session, onEndSession, onUpdateSession }: SessionViewProps) {
  // Use custom hooks for session management
  const { isPaused, pause, resume, formattedTime, elapsedTime } = useTimer(
    session.startTime,
    Boolean(session.endTime)
  )

  const { currentBalance, handleAddEvent, handleUpdateBalance } = useSessionEvents(session, onUpdateSession)
  const stats = useSessionStats(session, elapsedTime)
  const { chartData, hoveredEventTime, setHoveredEventTime } = useChartData(session)

  // Dialog visibility states
  const [showSpendDialog, setShowSpendDialog] = useState(false)
  const [showEarningDialog, setShowEarningDialog] = useState(false)
  const [showBalanceDialog, setShowBalanceDialog] = useState(false)
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false)

  // Memoized handlers
  const handleUpdateDescription = useCallback((description: string) => {
    onUpdateSession({ ...session, description })
  }, [session, onUpdateSession])

  const handleEndSession = useCallback(() => {
    setShowEndSessionDialog(true)
  }, [])

  return (
    <div className="min-h-screen text-foreground p-6 font-['Space_Grotesk']">
      <div className="max-w-7xl mx-auto space-y-4">
        <SessionHeader
          elapsedTime={formattedTime}
          isPaused={isPaused}
          description={session.description}
          onPause={pause}
          onResume={resume}
          onEndSession={handleEndSession}
          onUpdateDescription={handleUpdateDescription}
        />

        <SessionStats
          currentBalance={currentBalance}
          stats={stats}
          onUpdateBalance={() => setShowBalanceDialog(true)}
        />

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

        <SessionDialogs
          currentBalance={currentBalance}
          showSpendDialog={showSpendDialog}
          showEarningDialog={showEarningDialog}
          showBalanceDialog={showBalanceDialog}
          onAddEvent={handleAddEvent}
          onSpendDialogChange={setShowSpendDialog}
          onEarningDialogChange={setShowEarningDialog}
          onBalanceDialogChange={setShowBalanceDialog}
          onUpdateBalance={handleUpdateBalance}
        />

        <EndSessionDialog
          currentBalance={currentBalance}
          isOpen={showEndSessionDialog}
          onOpenChange={setShowEndSessionDialog}
          onEndSession={onEndSession}
          onAddEvent={handleAddEvent}
          onUpdateBalance={handleUpdateBalance}
        />
      </div>
    </div>
  )
}