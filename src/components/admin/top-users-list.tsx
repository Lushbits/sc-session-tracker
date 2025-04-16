import { TopUser } from '@/services/admin'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface TopUsersListProps {
  data: TopUser[]
  title: string
  countLabel: string
}

export function TopUsersList({ data, title, countLabel }: TopUsersListProps) {
  return (
    <div className="rounded-md border bg-card">
      <div className="border-b p-4">
        <h3 className="text-lg font-medium">{title}</h3>
      </div>
      <div className="divide-y">
        {data.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No data available
          </div>
        ) : (
          data.map((user, index) => (
            <div key={user.user_id} className="flex items-center p-4">
              <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                {index + 1}
              </div>
              <Avatar className="mr-4 h-10 w-10">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>
                  {user.display_name?.[0]?.toUpperCase() || user.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{user.display_name || user.username}</p>
                <p className="text-sm text-muted-foreground">{user.username}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{user.count}</p>
                <p className="text-xs text-muted-foreground">{countLabel}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 