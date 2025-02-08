import { useState, useEffect, useMemo } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useDatabase } from './hooks/useDatabase'
import { Session } from './types'
import { ThemeProvider } from './components/theme-provider'
import SessionView from './components/SessionView'
import { SessionList } from './components/session/SessionList'
import { CaptainLogView } from './components/CaptainLogView'
import { Footer } from './components/Footer'
import { FeedbackDialog } from './components/FeedbackDialog'
import { LandingPage } from './components/LandingPage'
import { CommunityLogView } from './components/CommunityLogView'
import { Router, Route, Switch, useLocation } from 'wouter'
import { SessionDetailsDialog } from './components/SessionDetailsDialog'
import { MainHeader } from './components/MainHeader'
import { FriendProvider } from './contexts/FriendContext'
import { Loader2 } from 'lucide-react'
import { FriendsPage } from './pages/friends'
import { FriendLogsGrid } from './components/friend-logs/friend-logs-grid'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function Redirect({ to }: { to: string }) {
  const [_, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  return null;
}

function App() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [showSessionDetails, setShowSessionDetails] = useState(false)
  const { loading, isAuthenticated } = useAuth()
  const { fetchSessions, createSession, updateSession, deleteSession, addEvent } = useDatabase()
  const [location, setLocation] = useLocation()
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }))

  // Find active session without setting it
  const activeSession = useMemo(() => {
    return sessions.find(s => !s.endTime) || null
  }, [sessions])

  useEffect(() => {
    if (isAuthenticated) {
      loadSessions()
    }
  }, [isAuthenticated])

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

  if (loading) {
    return (
      <ThemeProvider defaultTheme="dark">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ThemeProvider>
    )
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider defaultTheme="dark">
        <LandingPage />
      </ThemeProvider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <FriendProvider>
          <Router>
            <div className="min-h-screen bg-background flex flex-col">
              <MainHeader
                activeSession={activeSession}
                onShowFeedback={() => setShowFeedback(true)}
              />

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
                        return <Redirect to={`/sessions/${activeSession.id}`} />;
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
                  <Route path="/friends">
                    <FriendsPage />
                  </Route>
                  <Route path="/friends-logs">
                    <FriendLogsGrid />
                  </Route>
                  <Route path="/auth/callback">
                    {() => <Redirect to="/sessions" />}
                  </Route>
                  <Route path="/">
                    {() => <Redirect to="/sessions" />}
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
        </FriendProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
