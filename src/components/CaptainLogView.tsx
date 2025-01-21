import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { CaptainLog } from '../types'
import { CaptainLogCard } from './ui/captain-log-card'
import { SessionDetailsDialog } from './SessionDetailsDialog'

export function CaptainLogView() {
  const [logs, setLogs] = useState<CaptainLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
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
            storage_path: image.storage_path // Keep the original path for transformations
          }))
        }))

        console.log('Fetched logs:', logs)
        console.log('Transformed logs:', logsWithUrls)

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

    // Optimistically remove the log from the UI
    setLogs(prevLogs => prevLogs.filter(log => log.id !== logId))
  }

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
        </div>
        
        {logs.length === 0 ? (
          <div className="flex h-[50vh] items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>No logs recorded yet.</p>
              <p className="text-sm">Start a session and add some logs to see them here.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="transition-all duration-300 animate-in fade-in-0"
              >
                <CaptainLogCard
                  log={log}
                  onDelete={() => handleDelete(log.id)}
                  onLogDeleted={() => {
                    // The log will be removed by the optimistic update in handleDelete
                  }}
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