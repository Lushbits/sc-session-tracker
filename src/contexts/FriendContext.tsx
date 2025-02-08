import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '@/lib/supabase'
import { Profile, FriendRequest, FriendContextType } from '@/types/friend-system'
import { setupFriendRequestSubscription, FriendSystemState } from '@/lib/friend-system-realtime'
import { useToast } from '@/components/ui/use-toast'
import { getLoadingKey } from '@/lib/friend-system-helpers'
import * as friendSystemDb from '@/lib/friend-system-db'

const FriendContext = createContext<FriendContextType | undefined>(undefined)

export function FriendProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [friends, setFriends] = useState<Profile[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({})
  const cleanupRef = useRef<(() => void) | null>(null)

  const setLoadingState = (operation: string, id: string, loading: boolean) => {
    setIsLoading(prev => ({
      ...prev,
      [getLoadingKey(operation, id)]: loading
    }))
  }

  const getLoadingState = (operation: string, id: string): boolean => {
    return isLoading[getLoadingKey(operation, id)] || false
  }

  useEffect(() => {
    if (!user?.id) return

    // Create a single channel instance
    const channelName = `friend-system-${user.id}`
    const channel = supabase.channel(channelName)
    
    // Set up subscription
    const cleanup = setupFriendRequestSubscription(channel, {
      friends,
      incomingRequests: pendingRequests,
      sentRequests,
      setFriends,
      setIncomingRequests: setPendingRequests,
      setSentRequests
    } satisfies FriendSystemState, user.id)

    // Store cleanup function
    cleanupRef.current = () => {
      cleanup()
      supabase.removeChannel(channel)
    }

    // Cleanup function
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [user?.id])

  useEffect(() => {
    if (!user) {
      setFriends([])
      setPendingRequests([])
      setSentRequests([])
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch initial data
        const [friendsData, requestsData] = await Promise.all([
          friendSystemDb.getFriends(user.id),
          friendSystemDb.getFriendRequests(user.id)
        ])

        // Set friends
        setFriends(friendsData)

        // Split requests into pending and sent
        const pending: FriendRequest[] = []
        const sent: FriendRequest[] = []

        requestsData.forEach(request => {
          if (request.status === 'pending') {
            if (request.receiver_id === user.id) {
              pending.push(request)
            } else if (request.sender_id === user.id) {
              sent.push(request)
            }
          }
        })

        setPendingRequests(pending)
        setSentRequests(sent)

      } catch (err) {
        console.error('Error fetching friend data:', err)
        setError(err as Error)
        toast({
          title: "Error",
          description: "Failed to load friend data. Please try refreshing the page.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const searchUsers = async (query: string): Promise<Profile[]> => {
    if (!user) return []
    return friendSystemDb.searchProfiles(query, user.id)
  }

  const sendFriendRequest = async (userId: string) => {
    if (!user) return
    setLoadingState('send', userId, true)
    try {
      const request = await friendSystemDb.sendFriendRequest(user.id, userId)
      setSentRequests(prev => [...prev, request])
      toast({
        title: "Friend Request Sent",
        description: "Your friend request has been sent successfully."
      })
    } catch (err) {
      console.error('Error sending friend request:', err)
      toast({
        title: "Error",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive"
      })
      throw err
    } finally {
      setLoadingState('send', userId, false)
    }
  }

  const acceptFriendRequest = async (requestId: string) => {
    if (!user) return
    setLoadingState('accept', requestId, true)
    try {
      const request = await friendSystemDb.updateFriendRequest(requestId, 'accepted')
      setPendingRequests(prev => prev.filter(r => r.id !== requestId))
      if (request.sender) {
        setFriends(prev => [...prev, request.sender!])
      }
      toast({
        title: "Friend Request Accepted",
        description: "You are now friends!"
      })
    } catch (err) {
      console.error('Error accepting friend request:', err)
      toast({
        title: "Error",
        description: "Failed to accept friend request. Please try again.",
        variant: "destructive"
      })
      throw err
    } finally {
      setLoadingState('accept', requestId, false)
    }
  }

  const rejectFriendRequest = async (requestId: string) => {
    if (!user) return
    setLoadingState('reject', requestId, true)
    try {
      await friendSystemDb.updateFriendRequest(requestId, 'rejected')
      setPendingRequests(prev => prev.filter(r => r.id !== requestId))
      toast({
        title: "Friend Request Rejected",
        description: "The friend request has been rejected."
      })
    } catch (err) {
      console.error('Error rejecting friend request:', err)
      toast({
        title: "Error",
        description: "Failed to reject friend request. Please try again.",
        variant: "destructive"
      })
      throw err
    } finally {
      setLoadingState('reject', requestId, false)
    }
  }

  const cancelFriendRequest = async (requestId: string) => {
    if (!user) return
    setLoadingState('cancel', requestId, true)
    try {
      await friendSystemDb.deleteFriendRequest(requestId)
      setSentRequests(prev => prev.filter(r => r.id !== requestId))
      toast({
        title: "Request Cancelled",
        description: "Your friend request has been cancelled."
      })
    } catch (err) {
      console.error('Error cancelling friend request:', err)
      toast({
        title: "Error",
        description: "Failed to cancel friend request. Please try again.",
        variant: "destructive"
      })
      throw err
    } finally {
      setLoadingState('cancel', requestId, false)
    }
  }

  const removeFriend = async (friendId: string) => {
    if (!user) return
    setLoadingState('remove', friendId, true)
    try {
      // Find the friend record
      const friend = friends.find(f => f.user_id === friendId)
      if (!friend) throw new Error('Friend not found')

      // Delete the friend record - this will trigger the database trigger to handle reciprocal deletion
      const { error } = await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

      if (error) throw error

      // Update local state
      setFriends(prev => prev.filter(f => f.user_id !== friendId))

      toast({
        title: "Friend Removed",
        description: "The friend has been removed from your friends list."
      })
    } catch (err) {
      console.error('Error removing friend:', err)
      toast({
        title: "Error",
        description: "Failed to remove friend. Please try again.",
        variant: "destructive"
      })
      throw err
    } finally {
      setLoadingState('remove', friendId, false)
    }
  }

  return (
    <FriendContext.Provider
      value={{
        friends,
        pendingRequests,
        sentRequests,
        loading,
        error,
        isLoading,
        searchUsers,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        cancelFriendRequest,
        removeFriend,
        getLoadingState
      }}
    >
      {children}
    </FriendContext.Provider>
  )
}

export function useFriends() {
  const context = useContext(FriendContext)
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendProvider')
  }
  return context
} 