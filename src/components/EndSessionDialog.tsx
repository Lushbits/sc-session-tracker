import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { SessionEvent } from '../types'
import { numberUtils } from '../utils/numberHandling'

interface EndSessionDialogProps {
  currentBalance: number
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onEndSession: (sessionLog?: string) => void
  onAddEvent: (type: SessionEvent['type'], amount: number, description?: string) => void
}

export function EndSessionDialog({
  currentBalance,
  isOpen,
  onOpenChange,
  onEndSession,
  onAddEvent
}: EndSessionDialogProps) {
  const [finalBalance, setFinalBalance] = useState(() => numberUtils.formatDisplayNumber(currentBalance))
  const [sessionLog, setSessionLog] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleBalanceChange = (value: string) => {
    setFinalBalance(numberUtils.formatInputValue(value))
  }

  const getDifference = () => {
    const numBalance = numberUtils.parseDisplayNumber(finalBalance)
    return numberUtils.calculateDifference(numBalance, currentBalance)
  }

  const handleEndSession = async () => {
    const numBalance = numberUtils.parseDisplayNumber(finalBalance)
    if (numBalance >= 0) {
      try {
        setError(null)
        // First close the dialog
        onOpenChange(false)
        // Create a balance event for the final balance
        await onAddEvent('balance', numBalance)
        // End the session
        await onEndSession(sessionLog)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to end session')
        console.error('Failed to end session:', error)
        // Reopen the dialog if there's an error
        onOpenChange(true)
      }
    }
  }

  // Reset state when dialog is opened/closed
  useEffect(() => {
    if (isOpen) {
      setFinalBalance(numberUtils.formatDisplayNumber(currentBalance))
      setSessionLog('')
      setError(null)
    }
  }, [isOpen, currentBalance])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>End Session</DialogTitle>
          <DialogDescription>
            Enter your final balance and optionally add a session summary
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label>Current Balance: {numberUtils.formatDisplayNumber(currentBalance)} aUEC</Label>
            <Input
              type="text"
              value={finalBalance}
              onChange={(e) => handleBalanceChange(e.target.value)}
              placeholder="Enter final balance"
              className="mt-2"
            />
          </div>

          {getDifference() !== 0 && (
            <div>
              <Label>Difference: </Label>
              <span className={getDifference() > 0 ? 'event-earning' : 'event-spending'}>
                {getDifference() > 0 ? '+' : '-'}{Math.abs(getDifference()).toLocaleString()} aUEC
              </span>
            </div>
          )}

          <div>
            <Label>Session Summary (optional)</Label>
            <textarea
              value={sessionLog}
              onChange={(e) => setSessionLog(e.target.value)}
              placeholder="Add notes about your session..."
              className="w-full min-h-[100px] mt-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 input-glow resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleEndSession}
            disabled={numberUtils.parseDisplayNumber(finalBalance) < 0}
          >
            End Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 