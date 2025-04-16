import { Menu } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { Link } from 'wouter'

interface MainMenuProps {
  onShowFeedback: () => void
}

export function MainMenu({ onShowFeedback }: MainMenuProps) {
  const { signOut, user } = useAuth()
  
  // Check if current user is the owner
  const isOwner = user?.id === import.meta.env.VITE_OWNER_USER_ID

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Menu className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/friends">
            <div className="flex w-full cursor-pointer items-center">Friends List</div>
          </Link>
        </DropdownMenuItem>
        
        {/* Owner-only dashboard link */}
        {isOwner && (
          <DropdownMenuItem asChild>
            <Link href="/owner-dashboard">
              <div className="flex w-full cursor-pointer items-center">Owner Dashboard</div>
            </Link>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onSelect={onShowFeedback} className="cursor-pointer">
          Give Feedback
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} className="cursor-pointer">
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 