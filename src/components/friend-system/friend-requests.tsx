import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { useFriends, FriendRequest } from '@/contexts/FriendContext'
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
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface FriendRequestsProps {
  showInline?: boolean
}

export function FriendRequests({ showInline = false }: FriendRequestsProps) {
  const { pendingRequests, acceptFriendRequest, rejectFriendRequest } = useFriends()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleAccept = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      await acceptFriendRequest(requestId)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      await rejectFriendRequest(requestId)
    } finally {
      setProcessingId(null)
    }
  }

  const RequestItem = ({ request }: { request: FriendRequest }) => {
    if (!request.sender) {
      console.error('Missing sender data for request:', request)
      return null
    }

    return (
      <div className="flex items-center justify-between gap-4 p-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={request.sender.avatar_url || undefined} />
            <AvatarFallback>
              {request.sender.display_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">
            {request.sender.display_name}
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
            disabled={!!processingId}
            onClick={() => handleReject(request.id)}
            title="Decline request"
          >
            {processingId === request.id ? (
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
            disabled={!!processingId}
            onClick={() => handleAccept(request.id)}
            title="Accept request"
          >
            {processingId === request.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    )
  }

  if (showInline) {
    return (
      <div className="space-y-2">
        {pendingRequests.length === 0 ? (
          <div className="text-sm text-center text-muted-foreground py-4">
            No pending friend requests
          </div>
        ) : (
          pendingRequests.map((request) => (
            <RequestItem key={request.id} request={request} />
          ))
        )}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <div className="i-lucide-users h-4 w-4" />
          {pendingRequests.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
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
          pendingRequests.map((request) => (
            <DropdownMenuItem
              key={request.id}
              onSelect={(e: Event) => e.preventDefault()}
            >
              <RequestItem request={request} />
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 