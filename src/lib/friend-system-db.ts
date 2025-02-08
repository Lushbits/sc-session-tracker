import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { FriendRequest, Profile } from '@/types/friend-system'
import { mapProfile, mapRequestWithProfiles } from './friend-system-helpers'
import { supabase } from '@/lib/supabase'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

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
  }).map(profile => ({
    id: profile.id,
    user_id: profile.user_id,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    created_at: profile.created_at,
    updated_at: profile.updated_at
  }))
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

  if (error) {
    console.error('Error fetching friend requests:', error)
    throw error
  }

  return requests.map(mapRequestWithProfiles)
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
    .single()

  if (error) {
    console.error('Error sending friend request:', error)
    throw error
  }

  return mapRequestWithProfiles(request)
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
    .single()

  if (error) {
    console.error('Error updating friend request:', error)
    throw error
  }

  return mapRequestWithProfiles(request)
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
  return data.map(record => mapProfile(record.friend))
} 