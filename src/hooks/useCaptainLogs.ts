import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CaptainLog, CaptainLogImage } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { deleteLogImages } from '../utils/storage'

export function useCaptainLogs(sessionId: string | null | undefined) {
  const [logs, setLogs] = useState<CaptainLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user || !sessionId) {
      setLogs([])
      setIsLoading(false)
      setError(null)
      return
    }

    let isMounted = true
    fetchLogs()
    
    // Subscribe to changes
    const channel = supabase
      .channel(`captain_logs:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'captain_logs',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          if (isMounted) {
            fetchLogs()
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [sessionId, user])

  const fetchLogs = async () => {
    if (!user || !sessionId) return

    try {
      setError(null)
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
        .eq('session_id', sessionId)
        .eq('deleted_session', false)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform logs to include public URLs for images
      const logsWithUrls = logs.map(log => ({
        ...log,
        images: log.log_images?.map((image: CaptainLogImage) => ({
          ...image,
          storage_path: image.storage_path // Keep the original path for transformations
        })) || []
      }))

      setLogs(logsWithUrls)
    } catch (error) {
      console.error('Error fetching logs:', error)
      setError(error instanceof Error ? error : new Error('Failed to fetch logs'))
    } finally {
      setIsLoading(false)
    }
  }

  const addLog = async (text: string, images: File[]) => {
    if (!user || !sessionId) return

    try {
      // First create the log entry
      const { data: log, error: logError } = await supabase
        .from('captain_logs')
        .insert({
          session_id: sessionId,
          text: text.trim(),
          user_id: user.id
        })
        .select()
        .single()

      if (logError) throw logError

      // If there's an image, upload it and create the image record
      if (images.length > 0) {
        const file = images[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${log.id}-${Date.now()}.${fileExt}`
        const filePath = `${sessionId}/${fileName}`

        const { error: uploadError } = await supabase
          .storage
          .from('log_images')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { error: imageError } = await supabase
          .from('log_images')
          .insert({
            log_id: log.id,
            storage_path: filePath,
            user_id: user.id
          })

        if (imageError) throw imageError
      }

      await fetchLogs()
    } catch (error) {
      console.error('Error adding log:', error)
      throw error
    }
  }

  const updateLog = async (logId: string, text: string) => {
    if (!user || !sessionId) return

    try {
      const { error } = await supabase
        .from('captain_logs')
        .update({ text: text.trim() })
        .eq('id', logId)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchLogs()
    } catch (error) {
      console.error('Error updating log:', error)
      throw error
    }
  }

  const deleteLog = async (logId: string) => {
    if (!user || !sessionId) return

    try {
      // First delete all associated images
      await deleteLogImages(logId, user.id)

      // Then delete the log entry
      const { error } = await supabase
        .from('captain_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchLogs()
    } catch (error) {
      console.error('Error deleting log:', error)
      throw error
    }
  }

  return {
    logs,
    isLoading,
    error,
    addLog,
    updateLog,
    deleteLog,
    setLogs
  }
} 