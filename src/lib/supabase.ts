import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for database
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          username: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          description: string
          start_time: string
          end_time: string | null
          initial_balance: number
          session_log: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          start_time: string
          end_time?: string | null
          initial_balance: number
          session_log?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          start_time?: string
          end_time?: string | null
          initial_balance?: number
          session_log?: string | null
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          session_id: string
          timestamp: string
          amount: number
          type: 'earning' | 'spending' | 'balance' | 'session_start' | 'session_end'
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          timestamp: string
          amount: number
          type: 'earning' | 'spending' | 'balance' | 'session_start' | 'session_end'
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          timestamp?: string
          amount?: number
          type?: 'earning' | 'spending' | 'balance' | 'session_start' | 'session_end'
          description?: string | null
          created_at?: string
        }
      }
    }
  }
} 