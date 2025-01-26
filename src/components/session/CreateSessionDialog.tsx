import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { numberUtils } from '../../utils/numberHandling'
import { Label } from '../ui/label'

interface CreateSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (description: string, initialBalance: number) => void
  lastCompletedSessionBalance?: number
}

export function CreateSessionDialog({
  open,
  onOpenChange,
  onSubmit,
  lastCompletedSessionBalance
}: CreateSessionDialogProps) {
  const [description, setDescription] = useState('')
  const [initialBalance, setInitialBalance] = useState(lastCompletedSessionBalance || 0)

  useEffect(() => {
    if (open) {
      setInitialBalance(lastCompletedSessionBalance || 0)
      setDescription('')
    }
  }, [open, lastCompletedSessionBalance])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(description, initialBalance)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background/95 border">
        <DialogHeader>
          <DialogTitle>Start New Session</DialogTitle>
          <DialogDescription>
            Enter the session details to start tracking your earnings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Activity Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Mining, Trading, Bounty Hunting"
              className="border-primary/20 focus:border-primary bg-background/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="initialBalance">Initial Balance (aUEC)</Label>
            <Input
              id="initialBalance"
              type="text"
              value={numberUtils.formatDisplayNumber(initialBalance)}
              onChange={(e) => {
                const value = numberUtils.parseDisplayNumber(e.target.value)
                setInitialBalance(value)
              }}
              className="border-primary/20 focus:border-primary bg-background/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="default"
              disabled={!description.trim()}
            >
              Start Session
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 