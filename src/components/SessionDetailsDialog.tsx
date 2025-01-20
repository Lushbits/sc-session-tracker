import { useState, useEffect, useCallback, useRef } from 'react'
import { formatDistanceToNow, intervalToDuration } from 'date-fns'
import { Session } from '../types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { SessionEvent } from './SessionEvent'
import { SessionChart } from './SessionChart'
import { useCaptainLogs } from '../hooks/useCaptainLogs'
import { useSessionStats } from '../hooks/useSessionStats'
import { useChartData } from '../hooks/useChartData'
import { formatNumber } from '../utils/numberFormatting'
import { formatElapsedTime } from '../utils/timeFormatting'
import { formatLocalDateTime } from '../utils/dateFormatting'

const DEFAULT_SESSION: Session = {
  id: '',
  description: '',
  startTime: new Date(),
  endTime: undefined,
  initialBalance: 0,
  events: []
}

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
  const [elapsedTime, setElapsedTime] = useState(0)
  const [formattedDuration, setFormattedDuration] = useState('')
  const [hoveredEventTime, setHoveredEventTime] = useState<string | null>(null)
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  
  // Always call hooks at the top level with default values
  const { logs, isLoading } = useCaptainLogs(session?.id || null)
  const stats = useSessionStats(session || DEFAULT_SESSION, elapsedTime)
  const { chartData } = useChartData(session || DEFAULT_SESSION)

  // Direct check of viewport dimensions
  const checkScrollability = useCallback(() => {
    if (scrollViewportRef.current) {
      const viewport = scrollViewportRef.current
      const hasScroll = viewport.scrollHeight > viewport.clientHeight
      const isNotAtBottom = viewport.scrollTop < (viewport.scrollHeight - viewport.clientHeight - 10)
      setShowScrollIndicator(hasScroll && isNotAtBottom)
    }
  }, [])

  // Check scrollability on multiple triggers
  useEffect(() => {
    if (isOpen && scrollViewportRef.current) {
      // Reset scroll position
      scrollViewportRef.current.scrollTop = 0
      setShowScrollIndicator(false)

      // Series of checks at different intervals
      const checkTimes = [0, 100, 300, 500, 1000]
      const timeouts = checkTimes.map(time => 
        setTimeout(() => {
          if (scrollViewportRef.current) {
            checkScrollability()
          }
        }, time)
      )

      // Cleanup timeouts
      return () => timeouts.forEach(clearTimeout)
    }
  }, [isOpen, session?.id, checkScrollability])

  // Check when logs load
  useEffect(() => {
    if (!isLoading) {
      setTimeout(checkScrollability, 100)
    }
  }, [isLoading, checkScrollability])

  // Check when chart data changes
  useEffect(() => {
    if (chartData) {
      setTimeout(checkScrollability, 100)
    }
  }, [chartData, checkScrollability])

  // Check when images load
  useEffect(() => {
    if (logs?.length > 0) {
      const imageUrls = logs.flatMap(log => log.images.map(img => img.storage_path))
      if (imageUrls.length > 0) {
        const loadedImages = new Set<string>()
        
        const imageLoadListener = () => {
          checkScrollability()
        }

        imageUrls.forEach(url => {
          if (!loadedImages.has(url)) {
            const img = new Image()
            img.onload = imageLoadListener
            img.src = url
            loadedImages.add(url)
          }
        })
      }
    }
  }, [logs, checkScrollability])

  const handleScrollPositionChange = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    if (!hasScrolled && event.currentTarget.scrollTop > 0) {
      setHasScrolled(true)
    }
    checkScrollability()
  }, [checkScrollability, hasScrolled])

  // Reset hasScrolled when opening new session
  useEffect(() => {
    if (isOpen) {
      setHasScrolled(false)
    }
  }, [isOpen, session?.id])

  useEffect(() => {
    if (session) {
      const elapsed = session.endTime 
        ? session.endTime.getTime() - session.startTime.getTime()
        : new Date().getTime() - session.startTime.getTime()
      
      setElapsedTime(elapsed)

      const duration = intervalToDuration({ 
        start: session.startTime, 
        end: session.endTime || new Date() 
      })
      
      // Always show hours and minutes, even if they're 0
      const hours = duration.hours || 0
      const minutes = duration.minutes || 0
      setFormattedDuration(`${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`)
    }
  }, [session])

  if (!session || !isOpen) return null

  const currentBalance = session.events.length > 0 
    ? session.events[session.events.length - 1].type === 'balance' 
      ? session.events[session.events.length - 1].amount
      : session.initialBalance + stats.sessionProfit
    : session.initialBalance

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] bg-background/95 flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{session.description}</DialogTitle>
          <DialogDescription>
            Started {formatDistanceToNow(session.startTime, { addSuffix: true })}
            {session.endTime && ` • Ended ${formatDistanceToNow(session.endTime, { addSuffix: true })}`}
            {` • Duration: ${formattedDuration}`}
          </DialogDescription>
        </DialogHeader>
        {session.sessionLog && (
          <div className="mb-2">
            <p className="text-muted-foreground whitespace-pre-wrap">{session.sessionLog}</p>
          </div>
        )}
        <ScrollArea.Root className="flex-1 w-full overflow-hidden">
          <ScrollArea.Viewport 
            ref={scrollViewportRef}
            className="h-full w-full" 
            onScroll={handleScrollPositionChange}
          >
            <div className="pl-3 pr-3 space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-4xl font-medium">
                  {formatNumber(currentBalance)} aUEC
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total Earnings</div>
                    <div style={{ color: "hsl(var(--event-earning))" }}>
                      {formatNumber(stats.totalEarnings)} aUEC
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total Spend</div>
                    <div style={{ color: "hsl(var(--event-spending))" }}>
                      {formatNumber(stats.totalSpend)} aUEC
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Session Profit</div>
                    <div style={{ color: `hsl(var(${stats.sessionProfit >= 0 ? '--event-earning' : '--event-spending'}))` }}>
                      {stats.sessionProfit >= 0 ? '+' : ''}{formatNumber(stats.sessionProfit)} aUEC
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance History Section */}
              <div className="mt-8 mb-8">
                <div className="h-[400px]">
                  <SessionChart
                    chartData={chartData}
                    hoveredEventTime={hoveredEventTime}
                    onHover={setHoveredEventTime}
                    formatTime={(timestamp) => formatElapsedTime(timestamp, session.startTime)}
                    profitPerHour={stats.profitPerHour}
                  />
                </div>
              </div>

              {/* Session Events List */}
              <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-800">
                {session.events.slice().reverse().map((event, index) => {
                  const balance = session.events
                    .slice(0, session.events.length - index)
                    .reduce((acc, e) => {
                      if (e.type === 'balance') return e.amount
                      if (e.type === 'earning') return acc + e.amount
                      if (e.type === 'spending') return acc - e.amount
                      return acc
                    }, session.initialBalance)

                  const prevBalance = index === session.events.length - 1 
                    ? session.initialBalance 
                    : session.events
                        .slice(0, session.events.length - index - 1)
                        .reduce((acc, e) => {
                          if (e.type === 'balance') return e.amount
                          if (e.type === 'earning') return acc + e.amount
                          if (e.type === 'spending') return acc - e.amount
                          return acc
                        }, session.initialBalance)

                  return (
                    <SessionEvent
                      key={`${event.timestamp.getTime()}-${index}`}
                      event={event}
                      prevBalance={prevBalance}
                      runningBalance={balance}
                      isHighlighted={hoveredEventTime === event.timestamp.getTime().toString()}
                      onHover={setHoveredEventTime}
                      startTime={session.startTime}
                    />
                  )
                })}
                <SessionEvent
                  event={{
                    timestamp: session.startTime,
                    type: 'session_start',
                    amount: session.initialBalance,
                    description: 'Starting balance'
                  }}
                  prevBalance={session.initialBalance}
                  runningBalance={session.initialBalance}
                  isHighlighted={hoveredEventTime === session.startTime.getTime().toString()}
                  onHover={setHoveredEventTime}
                  startTime={session.startTime}
                />
              </div>

              {/* Captain's Logs Section */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-2">Captain's Logs</h3>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading logs...</p>
                ) : logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No logs recorded for this session.</p>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-[#1a1b1e] rounded-lg overflow-hidden"
                      >
                        {log.images.length > 0 && (
                          <a
                            href={log.images[0].storage_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full"
                          >
                            <img
                              src={log.images[0].storage_path}
                              alt="Log attachment"
                              className="w-full h-auto object-cover aspect-[16/10] hover:opacity-90 transition-opacity"
                            />
                          </a>
                        )}
                        <div className="p-4">
                          <div className="text-sm text-muted-foreground mb-2">
                            {formatLocalDateTime(new Date(log.created_at))}
                          </div>
                          <p className="whitespace-pre-wrap">{log.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar 
            className="flex select-none touch-none p-0.5 bg-background/5 transition-colors duration-150 ease-out hover:bg-background/10 data-[orientation=vertical]:w-2 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2" 
            orientation="vertical"
          >
            <ScrollArea.Thumb className="flex-1 bg-border rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
          </ScrollArea.Scrollbar>
          {showScrollIndicator && (
            <div 
              className={`
                absolute bottom-2 right-4 px-2 py-1 
                bg-background/80 text-xs text-muted-foreground 
                rounded backdrop-blur-sm
                ${!hasScrolled ? 'animate-bounce' : ''}
              `}
            >
              Scroll down for more
            </div>
          )}
        </ScrollArea.Root>
      </DialogContent>
    </Dialog>
  )
} 