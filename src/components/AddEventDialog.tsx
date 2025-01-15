import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface AddEventDialogProps {
  type: 'spending' | 'earning'
  onAddEvent: (amount: number, description?: string) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function AddEventDialog({ type, onAddEvent, isOpen, onOpenChange }: AddEventDialogProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const numAmount = parseFloat(amount.replace(/,/g, ''))
    if (isNaN(numAmount)) {
      setError('Please enter a valid number')
      return
    }

    if (numAmount <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    if (numAmount > 1000000000000) {
      setError('Amount cannot exceed 1 trillion aUEC')
      return
    }

    onAddEvent(numAmount, description || undefined)
    setAmount('')
    setDescription('')
    onOpenChange(false)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '')
    const numValue = parseInt(value)
    if (!isNaN(numValue)) {
      setAmount(numValue.toLocaleString())
    } else if (value === '') {
      setAmount('')
    }
    setError(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record {type === 'earning' ? 'Earning' : 'Spend'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (aUEC)</Label>
            <Input
              id="amount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Enter amount"
              required
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'earning' ? 'e.g., Mining run, Mission reward' : 'e.g., Ship components, Armor'}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit"
              className={type === 'earning' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              Record {type === 'earning' ? 'Earning' : 'Spend'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 