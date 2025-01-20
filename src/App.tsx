import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useDatabase } from './hooks/useDatabase'
import { Session } from './types'
import { ThemeProvider } from './components/theme-provider'
import { Button } from './components/ui/button'
import SessionView from './components/SessionView'
import SessionList from './components/SessionList'
import { DeleteSessionDialog } from './components/DeleteSessionDialog'
import { CaptainLogView } from './components/CaptainLogView'
import { Footer } from './components/Footer'
import { supabase } from './lib/supabase'
import { useCaptainLogs } from './hooks/useCaptainLogs'
import { FeedbackDialog } from './components/FeedbackDialog'
import { LandingPage } from './components/LandingPage'

function App() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'sessions' | 'logs' | 'community'>('sessions')
  const [showFeedback, setShowFeedback] = useState(false)
  const { user } = useAuth()
  const { fetchSessions, createSession, updateSession, deleteSession, addEvent } = useDatabase()
  const { logs } = useCaptainLogs(sessionToDelete)

  // Helper function to get active session
  const getActiveSession = () => {
    if (!activeSessionId) return null
    return sessions.find(s => s.id === activeSessionId)
  }

  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user])

  const loadSessions = async () => {
    try {
      const sessions = await fetchSessions()
      setSessions(sessions)
      // Find any active session (no endTime)
      const activeSession = sessions.find(s => !s.endTime)
      if (activeSession) {
        setActiveSessionId(activeSession.id)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load sessions')
    }
  }

  const handleCreateSession = async (description: string, initialBalance: number) => {
    try {
      const sessionId = await createSession({
        description,
        startTime: new Date(),
        initialBalance
      })
      await loadSessions()
      setActiveSessionId(sessionId)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create session')
    }
  }

  const handleEndSession = async (sessionId: string, sessionLog?: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      try {
        await updateSession({
          ...session,
          endTime: new Date(),
          sessionLog
        })
        await loadSessions()
        setActiveSessionId(null)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to end session')
      }
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId)
      await loadSessions()
      if (sessionId === activeSessionId) {
        setActiveSessionId(null)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete session')
      throw error
    }
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
      <ThemeProvider defaultTheme="dark">
        <LandingPage />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider defaultTheme="dark">
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b">
          <div className="container mx-auto px-4">
            <div className="flex h-14 items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="font-bold">SC Session Tracker</div>
                <nav className="flex items-center space-x-4">
                  <Button
                    variant={view === 'sessions' ? 'default' : 'ghost'}
                    className="h-9 hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setView('sessions')}
                  >
                    My sessions
                  </Button>
                  <Button
                    variant={view === 'logs' ? 'default' : 'ghost'}
                    className="h-9 hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setView('logs')}
                  >
                    Captain's log
                  </Button>
                  <Button
                    variant={view === 'community' ? 'default' : 'ghost'}
                    className="h-9 hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setView('community')}
                  >
                    Community logs
                  </Button>
                </nav>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowFeedback(true)}
                >
                  Give Feedback
                </Button>
                <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
                  Sign Out
                </Button>
                {user?.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="User avatar"
                    className="h-8 w-8 rounded-full"
                  />
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {error && (
            <div className="bg-destructive/15 text-destructive p-4">
              <div className="container mx-auto">
                {error}
              </div>
            </div>
          )}

          {view === 'sessions' ? (
            activeSession ? (
              <SessionView
                session={activeSession}
                onEndSession={handleEndSession}
                onUpdateSession={handleUpdateSession}
              />
            ) : (
              <SessionList
                sessions={sessions}
                onCreateSession={handleCreateSession}
                onDeleteSession={handleDeleteSession}
                lastCompletedSessionBalance={getLastCompletedSessionBalance()}
              />
            )
          ) : view === 'logs' ? (
            <CaptainLogView />
          ) : (
            <div className="container mx-auto px-4 py-12">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <h2 className="text-2xl font-semibold tracking-tight mb-4">Community Logs</h2>
                <p className="text-muted-foreground max-w-2xl">
                  Here you will be able to view public log entries from your fellow citizens as well as share your own cool space adventures with the world.
                </p>
                <p className="text-primary font-semibold">Stay tuned, coming soon!</p>
              </div>
            </div>
          )}
        </main>

        <Footer />

        <DeleteSessionDialog
          sessionId={sessionToDelete}
          isOpen={!!sessionToDelete}
          onOpenChange={(open) => !open && setSessionToDelete(null)}
          onConfirmDelete={confirmDeleteSession}
          logCount={logs.length}
        />

        <FeedbackDialog
          isOpen={showFeedback}
          onOpenChange={setShowFeedback}
          version={import.meta.env.VITE_APP_VERSION || 'dev'}
        />
      </div>
    </ThemeProvider>
  )
}

export default App
