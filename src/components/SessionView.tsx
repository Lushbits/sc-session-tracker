import { useState, useCallback } from 'react'
import { Session } from '../types'
import { SessionHeader } from './SessionHeader'
import { SessionChart } from './SessionChart'
import { SessionEventList } from './SessionEventList'
import { SessionDialogs } from './SessionDialogs'
import { CaptainLogs } from './CaptainLogs'
import { useTimer } from '../hooks/useTimer'
import { EndSessionDialog } from './EndSessionDialog'
import { useSessionEvents } from '../hooks/useSessionEvents'
import { useSessionStats } from '../hooks/useSessionStats'
import { useChartData } from '../hooks/useChartData'
import { formatElapsedTime } from '../utils/timeFormatting'
import { formatNumber } from '../utils/numberFormatting'
import { RefreshCcw, ScrollText } from "lucide-react"
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet'

interface SessionViewProps {
  session: Session
  onEndSession: (sessionId: string, sessionLog?: string) => void
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
  const [showCaptainLogs, setShowCaptainLogs] = useState(false)

  // Memoized handlers
  const handleUpdateDescription = useCallback((description: string) => {
    onUpdateSession({ ...session, description })
  }, [session, onUpdateSession])

  const handleEndSession = useCallback(() => {
    setShowEndSessionDialog(true)
  }, [])

  const handleEndSessionConfirm = useCallback((sessionLog?: string) => {
    onEndSession(session.id, sessionLog)
  }, [session.id, onEndSession])

  const handleBalanceUpdate = useCallback(() => {
    setShowBalanceDialog(true)
  }, [])

  return (
    <div className="min-h-[70vh] text-foreground p-4 font-['Space_Grotesk']">
      <div className="max-w-7xl mx-auto space-y-3">
        <SessionHeader
          elapsedTime={formattedTime}
          isPaused={isPaused}
          description={session.description}
          onPause={pause}
          onResume={resume}
          onEndSession={handleEndSession}
          onUpdateDescription={handleUpdateDescription}
        />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-4xl font-medium tracking-tight">{formatNumber(currentBalance)} aUEC</span>
                <Button
                  size="sm"
                  className="h-8 px-2 text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/30 hover:shadow-[0_0_15px_hsla(var(--primary)/0.2)] transition-all"
                  onClick={handleBalanceUpdate}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Update Balance
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-2 text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/30 hover:shadow-[0_0_15px_hsla(var(--primary)/0.2)] transition-all"
                  onClick={() => setShowCaptainLogs(true)}
                >
                  <ScrollText className="h-4 w-4 mr-2" />
                  Captain's Log
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-4">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total Earnings</div>
                  <div className="font-medium" style={{ color: "hsl(var(--event-earning))" }}>
                    {formatNumber(stats.totalEarnings)} aUEC
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total Spend</div>
                  <div className="font-medium" style={{ color: "hsl(var(--event-spending))" }}>
                    {formatNumber(stats.totalSpend)} aUEC
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Session Profit</div>
                  <div 
                    className="font-medium"
                    style={{ 
                      color: `hsl(var(${stats.sessionProfit >= 0 ? '--event-earning' : '--event-spending'}))`
                    }}
                  >
                    {formatNumber(stats.sessionProfit)} aUEC
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SessionChart
            chartData={chartData}
            hoveredEventTime={hoveredEventTime}
            onHover={setHoveredEventTime}
            formatTime={(timestamp) => formatElapsedTime(timestamp, session.startTime)}
            profitPerHour={stats.profitPerHour}
          />

          <SessionEventList
            events={session.events}
            startTime={session.startTime}
            initialBalance={session.initialBalance}
            hoveredEventTime={hoveredEventTime}
            onHover={setHoveredEventTime}
          />

          <Sheet open={showCaptainLogs} onOpenChange={setShowCaptainLogs}>
            <SheetContent side="right" className="w-[600px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Captain's Log</SheetTitle>
                <SheetDescription>
                  Record your thoughts and experiences during this session.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <CaptainLogs sessionId={session.id} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <SessionDialogs
          currentBalance={currentBalance}
          showSpendDialog={showSpendDialog}
          showEarningDialog={showEarningDialog}
          showBalanceDialog={showBalanceDialog}
          onAddEvent={handleAddEvent}
          onUpdateBalance={handleUpdateBalance}
          onSpendDialogChange={setShowSpendDialog}
          onEarningDialogChange={setShowEarningDialog}
          onBalanceDialogChange={setShowBalanceDialog}
        />

        <EndSessionDialog
          currentBalance={currentBalance}
          isOpen={showEndSessionDialog}
          onOpenChange={setShowEndSessionDialog}
          onEndSession={handleEndSessionConfirm}
          onAddEvent={handleAddEvent}
        />
      </div>
    </div>
  )
} 