import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useToast } from '@/components/ui/use-toast'
import { authService, AuthState, Profile } from '@/services/auth'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAuthenticated: boolean
  error: Error | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (newProfile: Profile) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  })
  const { toast } = useToast()

  useEffect(() => {
    console.log('AuthProvider mounted')
    initializeAuth()
    
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      handleAuthStateChange(event, session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const initializeAuth = async () => {
    console.log('Initializing auth...')
    try {
      const { data: { session }, error } = await authService.getSession()
      console.log('Got session:', session?.user?.id)
      
      if (error) throw error
      
      if (session?.user) {
        await handleAuthStateChange('INITIAL', session)
      } else {
        console.log('No session found, setting loading false')
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          isAuthenticated: false
        }))
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      setState(prev => ({ 
        ...prev, 
        error: error as Error,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        profile: null
      }))
    }
  }

  const handleAuthStateChange = async (event: string, session: any) => {
    console.log('Handling auth state change:', event, session?.user?.id)
    try {
      if (event === 'SIGNED_OUT' || !session) {
        console.log('User signed out or no session')
        setState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
          error: null
        })
        return
      }

      // Update user state immediately
      setState(prev => ({
        ...prev,
        user: session.user,
        isAuthenticated: true,
        isLoading: true // Set loading true while we fetch profile
      }))

      // Then fetch/create profile
      if (event === 'SIGNED_IN' || event === 'INITIAL' || event === 'TOKEN_REFRESHED') {
        try {
          console.log('Fetching profile for user:', session.user.id)
          const profile = await authService.getProfile(session.user.id)
          
          if (!profile) {
            console.log('Creating new profile')
            const newProfile = await authService.createProfile(session.user)
            setState(prev => ({ 
              ...prev, 
              profile: newProfile,
              isLoading: false 
            }))
            toast({
              title: "Profile Created",
              description: "Your profile has been created successfully."
            })
          } else {
            console.log('Profile found')
            setState(prev => ({ 
              ...prev, 
              profile,
              isLoading: false 
            }))
          }
        } catch (error) {
          console.error('Error fetching/creating profile:', error)
          setState(prev => ({
            ...prev,
            error: error as Error,
            isLoading: false
          }))
          toast({
            title: "Error",
            description: "Failed to set up your profile. Please try signing in again.",
            variant: "destructive"
          })
        }
      } else {
        // For other events, make sure to set loading false
        setState(prev => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      console.error('Error handling auth state change:', error)
      setState(prev => ({
        ...prev,
        error: error as Error,
        isLoading: false
      }))
    }
  }

  const signIn = async () => {
    try {
      const { error } = await authService.signInWithDiscord()
      if (error) throw error
    } catch (error) {
      console.error('Sign in error:', error)
      toast({
        title: "Error",
        description: "Failed to sign in with Discord. Please try again.",
        variant: "destructive"
      })
      throw error
    }
  }

  const signOut = async () => {
    try {
      await authService.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      })
      throw error
    }
  }

  const updateProfile = (newProfile: Profile) => {
    setState(prev => ({
      ...prev,
      profile: newProfile
    }))
  }

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        profile: state.profile,
        loading: state.isLoading,
        isAuthenticated: state.isAuthenticated,
        error: state.error,
        signIn,
        signOut,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 