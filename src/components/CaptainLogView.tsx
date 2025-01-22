import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { CaptainLog } from '../types'
import { CaptainLogCard } from './ui/captain-log-card'
import { SessionDetailsDialog } from './SessionDetailsDialog'
import { Button } from './ui/button'
import { Heart } from 'lucide-react'
import { cn } from '../lib/utils'

export function CaptainLogView() {
  const [logs, setLogs] = useState<CaptainLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchLogs = async () => {
      try {
        const { data: logs, error } = await supabase
          .from('captain_logs')
          .select(`
            *,
            log_images (
              id,
              storage_path,
              created_at
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        const logsWithUrls = logs.map(log => ({
          ...log,
          images: log.log_images.map((image: any) => ({
            ...image,
            storage_path: image.storage_path
          }))
        }))

        setLogs(logsWithUrls)
      } catch (error) {
        console.error('Error fetching logs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogs()

    // Subscribe to changes
    const channel = supabase
      .channel('captain_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'captain_logs',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchLogs()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const handleDelete = async (logId: string) => {
    if (!user) return
    setLogs(prevLogs => prevLogs.filter(log => log.id !== logId))
  }

  const handleToggleFavorite = async (logId: string, isFavorite: boolean) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('captain_logs')
        .update({ is_favorite: isFavorite })
        .eq('id', logId)
        .eq('user_id', user.id)

      if (error) throw error

      setLogs(prevLogs => 
        prevLogs.map(log => 
          log.id === logId ? { ...log, is_favorite: isFavorite } : log
        )
      )
    } catch (error) {
      console.error('Error updating favorite status:', error)
    }
  }

  const filteredLogs = showFavorites ? logs.filter(log => log.is_favorite) : logs

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-muted-foreground">Loading logs...</div>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto p-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">My Captain's Log</h1>
          <div className="flex gap-2">
            <Button
              variant={!showFavorites ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "gap-2",
                !showFavorites 
                  ? "hover:bg-secondary/80"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => setShowFavorites(false)}
            >
              All logs
            </Button>
            <Button
              variant={showFavorites ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "gap-2",
                showFavorites 
                  ? "hover:bg-secondary/80"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => setShowFavorites(true)}
            >
              <Heart className={cn("w-4 h-4", showFavorites && "fill-current")} />
              Favorites
            </Button>
          </div>
        </div>
        
        {filteredLogs.length === 0 ? (
          <div className="flex h-[50vh] items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>No logs {showFavorites ? "marked as favorite" : "recorded yet"}.</p>
              <p className="text-sm">
                {showFavorites 
                  ? "Mark some logs as favorite to see them here."
                  : "Start a session and add some logs to see them here."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="transition-all duration-300 animate-in fade-in-0"
              >
                <CaptainLogCard
                  log={log}
                  onDelete={() => handleDelete(log.id)}
                  onToggleFavorite={(isFavorite) => handleToggleFavorite(log.id, isFavorite)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedSessionId && (
        <SessionDetailsDialog
          session={null}
          isOpen={!!selectedSessionId}
          onOpenChange={(open) => !open && setSelectedSessionId(null)}
        />
      )}
    </>
  )
} 