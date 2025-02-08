import { FriendSearch } from '@/components/friend-system/friend-search'
import { FriendRequests } from '@/components/friend-system/friend-requests'
import { FriendsList } from '@/components/friend-system/friends-list'
import { useFriends } from '@/contexts/FriendContext'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

export function FriendsPage() {
  const { sentRequests, cancelFriendRequest } = useFriends()
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  useEffect(() => {
    console.log('Sent requests data:', sentRequests)
  }, [sentRequests])

  const handleCancelRequest = async (requestId: string) => {
    setCancelingId(requestId)
    try {
      await cancelFriendRequest(requestId)
    } finally {
      setCancelingId(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Friends</h1>
        <div className="flex items-center gap-2">
          <FriendSearch />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8">
        {/* My Friends Section - Left Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">My Friends List</h2>
          <FriendsList showInline />
        </div>

        {/* Requests Sections - Right Column */}
        <div className="space-y-8">
          {/* Incoming Requests */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Incoming Requests</h2>
            <div className="border rounded-lg p-4 bg-card">
              <FriendRequests showInline />
            </div>
          </div>

          {/* Sent Requests */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Sent Requests</h2>
            <div className="border rounded-lg p-4 bg-card">
              {sentRequests.length === 0 ? (
                <div className="text-sm text-center text-muted-foreground py-4">
                  No pending sent requests
                </div>
              ) : (
                <div className="space-y-2">
                  {sentRequests.map((request) => {
                    console.log('Rendering request:', request)
                    const receiver = request.receiver
                    if (!receiver) {
                      console.error('Missing receiver data for request:', request)
                    }
                    return (
                      <div key={request.id} className="flex items-center gap-4 p-2 hover:bg-accent/50 rounded-md">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={receiver?.avatar_url || undefined} />
                          <AvatarFallback>
                            {receiver?.display_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium block truncate">
                            {receiver?.display_name || 'Unknown User'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Sent {formatDistanceToNow(new Date(request.created_at))} ago
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={cn(
                            "h-8 w-8 p-0 shrink-0",
                            "text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                          )}
                          onClick={() => handleCancelRequest(request.id)}
                          disabled={cancelingId === request.id}
                          title="Cancel request"
                        >
                          {cancelingId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 