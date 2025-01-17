import { useState, useEffect } from 'react'
import { ThemeProvider } from './components/theme-provider'
import { Button } from './components/ui/button'
import { useTheme } from './components/theme-provider'
import { Moon, Sun } from 'lucide-react'
import SessionView from './components/SessionView'
import SessionList from './components/SessionList'
import StartSessionModal from './components/StartSessionModal'
import { SessionDetailsDialog } from './components/SessionDetailsDialog'
import { useDatabase } from './hooks/useDatabase'
import { useAuth } from './contexts/AuthContext'
import { LoginForm } from './components/auth/LoginForm'
import { Footer } from './components/Footer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog"
import activeSessionImg from './assets/images/activesession.png'
import historySessionImg from './assets/images/historysession.png'
import updateBalanceImg from './assets/images/updatebalance.png'
import newSessionImg from './assets/images/newsessiondialogue.png'

export interface Session {
  id: string
  description: string
  startTime: Date
  endTime?: Date
  initialBalance: number
  events: Event[]
  sessionLog?: string
}

export type Event = {
  timestamp: Date
  amount: number
  type: 'earning' | 'spending' | 'balance' | 'session_start' | 'session_end'
  description?: string
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme("light")}
        className={theme === "light" ? "bg-accent" : ""}
      >
        <Sun className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme("dark")}
        className={theme === "dark" ? "bg-accent" : ""}
      >
        <Moon className="h-5 w-5" />
      </Button>
    </div>
  )
}

function App() {
  const { user, signOut } = useAuth()
  const { fetchSessions, createSession, updateSession, deleteSession, addEvent } = useDatabase()
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    // Initialize from localStorage if available
    return localStorage.getItem('activeSessionId')
  })
  const [isStartModalOpen, setIsStartModalOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Update localStorage when activeSessionId changes
    if (activeSessionId) {
      localStorage.setItem('activeSessionId', activeSessionId)
    } else {
      localStorage.removeItem('activeSessionId')
    }
  }, [activeSessionId])

  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user])

  const loadSessions = async () => {
    try {
      const data = await fetchSessions()
      setSessions(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load sessions')
    }
  }

  // Helper function to get active session
  const getActiveSession = () => {
    if (!activeSessionId) return null
    return sessions.find(s => s.id === activeSessionId)
  }

  const handleStartSession = async (description: string, initialBalance: number) => {
    try {
      const sessionId = await createSession({
        description,
        startTime: new Date(),
        initialBalance
      })
      await loadSessions()
      setActiveSessionId(sessionId)
      setIsStartModalOpen(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create session')
    }
  }

  const handleEndSession = async (sessionLog?: string) => {
    const activeSession = getActiveSession()
    if (activeSession) {
      try {
        // First update the session
        const updatedSession = {
          ...activeSession,
          endTime: new Date(),
          sessionLog: sessionLog === '' ? undefined : sessionLog
        }
        await updateSession(updatedSession)
        // Then reload sessions and clear active session
        await loadSessions()
        setActiveSessionId(null)  // This will also clear localStorage
      } catch (error) {
        console.error('Error ending session:', error)
        setError(error instanceof Error ? error.message : 'Failed to end session')
        throw error // Re-throw to propagate to the dialog
      }
    }
  }

  const handleDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId)
  }

  const confirmDeleteSession = async () => {
    if (sessionToDelete) {
      try {
        await deleteSession(sessionToDelete)
        await loadSessions()
        if (sessionToDelete === activeSessionId) {
          setActiveSessionId(null)
        }
        setSessionToDelete(null)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to delete session')
      }
    }
  }

  const handleViewSessionDetails = (session: Session) => {
    setSelectedSession(session)
  }

  const handleUpdateSession = async (updatedSession: Session) => {
    try {
      // First update the session details
      await updateSession(updatedSession)

      // Then check if we need to add a new event
      const existingSession = sessions.find(s => s.id === updatedSession.id)
      if (existingSession && updatedSession.events.length > existingSession.events.length) {
        // Get the latest event that was added
        const latestEvent = updatedSession.events[updatedSession.events.length - 1]
        // Add the event to the database
        await addEvent(updatedSession.id, latestEvent)
      }

      // Finally reload the sessions to get the updated state
      await loadSessions()
    } catch (error) {
      console.error('Failed to update session:', error)
      setError(error instanceof Error ? error.message : 'Failed to update session')
      throw error // Re-throw to propagate to the dialog
    }
  }

  const activeSession = getActiveSession()

  const getLastCompletedSessionBalance = () => {
    const completedSessions = sessions.filter(s => s.endTime)
    if (completedSessions.length === 0) return undefined
    
    // Sort by end time, newest first
    const sortedSessions = completedSessions.sort((a, b) => 
      new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime()
    )
    
    // Get the last balance from the most recent session
    const lastSession = sortedSessions[0]
    const sortedEvents = [...lastSession.events].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    
    return sortedEvents[sortedEvents.length - 1]?.amount || lastSession.initialBalance
  }

  if (!user) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="sc-theme">
        <div className="min-h-screen bg-background text-foreground flex flex-col bg-gradient-to-br from-background to-[hsl(202,34%,8%)]">
          <header className="border-b border-border bg-background">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold">SC Session Tracker</h1>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center justify-start p-4 pt-12">
            <div className="w-full max-w-6xl space-y-16 mb-16">
              {/* Hero Section + Login */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h2 className="text-4xl font-bold tracking-tight">
                  Maximize Your Star Citizen Gaming Sessions
                  </h2>
                  <p className="text-xl text-muted-foreground">
                  Log your earnings, spending, and profits to achieve peak efficiency and build your wealth among the stars.
                  </p>
                  <p className="text-muted-foreground text-sm">
                  This is a free fan-made webapp for the game <a
            href="https://play.sc"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >Star Citizen</a>
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center space-y-4">
                  <p className="text-lg text-muted-foreground mb-2">Ready to get started?</p>
                  <div className="w-full max-w-md">
                    <LoginForm />
                  </div>
                </div>
              </div>

              {/* Main Feature */}
              <div className="space-y-6">
                <img 
                  src={activeSessionImg}
                  alt="Active session tracking" 
                  className="w-full rounded-lg border border-border shadow-lg"
                />
                <div className="text-center max-w-2xl mx-auto">
                  <h3 className="text-xl font-semibold mb-2">Real-time Session Tracking</h3>
                  <p className="text-muted-foreground">
                    Monitor your earnings and expenses in real-time with an intuitive interface. Track your profit per hour and visualize your progress with dynamic charts.
                  </p>
                </div>
              </div>

              {/* Secondary Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Session History */}
                <div className="space-y-4">
                  <img 
                    src={historySessionImg}
                    alt="Session history view" 
                    className="w-full rounded-lg border border-border shadow-lg"
                  />
                  <h3 className="text-lg font-semibold">Detailed Session History</h3>
                  <p className="text-sm text-muted-foreground">
                    Review past sessions with comprehensive statistics and insights. Analyze your performance and identify your most profitable activities.
                  </p>
                </div>

                {/* Balance Updates */}
                <div className="space-y-4">
                  <img 
                    src={updateBalanceImg}
                    alt="Balance update interface" 
                    className="w-full rounded-lg border border-border shadow-lg"
                  />
                  <h3 className="text-lg font-semibold">Quick Balance Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Easily record earnings and expenses with a streamlined interface. Categorize your transactions for better tracking and analysis.
                  </p>
                </div>

                {/* New Session */}
                <div className="space-y-4">
                  <img 
                    src={newSessionImg}
                    alt="New session creation" 
                    className="w-full rounded-lg border border-border shadow-lg"
                  />
                  <h3 className="text-lg font-semibold">Seamless Session Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Start new sessions with ease. Your previous balance is automatically carried forward, making it simple to maintain accurate records across sessions.
                  </p>
                </div>
              </div>
            </div>
          </main>

          <Footer />
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="sc-theme">
      <div className="min-h-screen text-foreground flex flex-col">
        <header className="border-b border-border bg-background">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">SC Session Tracker</h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {user.user_metadata?.avatar_url && (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="User avatar" 
                  className="w-8 h-8 rounded-full"
                />
              )}
              <Button variant="outline" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          )}

          {activeSession ? (
            <SessionView
              session={activeSession}
              onEndSession={handleEndSession}
              onUpdateSession={handleUpdateSession}
            />
          ) : (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Previous Sessions</h2>
                <Button onClick={() => setIsStartModalOpen(true)}>
                  Start New Session
                </Button>
              </div>
              <SessionList 
                sessions={sessions} 
                onDeleteSession={handleDeleteSession}
                onViewSessionDetails={handleViewSessionDetails}
              />
            </div>
          )}
        </main>

        <Footer />

        <StartSessionModal
          isOpen={isStartModalOpen}
          onClose={() => setIsStartModalOpen(false)}
          onStart={handleStartSession}
          lastSessionBalance={getLastCompletedSessionBalance()}
        />

        <SessionDetailsDialog
          session={selectedSession}
          isOpen={selectedSession !== null}
          onOpenChange={(open) => !open && setSelectedSession(null)}
        />

        <AlertDialog open={sessionToDelete !== null} onOpenChange={(open) => !open && setSessionToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Session</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this session? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteSession}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ThemeProvider>
  )
}

export default App
