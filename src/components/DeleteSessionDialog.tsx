import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"

interface DeleteSessionDialogProps {
  sessionId: string | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirmDelete: () => Promise<void>
  logCount: number
}

export function DeleteSessionDialog({
  sessionId: _sessionId,
  isOpen,
  onOpenChange,
  onConfirmDelete,
  logCount
}: DeleteSessionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Handle delete confirmation
  const handleConfirm = async () => {
    try {
      setIsLoading(true)
      await onConfirmDelete()
    } finally {
      setIsLoading(false)
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Session</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this session? This action cannot be undone.
            {logCount > 0 && (
              <p className="mt-2">
                Your {logCount} Captain's log{logCount !== 1 ? 's' : ''} attached to this session will be preserved.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 