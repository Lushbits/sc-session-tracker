import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { SessionEvent } from '../types'
import { BalanceInput } from './balance/BalanceInput'
import { CategoryButtons } from './balance/CategoryButtons'
import { CustomInputSection } from './balance/CustomInputSection'
import { numberUtils } from '../utils/numberHandling'

const EARNING_CATEGORIES = ['Mining', 'Trading', 'Bounty Hunting', 'Mission']
const SPENDING_CATEGORIES = ['Ship Purchase', 'Ship Components', 'Consumables', 'Item Purchase']

interface UpdateBalanceDialogProps {
  currentBalance: number
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onAddEvent: (type: SessionEvent['type'], amount: number, description?: string) => void
  onUpdateBalance: (newBalance: number) => void
}

interface DialogState {
  newBalance: string
  isCustomMode: boolean
  customDescription: string
}

export function UpdateBalanceDialog({
  currentBalance,
  isOpen,
  onOpenChange,
  onAddEvent,
  onUpdateBalance
}: UpdateBalanceDialogProps) {
  const [state, setState] = useState<DialogState>({
    newBalance: '',
    isCustomMode: false,
    customDescription: ''
  })

  useEffect(() => {
    if (!isOpen) {
      setState({
        newBalance: '',
        isCustomMode: false,
        customDescription: ''
      })
    }
  }, [isOpen])

  const handleBalanceChange = (value: string) => {
    if (state.isCustomMode) return
    setState({ ...state, newBalance: numberUtils.formatInputValue(value) })
  }

  const getDifference = () => {
    const numBalance = numberUtils.parseDisplayNumber(state.newBalance)
    return numberUtils.calculateDifference(numBalance, currentBalance)
  }

  const handleCategorySelect = (category: string) => {
    const numBalance = numberUtils.parseDisplayNumber(state.newBalance)
    const difference = getDifference()
    
    if (numBalance > 0) {
      if (difference > 0) {
        onAddEvent('earning', difference, category)
      } else if (difference < 0) {
        onAddEvent('spending', Math.abs(difference), category)
      }
      onOpenChange(false)
      setState({
        newBalance: '',
        isCustomMode: false,
        customDescription: ''
      })
    }
  }

  const handleCustomSubmit = () => {
    const numBalance = numberUtils.parseDisplayNumber(state.newBalance)
    const difference = getDifference()
    
    if (numBalance > 0 && state.customDescription) {
      if (difference > 0) {
        onAddEvent('earning', difference, state.customDescription)
      } else if (difference < 0) {
        onAddEvent('spending', Math.abs(difference), state.customDescription)
      }
      onOpenChange(false)
      setState({
        newBalance: '',
        isCustomMode: false,
        customDescription: ''
      })
    }
  }

  const handleSimpleUpdate = () => {
    const numBalance = numberUtils.parseDisplayNumber(state.newBalance)
    if (numBalance > 0) {
      onUpdateBalance(numBalance)
      onOpenChange(false)
      setState({
        newBalance: '',
        isCustomMode: false,
        customDescription: ''
      })
    }
  }

  const difference = getDifference()
  const isEarning = difference > 0

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Balance</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <BalanceInput
            currentBalance={currentBalance}
            value={state.newBalance}
            onChange={handleBalanceChange}
            disabled={state.isCustomMode}
            difference={difference}
          />

          {difference !== 0 && !state.isCustomMode && (
            <CategoryButtons
              isEarning={isEarning}
              categories={isEarning ? EARNING_CATEGORIES : SPENDING_CATEGORIES}
              onSelect={handleCategorySelect}
              onCustomClick={() => setState({...state, isCustomMode: true})}
            />
          )}

          {state.isCustomMode && (
            <CustomInputSection
              isEarning={isEarning}
              value={state.customDescription}
              onChange={(value) => setState({...state, customDescription: value})}
              onSubmit={handleCustomSubmit}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {difference !== 0 && !state.isCustomMode && (
            <Button
              variant="default"
              className="balance-adjust-button"
              onClick={handleSimpleUpdate}
            >
              Just Update Balance
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 