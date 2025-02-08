export type Profile = {
  id: string
  user_id: string
  username?: string
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface FriendRequestBase {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
}

export type FriendRequest = {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  sender?: Profile
  receiver?: Profile
}

export interface FriendRecord {
  id: string
  user_id: string
  friend_id: string
  friend: Profile
}

export interface DatabaseFriendRecord {
  id: string
  user_id: string
  friend_id: string
  friend: Profile
}

export interface DatabaseFriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  sender?: Profile
  receiver?: Profile
}

export interface FriendContextState {
  friends: Profile[]
  pendingRequests: FriendRequest[]
  sentRequests: FriendRequest[]
  loading: boolean
  error: Error | null
  isLoading: { [key: string]: boolean }
}

export interface FriendContextType extends FriendContextState {
  searchUsers: (query: string) => Promise<Profile[]>
  sendFriendRequest: (userId: string) => Promise<void>
  acceptFriendRequest: (requestId: string) => Promise<void>
  rejectFriendRequest: (requestId: string) => Promise<void>
  cancelFriendRequest: (requestId: string) => Promise<void>
  removeFriend: (friendId: string) => Promise<void>
  getLoadingState: (operation: string, id: string) => boolean
} 