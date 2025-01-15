import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Event } from '../App'

interface EndSessionDialogProps {
  currentBalance: number
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onEndSession: () => void
  onAddEvent: (type: Event['type'], amount: number, description?: string) => void
}

export function EndSessionDialog({
  currentBalance,
  isOpen,
  onOpenChange,
  onEndSession,
  onAddEvent
}: EndSessionDialogProps) {
  const [finalBalance, setFinalBalance] = useState('')

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

  const handleEndSession = () => {
    const numBalance = parseFloat(finalBalance.replace(/,/g, ''))
    if (!isNaN(numBalance)) {
      // Create a balance event for the final balance
      onAddEvent('balance', numBalance)
      onEndSession()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>End Session</DialogTitle>
          <DialogDescription>
            Enter your final balance to end the session
          </DialogDescription>
        </DialogHeader>

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
              <span className={getDifference() > 0 ? 'text-green-500' : 'text-red-500'}>
                {getDifference() > 0 ? '+' : ''}{getDifference().toLocaleString()} aUEC
              </span>
            </div>
          )}
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