import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { FriendRequest, Profile, DatabaseFriendRecord, DatabaseFriendRequest } from '@/types/friend-system'
import { mapRequestWithProfiles, mapProfile } from './friend-system-helpers'
import { supabase } from '@/lib/supabase'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Export the type
export interface FriendSystemState {
  friends: Profile[]
  incomingRequests: FriendRequest[]
  sentRequests: FriendRequest[]
  setFriends: (friends: Profile[] | ((prev: Profile[]) => Profile[])) => void
  setIncomingRequests: (requests: FriendRequest[] | ((prev: FriendRequest[]) => FriendRequest[])) => void
  setSentRequests: (requests: FriendRequest[] | ((prev: FriendRequest[]) => FriendRequest[])) => void
}

const syncFriendData = async (state: FriendSystemState, userId: string) => {
  try {
    const [friendsData, requestsData] = await Promise.all([
      supabase
        .from('friends')
        .select(`
          id,
          user_id,
          friend_id,
          friend:profiles!friend_id(*)
        `)
        .eq('user_id', userId),
      supabase
        .from('friend_requests')
        .select(`
          *,
          sender:profiles!sender_id(*),
          receiver:profiles!receiver_id(*)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    ])

    if (friendsData.error) throw friendsData.error
    if (requestsData.error) throw requestsData.error

    // Update friends
    const mappedFriends = friendsData.data
      .map(record => {
        const friendRecord = {
          id: record.id,
          user_id: record.user_id,
          friend_id: record.friend_id,
          friend: record.friend
        } as unknown as DatabaseFriendRecord
        return mapProfile(friendRecord.friend)
      })
      .filter((profile): profile is Profile => profile !== null)
    state.setFriends(mappedFriends)

    // Split and update requests
    const mappedRequests = requestsData.data.map(request => 
      mapRequestWithProfiles(request as DatabaseFriendRequest)
    )
    const pending = mappedRequests.filter(r => r.status === 'pending' && r.receiver_id === userId)
    const sent = mappedRequests.filter(r => r.status === 'pending' && r.sender_id === userId)
    
    state.setIncomingRequests(pending)
    state.setSentRequests(sent)
  } catch (error) {
    console.error('Error syncing friend data:', error)
  }
}

export const setupFriendRequestSubscription = (
  channel: RealtimeChannel,
  state: FriendSystemState,
  userId: string
): (() => void) => {
  // Initial data sync
  syncFriendData(state, userId)

  // Set up channel listeners
  channel
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'friend_requests' },
      async (payload: RealtimePostgresChangesPayload<DatabaseFriendRequest>) => {
        console.log('Friend request change:', payload.eventType, payload)
        const newRequest = payload.new as DatabaseFriendRequest | null
        const oldRequest = payload.old as DatabaseFriendRequest | null
        
        if (newRequest?.sender_id === userId || newRequest?.receiver_id === userId ||
            oldRequest?.sender_id === userId || oldRequest?.receiver_id === userId) {
          await syncFriendData(state, userId)
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'friends' },
      async (payload: RealtimePostgresChangesPayload<DatabaseFriendRecord>) => {
        console.log('Friend change:', payload.eventType, payload)
        const newRecord = payload.new as DatabaseFriendRecord | null
        const oldRecord = payload.old as DatabaseFriendRecord | null
        
        // For DELETE events, immediately update local state and then sync
        if (payload.eventType === 'DELETE' && oldRecord) {
          console.log('Processing friend DELETE event', { oldRecord, currentState: state.friends })
          // Immediately remove the friend from local state
          state.setFriends(prev => {
            const updatedFriends = prev.filter(friend => {
              // If this user was the user_id in the record, filter out the friend with friend_id
              if (oldRecord.user_id === userId) {
                return friend.user_id !== oldRecord.friend_id
              }
              // If this user was the friend_id in the record, filter out the friend with user_id
              if (oldRecord.friend_id === userId) {
                return friend.user_id !== oldRecord.user_id
              }
              return true
            })
            console.log('Updated friends after DELETE', updatedFriends)
            return updatedFriends
          })
          
          // Then sync with server to ensure consistency
          await syncFriendData(state, userId)
          return
        }
        
        // For other events, check both records and sync
        if (newRecord?.user_id === userId || newRecord?.friend_id === userId ||
            oldRecord?.user_id === userId || oldRecord?.friend_id === userId) {
          await syncFriendData(state, userId)
        }
      }
    )

  // Subscribe once
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Friend system realtime subscription active')
    }
  })

  // Return cleanup function
  return () => {
    channel.unsubscribe()
  }
}

export const setupFriendSystemRealtime = (
  supabase: SupabaseClient<Database>,
  userId: string,
  state: FriendSystemState,
  setState: (state: FriendSystemState) => void
) => {
  const handleFriendRequestChange = async (payload: RealtimePostgresChangesPayload<FriendRequestRow>) => {
    try {
      // Re-fetch all friend requests to ensure we have the latest state
      const { data: requests, error } = await supabase
        .from('friend_requests')
        .select(`
          id,
          sender_id,
          receiver_id,
          status,
          created_at,
          updated_at,
          sender:profiles!sender_id(
            id,
            user_id,
            display_name,
            avatar_url,
            created_at,
            updated_at
          ),
          receiver:profiles!receiver_id(
            id,
            user_id,
            display_name,
            avatar_url,
            created_at,
            updated_at
          )
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

      if (error) throw error

      // Map the requests to our internal type
      const mappedRequests = requests.map(mapRequestWithProfiles)

      // Update state with new requests
      setState({
        ...state,
        pendingRequests: mappedRequests.filter(r => r.receiver_id === userId && r.status === 'pending'),
        sentRequests: mappedRequests.filter(r => r.sender_id === userId && r.status === 'pending')
      })
    } catch (error) {
      console.error('Error syncing friend data:', error)
    }
  }

  const handleFriendChange = async (payload: RealtimePostgresChangesPayload<FriendRow>) => {
    try {
      // Re-fetch all friends to ensure we have the latest state
      const { data, error } = await supabase
        .from('friends')
        .select(`
          id,
          user_id,
          friend_id,
          friend:profiles!friend_id(
            id,
            user_id,
            display_name,
            avatar_url,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)

      if (error) throw error

      if (!data) return

      // Map the friends to our internal type
      const updatedFriends = data
        .map(record => mapProfile(record.friend))
        .filter((friend): friend is Profile => friend !== null)

      // Update state with new friends
      setState({
        ...state,
        friends: updatedFriends
      })
    } catch (error) {
      console.error('Error syncing friend data:', error)
    }
  }

  // Subscribe to friend request changes
  const friendRequestSubscription = supabase
    .channel('friend-requests')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'friend_requests',
        filter: `sender_id=eq.${userId},receiver_id=eq.${userId}`
      },
      handleFriendRequestChange
    )
    .subscribe()

  // Subscribe to friends changes
  const friendsSubscription = supabase
    .channel('friends')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'friends',
        filter: `user_id=eq.${userId}`
      },
      handleFriendChange
    )
    .subscribe()

  return () => {
    friendRequestSubscription.unsubscribe()
    friendsSubscription.unsubscribe()
  }
} 