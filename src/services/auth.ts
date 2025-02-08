import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  error: Error | null
}

export class AuthService {
  private static instance: AuthService
  private constructor() {}

  static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async signInWithDiscord() {
    return supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'identify email',
      }
    })
  }

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      // Check for specific error cases
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. If you signed up with Discord, please use the Discord sign-in option.')
      }
      throw error
    }

    return { data, error }
  }

  async signUpWithEmail(email: string, password: string) {
    console.log('AuthService: Attempting signup with email')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          email: email // Add email to user metadata
        }
      }
    })

    console.log('AuthService: Signup response:', { data, error })

    // If we get an empty user object but no error, it means email confirmation is required
    if (!error && (!data?.user || Object.keys(data.user).length === 0)) {
      console.log('AuthService: Email confirmation required')
      return {
        data: {
          user: null,
          session: null,
          message: 'Please check your email to confirm your account'
        },
        error: null
      }
    }

    if (error) {
      console.error('AuthService: Signup error:', error)
      throw error
    }

    // Check if the user already exists
    if (data?.user?.identities?.length === 0) {
      throw new Error('This email is already registered. Please try signing in instead.')
    }

    return { data, error }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      window.location.href = '/'
    } catch (error) {
      console.error('Error during sign out:', error)
      throw error
    }
  }

  async getSession() {
    return supabase.auth.getSession()
  }

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select()
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data as Profile | null
  }

  async createProfile(user: User): Promise<Profile> {
    let baseUsername = user.user_metadata?.full_name || 
                      user.user_metadata?.name ||
                      user.user_metadata?.user_name ||
                      user.user_metadata?.preferred_username ||
                      user.email?.split('@')[0] || 'user'

    baseUsername = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '')
    let username = baseUsername
    let counter = 1

    while (true) {
      const { data: existingUser, error: usernameError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()

      if (usernameError && usernameError.code === 'PGRST116') {
        break
      }

      username = `${baseUsername}${counter}`
      counter++
    }

    const { data, error: createError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        username,
        display_name: user.user_metadata?.full_name || username,
        avatar_url: user.user_metadata?.avatar_url || null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    return data as Profile
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }

  async resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
  }
}

export const authService = AuthService.getInstance() 