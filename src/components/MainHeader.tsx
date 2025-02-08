import { Link, useLocation } from 'wouter'
import { Button } from './ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { ActiveSessionIndicator } from './ActiveSessionIndicator'
import { Session } from '@/types'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { ProfileDialog } from './friend-system/profile-dialog'
import { MainMenu } from './MainMenu'
import { NotificationBell } from './friend-system/notification-bell'

interface MainHeaderProps {
  activeSession: Session | null
  onShowFeedback: () => void
}

export function MainHeader({ activeSession, onShowFeedback }: MainHeaderProps) {
  const [location] = useLocation()
  const { user, profile } = useAuth()

  return (
    <header className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="font-bold">SC Session Tracker</div>
            <nav className="flex items-center space-x-4">
              {activeSession ? (
                <Link href={`/sessions/${activeSession.id}`}>
                  <ActiveSessionIndicator 
                    onClick={() => {}} 
                    isActive={location === `/sessions/${activeSession.id}`}
                  />
                </Link>
              ) : (
                <Link href="/sessions">
                  <Button
                    variant={location === '/sessions' ? 'default' : 'ghost'}
                    className="h-9 hover:bg-accent hover:text-accent-foreground"
                  >
                    My sessions
                  </Button>
                </Link>
              )}
              <Link href="/captains-log">
                <Button
                  variant={location === '/captains-log' ? 'default' : 'ghost'}
                  className="h-9 hover:bg-accent hover:text-accent-foreground"
                >
                  Captain's log
                </Button>
              </Link>
              <Link href="/friends-logs">
                <Button
                  variant={location === '/friends-logs' ? 'default' : 'ghost'}
                  className="h-9 hover:bg-accent hover:text-accent-foreground"
                >
                  Friend's logs
                </Button>
              </Link>
              <Link href="/community">
                <Button
                  variant={location === '/community' ? 'default' : 'ghost'}
                  className="h-9 hover:bg-accent hover:text-accent-foreground"
                >
                  Community logs
                </Button>
              </Link>
            </nav>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ProfileDialog trigger={
                <Avatar className="h-8 w-8 cursor-pointer hover:opacity-90 transition-opacity">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {profile?.display_name?.[0]?.toUpperCase() || profile?.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              } />
              <MainMenu onShowFeedback={onShowFeedback} />
            </div>
          )}
        </div>
      </div>
    </header>
  )
} 