// Database response types (snake_case)
export interface DbSession {
  id: string
  description: string
  start_time: string
  end_time?: string
  initial_balance: number
  events: SessionEvent[]
}

export interface DbCaptainLog {
  id: string
  user_id: string
  session_id: string | null
  text: string
  created_at: string
  updated_at: string
  deleted_session: boolean
  log_images: Array<{
    id: string
    storage_path: string
    created_at: string
  }>
  session: DbSession | null
}

// Application types (camelCase)
export interface CaptainLog {
  id: string
  user_id: string
  session_id: string | null
  text: string
  created_at: string
  updated_at: string
  deleted_session: boolean
  images: CaptainLogImage[]
  session?: Session | null
}

export interface CaptainLogImage {
  id: string
  storage_path: string
  created_at: string
}

export interface Session {
  id: string
  description: string
  startTime: Date
  endTime?: Date
  initialBalance: number
  events: SessionEvent[]
  sessionLog?: string
}

export interface SessionEvent {
  timestamp: Date
  type: 'earning' | 'spending' | 'balance' | 'session_start' | 'session_end'
  amount: number
  description: string
} 