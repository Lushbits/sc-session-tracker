import { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Route, useLocation } from 'wouter'

interface OwnerRouteProps {
  path: string
  children: ReactNode
}

export function OwnerRoute({ path, children }: OwnerRouteProps) {
  const { user, loading } = useAuth()
  const [_, setLocation] = useLocation()
  
  // Define owner user ID from environment variable
  const ownerUserId = import.meta.env.VITE_OWNER_USER_ID
  
  // Check if current user is the owner
  const isOwner = user?.id === ownerUserId
  
  // Function to render the appropriate content
  const renderContent = () => {
    // If still loading, show loading state
    if (loading) {
      return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    }
    
    // If not authenticated, redirect to homepage
    if (!user) {
      setLocation('/')
      return null
    }
    
    // If authenticated but not owner, show unauthorized page
    if (!isOwner) {
      return (
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Unauthorized Access</h1>
          <p className="mb-8">You don't have permission to view this page.</p>
          <button 
            onClick={() => setLocation('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Return Home
          </button>
        </div>
      )
    }
    
    // If authenticated and is owner, render the children
    return children
  }
  
  return (
    <Route path={path}>
      {() => renderContent()}
    </Route>
  )
} 