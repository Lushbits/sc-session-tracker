'use client'

import { Check, ChevronsUpDown } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface Friend {
  id: string
  display_name: string
}

interface FriendFilterDropdownProps {
  friends: Friend[]
  selectedFriendIds: string[]
  onSelectionChange: (friendIds: string[]) => void
}

export function FriendFilterDropdown({
  friends,
  selectedFriendIds,
  onSelectionChange,
}: FriendFilterDropdownProps) {
  const [open, setOpen] = useState(false)

  const toggleFriend = (friendId: string) => {
    const newSelection = selectedFriendIds.includes(friendId)
      ? selectedFriendIds.filter(id => id !== friendId)
      : [...selectedFriendIds, friendId]
    onSelectionChange(newSelection)
  }

  const selectedText = selectedFriendIds.length === 0
    ? "All friends"
    : `${selectedFriendIds.length} friend${selectedFriendIds.length === 1 ? '' : 's'} selected`

  // Sort friends alphabetically by display name
  const sortedFriends = [...friends].sort((a, b) => 
    a.display_name.localeCompare(b.display_name)
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedText}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2">
        {friends.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-2">
            No friends found.
          </div>
        ) : (
          <div className="space-y-1">
            {sortedFriends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => toggleFriend(friend.id)}
                className={cn(
                  "flex items-center w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground",
                  selectedFriendIds.includes(friend.id) && "bg-accent"
                )}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedFriendIds.includes(friend.id) ? "opacity-100" : "opacity-0"
                  )}
                />
                {friend.display_name}
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
} 