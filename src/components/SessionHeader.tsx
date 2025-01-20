import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { CheckIcon, PauseIcon, PlayIcon, XIcon } from 'lucide-react'

interface SessionHeaderProps {
  elapsedTime: string
  isPaused: boolean
  description: string
  onPause: () => void
  onResume: () => void
  onEndSession: () => void
  onUpdateDescription: (description: string) => void
}

/**
 * Displays the session header with:
 * - Session title with inline editing
 * - Elapsed time display
 * - Session controls (pause/resume, end session)
 */
export function SessionHeader({
  description,
  elapsedTime,
  isPaused,
  onPause,
  onResume,
  onEndSession,
  onUpdateDescription,
}: SessionHeaderProps) {
  // State for inline title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(description)

  /**
   * Handles saving the edited title
   */
  const handleTitleSave = () => {
    if (editedTitle.trim() !== description) {
      onUpdateDescription(editedTitle.trim())
    }
    setIsEditingTitle(false)
  }

  return (
    <div className="flex items-center justify-between">
      {/* Session title with inline editing */}
      <div className="flex items-center gap-2">
        {isEditingTitle ? (
          <>
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="max-w-md"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave()
                if (e.key === 'Escape') {
                  setEditedTitle(description)
                  setIsEditingTitle(false)
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleTitleSave}
            >
              <CheckIcon className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div
            className="text-xl font-semibold cursor-pointer hover:text-blue-400"
            onClick={() => setIsEditingTitle(true)}
          >
            {description}
          </div>
        )}
      </div>

      {/* Session controls */}
      <div className="flex items-center gap-4">
        {/* Elapsed time display */}
        <div className="text-xl font-mono">
          {elapsedTime}
        </div>

        {/* Pause/Resume button */}
        <Button
          variant="outline"
          size="icon"
          onClick={isPaused ? onResume : onPause}
        >
          {isPaused ? (
            <PlayIcon className="h-4 w-4" />
          ) : (
            <PauseIcon className="h-4 w-4" />
          )}
        </Button>

        {/* End session button */}
        <Button
          variant="destructive"
          size="icon"
          onClick={onEndSession}
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 