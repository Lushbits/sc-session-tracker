import { Bell } from 'lucide-react'
import { useFriends } from '@/contexts/FriendContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Check, X, Loader2 } from 'lucide-react'

export function NotificationBell() {
  const { pendingRequests, acceptFriendRequest, rejectFriendRequest, getLoadingState } = useFriends()
  const hasNotifications = pendingRequests.length > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "relative h-8 w-8",
            "hover:bg-accent hover:text-accent-foreground",
            !hasNotifications && "text-muted-foreground/40"
          )}
        >
          <Bell className="h-5 w-5" />
          {hasNotifications && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-4 w-4 p-0 rounded-full flex items-center justify-center text-[10px]"
            >
              {pendingRequests.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px]">
        <DropdownMenuLabel>Friend Requests</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {pendingRequests.length === 0 ? (
          <div className="px-2 py-4 text-sm text-center text-muted-foreground">
            No pending friend requests
          </div>
        ) : (
          pendingRequests.map((request) => {
            const sender = request.sender
            if (!sender) return null
            const isProcessing = getLoadingState('accept', request.id) || getLoadingState('reject', request.id)

            return (
              <DropdownMenuItem
                key={request.id}
                onSelect={(e) => e.preventDefault()}
                className="p-0"
              >
                <div className="flex items-center gap-4 p-2 w-full hover:bg-accent/50 rounded-md">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={sender.avatar_url || undefined} />
                    <AvatarFallback>
                      {sender.display_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium block truncate">
                      {sender.display_name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Received {formatDistanceToNow(new Date(request.created_at))} ago
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "h-8 w-8 p-0",
                        "text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                      )}
                      disabled={isProcessing}
                      onClick={() => rejectFriendRequest(request.id)}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "h-8 w-8 p-0",
                        "text-muted-foreground hover:bg-[hsl(142.1,76.2%,36.3%)] hover:text-white"
                      )}
                      disabled={isProcessing}
                      onClick={() => acceptFriendRequest(request.id)}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </DropdownMenuItem>
            )
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 