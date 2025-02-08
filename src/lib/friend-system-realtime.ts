import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { FriendRequest, Profile, FriendSystemState } from '@/types/friend-system'
import { supabase } from '@/lib/supabase'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

type DatabaseFriendRow = {
  id: string
  user_id: string
  friend_id: string
  created_at: string
  friend: {
    id: string
    user_id: string
    username: string
    display_name: string
    avatar_url: string | null
    created_at: string
    updated_at: string
  }
}

type DatabaseFriendRequestRow = {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  sender: {
    id: string
    user_id: string
    username: string
    display_name: string
    avatar_url: string | null
    created_at: string
    updated_at: string
  }
  receiver: {
    id: string
    user_id: string
    username: string
    display_name: string
    avatar_url: string | null
    created_at: string
    updated_at: string
  }
}

function isValidProfile(profile: any): profile is Profile {
  return (
    profile &&
    typeof profile === 'object' &&
    'id' in profile &&
    'user_id' in profile &&
    'username' in profile &&
    'display_name' in profile &&
    'created_at' in profile &&
    'updated_at' in profile
  )
}

function mapDatabaseRequestToFriendRequest(request: DatabaseFriendRequestRow): FriendRequest | null {
  if (!request.sender || !request.receiver) return null
  
  return {
    id: request.id,
    sender_id: request.sender_id,
    receiver_id: request.receiver_id,
    status: request.status,
    created_at: request.created_at,
    updated_at: request.updated_at,
    sender: request.sender as Profile,
    receiver: request.receiver as Profile
  }
}

const syncFriendData = async (state: FriendSystemState, userId: string) => {
  try {
    const [friendsData, requestsData] = await Promise.all([
      supabase
        .from('friends')
        .select<string, DatabaseFriendRow>(`
          id,
          user_id,
          friend_id,
          friend:profiles!friend_id(
            id,
            user_id,
            username,
            display_name,
            avatar_url,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId),
      supabase
        .from('friend_requests')
        .select<string, DatabaseFriendRequestRow>(`
          id,
          sender_id,
          receiver_id,
          status,
          created_at,
          updated_at,
          sender:profiles!sender_id(
            id,
            user_id,
            username,
            display_name,
            avatar_url,
            created_at,
            updated_at
          ),
          receiver:profiles!receiver_id(
            id,
            user_id,
            username,
            display_name,
            avatar_url,
            created_at,
            updated_at
          )
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    ])

    if (friendsData.error) throw friendsData.error
    if (requestsData.error) throw requestsData.error

    // Update friends
    const mappedFriends = friendsData.data
      .map(record => record.friend)
      .filter(isValidProfile)
    state.setFriends(mappedFriends)

    // Split and update requests
    const mappedRequests = requestsData.data
      .map(request => mapDatabaseRequestToFriendRequest(request))
      .filter((request): request is FriendRequest => request !== null)

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
  const handleFriendRequestChange = async (payload: RealtimePostgresChangesPayload<DatabaseFriendRequestRow>) => {
    await syncFriendData(state, userId)
  }

  const handleFriendChange = async (payload: RealtimePostgresChangesPayload<DatabaseFriendRow>) => {
    await syncFriendData(state, userId)
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