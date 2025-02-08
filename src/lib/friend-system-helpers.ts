import { Profile } from '@/types/friend-system'

export const getLoadingKey = (operation: string, id: string) => `${operation}-${id}`

export const mapProfile = (profile: Profile | null): Profile | null => {
  if (!profile) return null
  return {
    id: profile.id,
    user_id: profile.user_id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    created_at: profile.created_at,
    updated_at: profile.updated_at
  }
}

export const mapRequestWithProfiles = (request: DatabaseFriendRequest): FriendRequest => {
  if (!request.sender?.display_name || !request.receiver?.display_name) {
    console.error('Friend request missing required display_name:', request)
    throw new Error('Invalid friend request data')
  }
  
  return {
    id: request.id,
    sender_id: request.sender_id,
    receiver_id: request.receiver_id,
    status: request.status,
    created_at: request.created_at,
    updated_at: request.updated_at,
    sender: request.sender ? mapProfile(request.sender) ?? undefined : undefined,
    receiver: request.receiver ? mapProfile(request.receiver) ?? undefined : undefined
  }
} 