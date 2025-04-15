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

export interface User {
  id: string
  display_name: string | null
  avatar_url: string | null
}

export interface ImageFile {
  id?: string
  file?: File
  storage_path?: string
  url?: string
}

export interface CaptainLog {
  id: string
  user_id: string
  session_id: string | null
  text: string
  created_at: string
  images: ImageFile[]
  author?: User
  is_public?: boolean
  reported_count?: number
  is_hidden?: boolean
  upvotes?: number
  downvotes?: number
  score?: number
  user_vote?: number
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