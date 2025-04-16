import { supabase } from '@/lib/supabase'

export interface DailySessionCount {
  date: string
  count: number
}

export interface CumulativeUserSignup {
  date: string
  count: number
}

export interface TopUser {
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  count: number
}

export interface LogStats {
  total: number
  public: number
}

export class AdminService {
  private static instance: AdminService
  
  private constructor() {}
  
  static getInstance() {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService()
    }
    return AdminService.instance
  }
  
  async getSessionsPerDay(): Promise<DailySessionCount[]> {
    const { data, error } = await supabase
      .rpc('get_sessions_per_day')
    
    if (error) throw error
    return data || []
  }
  
  async getUserSignupsOverTime(): Promise<CumulativeUserSignup[]> {
    const { data, error } = await supabase
      .rpc('get_user_signups_over_time')
    
    if (error) throw error
    return data || []
  }
  
  async getTopSessionCreators(limit: number = 10): Promise<TopUser[]> {
    const { data, error } = await supabase
      .rpc('get_top_session_creators', { limit_num: limit })
    
    if (error) throw error
    return data || []
  }
  
  async getTopLogCreators(limit: number = 10): Promise<TopUser[]> {
    const { data, error } = await supabase
      .rpc('get_top_log_creators', { limit_num: limit })
    
    if (error) throw error
    return data || []
  }
  
  async getLogStats(): Promise<LogStats> {
    const { data, error } = await supabase
      .rpc('get_log_stats')
    
    if (error) throw error
    
    // Handle case where the data is returned as an array with a single object
    if (Array.isArray(data) && data.length > 0) {
      return data[0] as LogStats;
    }
    
    return data || { total: 0, public: 0 }
  }
}

export const adminService = AdminService.getInstance() 