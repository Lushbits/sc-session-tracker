import { Button } from './ui/button'
import { cn } from '../lib/utils'

interface ActiveSessionIndicatorProps {
  onClick: () => void
  isActive: boolean
}

export function ActiveSessionIndicator({ onClick, isActive }: ActiveSessionIndicatorProps) {
  return (
    <Button
      variant={isActive ? 'default' : 'ghost'}
      className={cn(
        "h-9 hover:bg-accent hover:text-accent-foreground relative",
        "flex items-center gap-2"
      )}
      onClick={onClick}
    >
      <div className="relative flex items-center">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <div className="absolute w-2 h-2 rounded-full bg-red-500/30 animate-ping" />
      </div>
      Active Session
    </Button>
  )
} 