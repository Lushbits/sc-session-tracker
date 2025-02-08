import { FriendRequest, Profile } from '@/types/friend-system'
import { supabase } from '@/lib/supabase'

type SupabaseProfile = {
  id: string
  user_id: string
  username: string
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

type SupabaseFriendRequest = {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  sender: SupabaseProfile
  receiver: SupabaseProfile
}

type RawSupabaseResponse = {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  sender: Record<string, any>
  receiver: Record<string, any>
}

function isSupabaseProfile(obj: unknown): obj is SupabaseProfile {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'user_id' in obj &&
    'username' in obj &&
    'display_name' in obj &&
    'avatar_url' in obj &&
    'created_at' in obj &&
    'updated_at' in obj
  )
}

function validateAndMapFriendRequest(request: RawSupabaseResponse): request is SupabaseFriendRequest {
  return (
    request &&
    typeof request === 'object' &&
    'id' in request &&
    'sender_id' in request &&
    'receiver_id' in request &&
    'status' in request &&
    'created_at' in request &&
    'updated_at' in request &&
    request.sender && isSupabaseProfile(request.sender) &&
    request.receiver && isSupabaseProfile(request.receiver)
  )
}

function mapToFriendRequest(request: SupabaseFriendRequest): FriendRequest {
  return {
    id: request.id,
    sender_id: request.sender_id,
    receiver_id: request.receiver_id,
    status: request.status,
    created_at: request.created_at,
    updated_at: request.updated_at,
    sender: request.sender,
    receiver: request.receiver
  }
}

export const searchProfiles = async (searchTerm: string, currentUserId: string): Promise<Profile[]> => {
  if (!searchTerm.trim()) {
    return []
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(`
      id,
      user_id,
      display_name,
      username,
      avatar_url,
      created_at,
      updated_at
    `)
    .neq('user_id', currentUserId)
    .ilike('display_name', `%${searchTerm}%`)
    .order('display_name')
    .limit(10)

  if (error) {
    console.error('Error searching profiles:', error)
    throw error
  }

  if (!profiles) return []

  return profiles.filter((profile): profile is Profile => {
    if (!profile.display_name) {
      console.error('Profile missing display_name:', profile)
      return false
    }
    return true
  })
}

export const getFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
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

  if (error) {
    console.error('Error fetching friend requests:', error)
    throw error
  }

  if (!requests) return []

  const validRequests = requests
    .map(request => request as RawSupabaseResponse)
    .filter(validateAndMapFriendRequest)
  
  return validRequests.map(mapToFriendRequest)
}

export const sendFriendRequest = async (senderId: string, receiverId: string): Promise<FriendRequest> => {
  const { data: request, error } = await supabase
    .from('friend_requests')
    .insert([{ sender_id: senderId, receiver_id: receiverId, status: 'pending' }])
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
    .single()

  if (error) {
    console.error('Error sending friend request:', error)
    throw error
  }

  const rawRequest = request as RawSupabaseResponse
  if (!validateAndMapFriendRequest(rawRequest)) {
    throw new Error('Friend request missing profile data')
  }

  return mapToFriendRequest(rawRequest)
}

export const updateFriendRequest = async (requestId: string, status: 'accepted' | 'rejected'): Promise<FriendRequest> => {
  const { data: request, error } = await supabase
    .from('friend_requests')
    .update({ status })
    .eq('id', requestId)
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
    .single()

  if (error) {
    console.error('Error updating friend request:', error)
    throw error
  }

  const rawRequest = request as RawSupabaseResponse
  if (!validateAndMapFriendRequest(rawRequest)) {
    throw new Error('Friend request missing profile data')
  }

  return mapToFriendRequest(rawRequest)
}

export const deleteFriendRequest = async (requestId: string): Promise<void> => {
  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('id', requestId)

  if (error) {
    console.error('Error deleting friend request:', error)
    throw error
  }
}

export const getFriends = async (userId: string): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('friends')
    .select(`
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
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching friends:', error)
    throw error
  }

  if (!data) return []
  
  return data
    .filter((record): record is typeof record & { friend: SupabaseProfile } => {
      if (!record.friend || !isSupabaseProfile(record.friend)) {
        console.error('Friend record missing profile data:', record)
        return false
      }
      return true
    })
    .map(record => record.friend)
} 