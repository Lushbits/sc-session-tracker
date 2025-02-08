import { FriendSearch } from './friend-search'
import { FriendRequests } from './friend-requests'
import { FriendsList } from './friends-list'
import { ProfileDialog } from './profile-dialog'

export function FriendSystemUI() {
  return (
    <div className="flex items-center gap-2">
      <FriendSearch />
      <FriendRequests />
      <FriendsList />
      <ProfileDialog />
    </div>
  )
} 