import { FriendSearch } from './friend-search'
import { FriendsList } from './friends-list'
import { FriendRequests } from './friend-requests'
import { ProfileDialog } from './profile-dialog'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function FriendSystemUI() {
  return (
    <div className="container mx-auto p-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Friends</h1>
        <div className="flex items-center gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Friend
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Friend</DialogTitle>
                <DialogDescription>
                  Search for friends by their display name.
                </DialogDescription>
              </DialogHeader>
              <FriendSearch />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Friend Requests</h2>
          <FriendRequests showInline />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Friends</h2>
          <FriendsList showInline />
        </div>
      </div>
    </div>
  )
} 