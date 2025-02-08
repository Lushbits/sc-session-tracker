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