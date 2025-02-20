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
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
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
      captain_logs: {
        Row: {
          id: string
          session_id: string
          user_id: string
          text: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          text: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          text?: string
          created_at?: string
          updated_at?: string
        }
      }
      log_images: {
        Row: {
          id: string
          log_id: string
          user_id: string
          storage_path: string
          created_at: string
        }
        Insert: {
          id?: string
          log_id: string
          user_id: string
          storage_path: string
          created_at?: string
        }
        Update: {
          id?: string
          log_id?: string
          user_id?: string
          storage_path?: string
          created_at?: string
        }
      }
      friend_requests: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      friends: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          created_at?: string
        }
      }
    }
  }
} 