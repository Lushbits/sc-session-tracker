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
      .map(record => mapProfile(record.friend))
      .filter((profile): profile is Profile => profile !== null)
    state.setFriends(mappedFriends)

    // Split and update requests
    const mappedRequests = requestsData.data.map(request => {
      const sender = mapProfile(request.sender)
      const receiver = mapProfile(request.receiver)
      if (!sender || !receiver) return null
      
      return {
        id: request.id,
        sender_id: request.sender_id,
        receiver_id: request.receiver_id,
        status: request.status,
        created_at: request.created_at,
        updated_at: request.updated_at,
        sender,
        receiver
      }
    }).filter((request): request is FriendRequest => request !== null)

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
      async () => {
        await syncFriendData(state, userId)
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'friends' },
      async () => {
        await syncFriendData(state, userId)
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