import { useState, useEffect, useRef } from 'react'
import { UserPlus, Loader2, Clock, Trash2, Check, X } from 'lucide-react'
import { useFriends } from '@/contexts/FriendContext'
import type { Profile } from '@/types/friend-system'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandInput,
} from '@/components/ui/command'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
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

interface SearchResultProfile extends Profile {
  hasPendingRequest: boolean
  hasIncomingRequest: boolean
}

export function FriendSearch() {
  const { searchUsers, sendFriendRequest, cancelFriendRequest, acceptFriendRequest, rejectFriendRequest, pendingRequests, sentRequests, friends, removeFriend } = useFriends()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResultProfile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isRequesting, setIsRequesting] = useState<string | null>(null)
  const [hoveredRequest, setHoveredRequest] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<SearchResultProfile | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true)
        try {
          const results = await searchUsers(searchQuery)
          const mappedResults = results.map(user => ({
            ...user,
            hasPendingRequest: pendingRequests.some(req => req.sender_id === user.user_id),
            hasIncomingRequest: sentRequests.some(req => req.receiver_id === user.user_id)
          }))
          setSearchResults(mappedResults)
        } catch (error) {
          console.error('Error searching users:', error)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(searchTimeout)
  }, [searchQuery, searchUsers, pendingRequests, sentRequests])

  const handleSendRequest = async (userId: string) => {
    setIsRequesting(userId)
    try {
      await sendFriendRequest(userId)
      // Clear search field and results after successful request
      setSearchQuery('')
      setSearchResults([])
    } finally {
      setIsRequesting(null)
    }
  }

  const handleRemoveFriend = async (user: SearchResultProfile) => {
    setSelectedFriend(user)
    setShowConfirmDialog(true)
  }

  const confirmRemoveFriend = async () => {
    if (!selectedFriend?.user_id) return

    setIsRequesting(selectedFriend.user_id)
    try {
      await removeFriend(selectedFriend.user_id)
      // Remove the user from search results
      setSearchResults(current =>
        current.filter(user => user.user_id !== selectedFriend.user_id)
      )
    } finally {
      setIsRequesting(null)
      setShowConfirmDialog(false)
      setSelectedFriend(null)
    }
  }

  const handleCancelRequest = async (userId: string) => {
    setIsRequesting(userId)
    try {
      const request = sentRequests.find(r => r.receiver_id === userId)
      if (request) {
        await cancelFriendRequest(request.id)
        setSearchResults(current =>
          current.map(user => 
            user.user_id === userId 
              ? { ...user, hasIncomingRequest: false }
              : user
          )
        )
      }
    } finally {
      setIsRequesting(null)
    }
  }

  const handleAcceptRequest = async (userId: string) => {
    setIsRequesting(userId)
    try {
      const request = pendingRequests.find(r => r.sender_id === userId)
      if (request) {
        await acceptFriendRequest(request.id)
        setSearchResults(current =>
          current.filter(user => user.user_id !== userId)
        )
      }
    } finally {
      setIsRequesting(null)
    }
  }

  const handleRejectRequest = async (userId: string) => {
    setIsRequesting(userId)
    try {
      const request = pendingRequests.find(r => r.sender_id === userId)
      if (request) {
        await rejectFriendRequest(request.id)
        setSearchResults(current =>
          current.map(user => 
            user.user_id === userId 
              ? { ...user, hasPendingRequest: false }
              : user
          )
        )
      }
    } finally {
      setIsRequesting(null)
    }
  }

  const showDropdown = searchQuery.trim().length > 0 || searchResults.length > 0

  return (
    <>
      <div ref={containerRef} className="relative w-[350px]">
        <div className="relative">
          <Command className="rounded-lg border shadow-md">
            <CommandInput
              placeholder="Search users..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="h-11"
            />
          </Command>

          {showDropdown && (
            <div className="absolute top-[calc(100%+1px)] left-0 w-full z-50">
              <div className="rounded-b-lg border border-t-0 bg-popover shadow-md overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto">
                  {isSearching && (
                    <div className="py-6 text-center text-sm">
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    </div>
                  )}
                  {!isSearching && searchQuery && searchResults.length === 0 && (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No users found
                    </div>
                  )}
                  {!isSearching && searchResults.length > 0 && (
                    <div className="p-1">
                      {searchResults.map((user) => (
                        <div
                          key={user.user_id}
                          className="flex items-center justify-between px-3 py-2 rounded-sm hover:bg-accent"
                        >
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>
                                {user.display_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {user.display_name}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {user.hasPendingRequest && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className={cn(
                                    "h-8 w-8 p-0",
                                    "text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRejectRequest(user.user_id)
                                  }}
                                  disabled={isRequesting === user.user_id}
                                  title="Decline request"
                                >
                                  {isRequesting === user.user_id ? (
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
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAcceptRequest(user.user_id)
                                  }}
                                  disabled={isRequesting === user.user_id}
                                  title="Accept request"
                                >
                                  {isRequesting === user.user_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                              </>
                            )}
                            {!user.hasPendingRequest && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className={cn(
                                  "ml-2 relative h-8 w-8 p-0",
                                  isRequesting === user.user_id && "opacity-50 cursor-not-allowed",
                                  user.hasIncomingRequest && hoveredRequest !== user.user_id && "opacity-50",
                                  user.hasIncomingRequest && hoveredRequest === user.user_id && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                                  friends.some(f => f.user_id === user.user_id) && "hover:bg-destructive hover:text-destructive-foreground",
                                  !user.hasIncomingRequest && !friends.some(f => f.user_id === user.user_id) && "text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (user.hasIncomingRequest) {
                                    handleCancelRequest(user.user_id)
                                  } else if (friends.some(f => f.user_id === user.user_id)) {
                                    handleRemoveFriend(user)
                                  } else {
                                    handleSendRequest(user.user_id)
                                  }
                                }}
                                onMouseEnter={() => setHoveredRequest(user.user_id)}
                                onMouseLeave={() => setHoveredRequest(null)}
                                disabled={isRequesting === user.user_id}
                                title={
                                  friends.some(f => f.user_id === user.user_id)
                                    ? "Remove friend"
                                    : user.hasIncomingRequest
                                    ? "Cancel friend request"
                                    : "Send friend request"
                                }
                              >
                                {isRequesting === user.user_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : friends.some(f => f.user_id === user.user_id) ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4"
                                  >
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="8.5" cy="7" r="4" />
                                    <line x1="18" y1="8" x2="23" y2="13" />
                                    <line x1="23" y1="8" x2="18" y2="13" />
                                  </svg>
                                ) : user.hasIncomingRequest ? (
                                  hoveredRequest === user.user_id ? (
                                    <Trash2 className="h-4 w-4" />
                                  ) : (
                                    <Clock className="h-4 w-4" />
                                  )
                                ) : (
                                  <UserPlus className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
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
            <AlertDialogCancel disabled={!!isRequesting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveFriend}
              disabled={!!isRequesting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRequesting ? "Removing..." : "Remove Friend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 