export interface Profile {
  id: string
  user_id: string
  username: string
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected'

export interface FriendRequestBase {
  id: string
  sender_id: string
  receiver_id: string
  status: FriendRequestStatus
  created_at: string
  updated_at: string
}

export interface FriendRequest extends FriendRequestBase {
  sender: Profile
  receiver: Profile
}

export interface FriendRecord {
  id: string
  user_id: string
  friend_id: string
  created_at: string
  friend: Profile
}

export interface FriendSystemState {
  friends: Profile[]
  incomingRequests: FriendRequest[]
  sentRequests: FriendRequest[]
  setFriends: (friends: Profile[] | ((prev: Profile[]) => Profile[])) => void
  setIncomingRequests: (requests: FriendRequest[] | ((prev: FriendRequest[]) => FriendRequest[])) => void
  setSentRequests: (requests: FriendRequest[] | ((prev: FriendRequest[]) => FriendRequest[])) => void
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

export interface SearchResultProfile extends Profile {
  hasPendingRequest: boolean
  hasIncomingRequest: boolean
} 