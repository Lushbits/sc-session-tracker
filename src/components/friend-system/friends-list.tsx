import { UserX, Loader2 } from 'lucide-react'
import { useFriends } from '@/contexts/FriendContext'
import type { Profile } from '@/types/friend-system'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface FriendsListProps {
  showInline?: boolean
}

export function FriendsList({ showInline = false }: FriendsListProps) {
  const { friends, removeFriend } = useFriends()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null)

  const handleRemoveFriend = async (friend: Profile) => {
    setSelectedFriend(friend)
    setShowConfirmDialog(true)
  }

  const confirmRemoveFriend = async () => {
    if (!selectedFriend?.user_id) return

    setRemovingId(selectedFriend.user_id)
    try {
      await removeFriend(selectedFriend.user_id)
      // No need to manually update the UI as the context will handle it
    } finally {
      setRemovingId(null)
      setShowConfirmDialog(false)
      setSelectedFriend(null)
    }
  }

  const FriendItem = ({ friend }: { friend: Profile }) => {
    if (!friend?.user_id) return null
    
    return (
      <div className="relative group rounded-lg border bg-card transition-all hover:bg-accent/50">
        <div className="flex items-center gap-3 p-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={friend.avatar_url || undefined} />
            <AvatarFallback>
              {friend.display_name?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="font-medium flex-1 truncate">
            {friend.display_name || 'Unknown User'}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-8 w-8 p-0 opacity-0 group-hover:opacity-100 shrink-0",
              "text-muted-foreground",
              "hover:text-destructive-foreground hover:bg-destructive",
              "transition-all"
            )}
            disabled={!!removingId}
            onClick={() => handleRemoveFriend(friend)}
          >
            {removingId === friend.user_id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserX className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    )
  }

  if (showInline) {
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.length === 0 ? (
            <div className="col-span-full text-sm text-left text-muted-foreground py-4">
              No friends added yet. Search for friends in the search bar in the top right of this page.
            </div>
          ) : (
            friends
              .filter(friend => friend?.user_id)
              .map((friend) => (
                <div key={friend.user_id} className="w-full">
                  <FriendItem friend={friend} />
                </div>
              ))
          )}
        </div>

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Friend</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {selectedFriend?.display_name || 'this friend'}? You'll need to send a new friend request if you want to be friends again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!removingId}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRemoveFriend}
                disabled={!!removingId}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {removingId ? "Removing..." : "Remove Friend"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <div className="i-lucide-users h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px]">
        <DropdownMenuLabel>Friends</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {friends.length === 0 ? (
          <div className="px-2 py-4 text-sm text-center text-muted-foreground">
            No friends added yet
          </div>
        ) : (
          friends.map((friend) => (
            <DropdownMenuItem
              key={friend.user_id}
              onSelect={(e: Event) => e.preventDefault()}
            >
              <FriendItem friend={friend} />
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 