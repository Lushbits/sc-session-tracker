import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Session, SessionEvent } from '../types'
import { useAuth } from '../contexts/AuthContext'

export function useDatabase() {
  const { user } = useAuth()

  const fetchSessions = useCallback(async () => {
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        events (*)
      `)
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })

    if (error) throw error

    const mappedSessions = data.map((session: any) => ({
      id: session.id,
      description: session.description,
      startTime: new Date(session.start_time),
      endTime: session.end_time ? new Date(session.end_time) : undefined,
      initialBalance: session.initial_balance,
      sessionLog: session.session_log || undefined,
      events: session.events.map((event: any) => ({
        timestamp: new Date(event.timestamp),
        amount: event.amount,
        type: event.type,
        description: event.description
      }))
    }))

    return mappedSessions
  }, [user])

  const createSession = useCallback(async (session: Omit<Session, 'id' | 'events'>) => {
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        description: session.description,
        start_time: session.startTime.toISOString(),
        end_time: session.endTime?.toISOString(),
        initial_balance: session.initialBalance
      })
      .select()
      .single()

    if (error) throw error
    return data.id
  }, [user])

  const updateSession = useCallback(async (session: Session) => {
    if (!user) throw new Error('User not authenticated')

    // Only include session_log when ending the session
    const updateData: any = {
      description: session.description
    }

    // Only add end_time and session_log if we're ending the session
    if (session.endTime) {
      updateData.end_time = session.endTime.toISOString()
      updateData.session_log = session.sessionLog || null
      console.log('Session log being saved:', session.sessionLog)
    }

    console.log('Updating session with data:', updateData)

    const { data, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', session.id)
      .eq('user_id', user.id)
      .select()

    if (error) {
      console.error('Database error updating session:', error)
      throw new Error(`Failed to update session: ${error.message}`)
    }

    console.log('Session update response:', data)
  }, [user])

  const deleteSession = useCallback(async (sessionId: string) => {
    if (!user) throw new Error('User not authenticated')

    // First update the logs to remove their session_id
    const { error: updateError } = await supabase
      .from('captain_logs')
      .update({ session_id: null })
      .eq('session_id', sessionId)

    if (updateError) throw updateError

    // Then delete the session (this will cascade delete events but preserve logs)
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id)

    if (error) throw error
  }, [user])

  const addEvent = useCallback(async (sessionId: string, event: Omit<SessionEvent, 'id'>) => {
    if (!user) throw new Error('User not authenticated')

    const eventData = {
      session_id: sessionId,
      timestamp: event.timestamp.toISOString(),
      amount: event.amount,
      type: event.type,
      description: event.description || null
    }

    // Log the event creation
    console.log('Adding event:', eventData)

    const { error } = await supabase
      .from('events')
      .insert(eventData)

    if (error) {
      console.error('Database error adding event:', error)
      throw new Error(`Failed to add event: ${error.message}`)
    }
  }, [user])

  return {
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
    addEvent
  }
} 