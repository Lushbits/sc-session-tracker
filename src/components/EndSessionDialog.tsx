import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Event } from '../App'

interface EndSessionDialogProps {
  currentBalance: number
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onEndSession: (sessionLog?: string) => void
  onAddEvent: (type: Event['type'], amount: number, description?: string) => void
}

export function EndSessionDialog({
  currentBalance,
  isOpen,
  onOpenChange,
  onEndSession,
  onAddEvent
}: EndSessionDialogProps) {
  const [finalBalance, setFinalBalance] = useState(() => currentBalance.toLocaleString())
  const [sessionLog, setSessionLog] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleBalanceChange = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, '')
    const num = parseFloat(cleaned)
    if (isNaN(num)) {
      setFinalBalance('')
    } else {
      setFinalBalance(num.toLocaleString())
    }
  }

  const getDifference = () => {
    const numBalance = parseFloat(finalBalance.replace(/,/g, ''))
    if (isNaN(numBalance)) return 0
    return numBalance - currentBalance
  }

  const handleEndSession = async () => {
    const numBalance = parseFloat(finalBalance.replace(/,/g, ''))
    if (!isNaN(numBalance)) {
      try {
        setError(null)
        // Create a balance event for the final balance
        await onAddEvent('balance', numBalance)
        await onEndSession(sessionLog === '' ? undefined : sessionLog)
        onOpenChange(false)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to end session')
        console.error('Failed to end session:', error)
      }
    }
  }

  // Reset state when dialog is opened/closed
  useEffect(() => {
    if (isOpen) {
      setFinalBalance(currentBalance.toLocaleString())
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
            <Label>Current Balance: {currentBalance.toLocaleString()} aUEC</Label>
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
            disabled={!finalBalance}
          >
            End Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 