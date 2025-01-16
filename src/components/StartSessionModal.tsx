import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface StartSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onStart: (description: string, initialBalance: number) => void
  lastSessionBalance?: number
}

export default function StartSessionModal({
  isOpen,
  onClose,
  onStart,
  lastSessionBalance
}: StartSessionModalProps) {
  const [description, setDescription] = useState('')
  const [initialBalance, setInitialBalance] = useState('')

  // Reset form and prepopulate balance when dialog opens
  useEffect(() => {
    if (isOpen) {
      setDescription('')
      setInitialBalance(lastSessionBalance ? lastSessionBalance.toLocaleString() : '')
    }
  }, [isOpen, lastSessionBalance])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (description && initialBalance) {
      onStart(description, Number(initialBalance.replace(/,/g, '')))
      setDescription('')
      setInitialBalance('')
    }
  }

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '')
    const numValue = parseInt(value)
    if (!isNaN(numValue)) {
      setInitialBalance(numValue.toLocaleString())
    } else if (value === '') {
      setInitialBalance('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start New Session</DialogTitle>
          <DialogDescription>
            Enter the session details to start tracking your earnings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Activity Description</Label>
              <Input
                id="description"
                placeholder="e.g., Mining, Trading, Bounty Hunting"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="balance">Initial Balance (aUEC)</Label>
              <Input
                id="balance"
                type="text"
                placeholder="Enter your current aUEC balance"
                value={initialBalance}
                onChange={handleBalanceChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!description || !initialBalance}>
              Start Session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 