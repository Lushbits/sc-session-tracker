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

export interface Session {
  id: string
  description: string
  startTime: Date
  endTime?: Date
  initialBalance: number
  events: Event[]
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
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isStartModalOpen, setIsStartModalOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const handleEndSession = async () => {
    const activeSession = getActiveSession()
    if (activeSession) {
      try {
        await updateSession({
          ...activeSession,
          endTime: new Date()
        })
        await loadSessions()
        setActiveSessionId(null)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to end session')
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
      await updateSession(updatedSession)
      const existingSession = sessions.find(s => s.id === updatedSession.id)
      if (existingSession && updatedSession.events.length > existingSession.events.length) {
        const latestEvent = updatedSession.events[updatedSession.events.length - 1]
        await addEvent(updatedSession.id, latestEvent)
      }
      await loadSessions()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update session')
    }
  }

  const activeSession = getActiveSession()

  if (!user) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="sc-theme">
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm space-y-6">
            <h1 className="text-2xl font-bold text-center">Star Citizen Earnings Tracker</h1>
            <LoginForm />
          </div>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="sc-theme">
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Star Citizen Earnings Tracker</h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button variant="outline" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
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

        <StartSessionModal
          isOpen={isStartModalOpen}
          onClose={() => setIsStartModalOpen(false)}
          onStart={handleStartSession}
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
