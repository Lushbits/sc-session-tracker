import { useState, useEffect, useMemo } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useDatabase } from './hooks/useDatabase'
import { Session } from './types'
import { ThemeProvider } from './components/theme-provider'
import { Button } from './components/ui/button'
import SessionView from './components/SessionView'
import { SessionList } from './components/session/SessionList'
import { CaptainLogView } from './components/CaptainLogView'
import { Footer } from './components/Footer'
import { supabase } from './lib/supabase'
import { FeedbackDialog } from './components/FeedbackDialog'
import { LandingPage } from './components/LandingPage'
import { CommunityLogView } from './components/CommunityLogView'
import { ActiveSessionIndicator } from './components/ActiveSessionIndicator'
import { Router, Route, Switch, useLocation, Link } from 'wouter'
import { SessionDetailsDialog } from './components/SessionDetailsDialog'

function App() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [showSessionDetails, setShowSessionDetails] = useState(false)
  const { user } = useAuth()
  const { fetchSessions, createSession, updateSession, deleteSession, addEvent } = useDatabase()
  const [location, setLocation] = useLocation()

  // Find active session without setting it
  const activeSession = useMemo(() => {
    return sessions.find(s => !s.endTime)
  }, [sessions])

  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user])

  const loadSessions = async () => {
    try {
      const sessions = await fetchSessions()
      setSessions(sessions)
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
      setLocation(`/sessions/${sessionId}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create session')
    }
  }

  const handleEndSession = async (sessionId: string, sessionLog?: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      try {
        // End the session first
        await updateSession({
          ...session,
          endTime: new Date(),
          sessionLog
        })
        // Then reload sessions
        await loadSessions()
        // Finally navigate to sessions list
        window.location.href = '/sessions'
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to end session')
      }
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId)
      await loadSessions()
      if (location.startsWith(`/sessions/${sessionId}`)) {
        window.location.href = '/sessions'
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete session')
      throw error
    }
  }

  const handleViewSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      if (!session.endTime) {
        // If it's an active session, navigate to the session view
        setLocation(`/sessions/${sessionId}`)
      } else {
        // If it's a completed session, show the details dialog
        setSelectedSession(session)
        setShowSessionDetails(true)
      }
    }
  }

  const handleUpdateSession = async (updatedSession: Session) => {
    try {
      await updateSession(updatedSession)
      const existingSession = sessions.find(s => s.id === updatedSession.id)
      if (existingSession && updatedSession.events.length > existingSession.events.length) {
        const latestEvent = updatedSession.events[updatedSession.events.length - 1]
        await addEvent(updatedSession.id, latestEvent)
      }
      await loadSessions()
    } catch (error) {
      console.error('Failed to update session:', error)
      setError(error instanceof Error ? error.message : 'Failed to update session')
      throw error
    }
  }

  const getLastCompletedSessionBalance = () => {
    const completedSessions = sessions.filter(s => s.endTime)
    if (completedSessions.length === 0) return undefined
    
    const sortedSessions = completedSessions.sort((a, b) => 
      new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime()
    )
    
    const lastSession = sortedSessions[0]
    const sortedEvents = [...lastSession.events].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    
    return sortedEvents[sortedEvents.length - 1]?.amount ?? lastSession.initialBalance
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
      <Router>
        <div className="min-h-screen bg-background flex flex-col">
          <header className="border-b">
            <div className="container mx-auto px-4">
              <div className="flex h-14 items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="font-bold">SC Session Tracker</div>
                  <nav className="flex items-center space-x-4">
                    {activeSession ? (
                      <Link href={`/sessions/${activeSession.id}`}>
                        <ActiveSessionIndicator 
                          onClick={() => {}} 
                          isActive={location === `/sessions/${activeSession.id}`}
                        />
                      </Link>
                    ) : (
                      <Link href="/sessions">
                        <Button
                          variant={location === '/sessions' ? 'default' : 'ghost'}
                          className="h-9 hover:bg-accent hover:text-accent-foreground"
                        >
                          My sessions
                        </Button>
                      </Link>
                    )}
                    <Link href="/captains-log">
                      <Button
                        variant={location === '/captains-log' ? 'default' : 'ghost'}
                        className="h-9 hover:bg-accent hover:text-accent-foreground"
                      >
                        Captain's log
                      </Button>
                    </Link>
                    <Link href="/community">
                      <Button
                        variant={location === '/community' ? 'default' : 'ghost'}
                        className="h-9 hover:bg-accent hover:text-accent-foreground"
                      >
                        Community logs
                      </Button>
                    </Link>
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

            <Switch>
              <Route path="/sessions/:id">
                {(params) => {
                  const session = sessions.find(s => s.id === params.id)
                  return session ? (
                    <SessionView
                      session={session}
                      onEndSession={handleEndSession}
                      onUpdateSession={handleUpdateSession}
                    />
                  ) : null
                }}
              </Route>
              <Route path="/sessions">
                {() => {
                  // If there's an active session, redirect to it
                  if (activeSession) {
                    setLocation(`/sessions/${activeSession.id}`)
                    return null
                  }
                  
                  return (
                    <SessionList
                      sessions={sessions}
                      onCreateSession={handleCreateSession}
                      onViewSession={handleViewSession}
                      onDeleteSession={handleDeleteSession}
                      lastCompletedSessionBalance={getLastCompletedSessionBalance()}
                      hasActiveSession={!!activeSession}
                    />
                  )
                }}
              </Route>
              <Route path="/captains-log">
                <CaptainLogView />
              </Route>
              <Route path="/community">
                <CommunityLogView />
              </Route>
              <Route path="/auth/callback">
                {() => {
                  setLocation('/sessions')
                  return null
                }}
              </Route>
              <Route path="/">
                {() => {
                  setLocation('/sessions')
                  return null
                }}
              </Route>
            </Switch>
          </main>

          <Footer />

          <SessionDetailsDialog
            session={selectedSession}
            isOpen={showSessionDetails}
            onOpenChange={setShowSessionDetails}
          />

          <FeedbackDialog
            isOpen={showFeedback}
            onOpenChange={setShowFeedback}
            version={import.meta.env.VITE_APP_VERSION || 'dev'}
          />
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
