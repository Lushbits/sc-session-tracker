import { Button } from '../ui/button'
import { Plus } from 'lucide-react'

interface SessionListHeaderProps {
  onCreateClick: () => void
  hasActiveSession?: boolean
}

export function SessionListHeader({ onCreateClick, hasActiveSession }: SessionListHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-semibold">Sessions</h1>
      <Button 
        onClick={onCreateClick}
        disabled={hasActiveSession}
        title={hasActiveSession ? "Cannot create a new session while another is active" : "Create Session"}
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Session
      </Button>
    </div>
  )
} 