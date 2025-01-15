import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Session, Event } from '../App'
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

    return data.map((session: any) => ({
      id: session.id,
      description: session.description,
      startTime: new Date(session.start_time),
      endTime: session.end_time ? new Date(session.end_time) : undefined,
      initialBalance: session.initial_balance,
      events: session.events.map((event: any) => ({
        timestamp: new Date(event.timestamp),
        amount: event.amount,
        type: event.type,
        description: event.description
      }))
    }))
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

    const { error } = await supabase
      .from('sessions')
      .update({
        description: session.description,
        end_time: session.endTime?.toISOString()
      })
      .eq('id', session.id)
      .eq('user_id', user.id)

    if (error) throw error
  }, [user])

  const deleteSession = useCallback(async (sessionId: string) => {
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id)

    if (error) throw error
  }, [user])

  const addEvent = useCallback(async (sessionId: string, event: Omit<Event, 'id'>) => {
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('events')
      .insert({
        session_id: sessionId,
        timestamp: event.timestamp.toISOString(),
        amount: event.amount,
        type: event.type,
        description: event.description
      })

    if (error) throw error
  }, [user])

  return {
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
    addEvent
  }
} 