export interface Event {
  timestamp: Date
  amount: number
  type: 'earning' | 'spending' | 'balance' | 'session_start' | 'session_end'
  description?: string
}

export interface CaptainLogImage {
  id: string
  log_id: string
  user_id: string
  storage_path: string
  created_at: string
}

export interface CaptainLog {
  id: string
  session_id: string
  user_id: string
  text: string
  created_at: string
  updated_at: string
  deleted_session: boolean
  images: CaptainLogImage[]
}

export interface Session {
  id: string
  description: string
  startTime: Date
  endTime?: Date
  initialBalance: number
  events: Event[]
  sessionLog?: string
  captainLogs?: CaptainLog[]
} 