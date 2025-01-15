import { AddEventDialog } from './AddEventDialog'
import { UpdateBalanceDialog } from './UpdateBalanceDialog'
import { Event } from '../App'

interface SessionDialogsProps {
  currentBalance: number
  showSpendDialog: boolean
  showEarningDialog: boolean
  showBalanceDialog: boolean
  onAddEvent: (type: Event['type'], amount: number, description?: string) => void
  onSpendDialogChange: (open: boolean) => void
  onEarningDialogChange: (open: boolean) => void
  onBalanceDialogChange: (open: boolean) => void
}

export function SessionDialogs({
  currentBalance,
  showSpendDialog,
  showEarningDialog,
  showBalanceDialog,
  onAddEvent,
  onSpendDialogChange,
  onEarningDialogChange,
  onBalanceDialogChange
}: SessionDialogsProps) {
  return (
    <>
      <AddEventDialog
        type="spending"
        onAddEvent={(amount, description) => onAddEvent('spending', amount, description)}
        isOpen={showSpendDialog}
        onOpenChange={onSpendDialogChange}
      />
      <AddEventDialog
        type="earning"
        onAddEvent={(amount, description) => onAddEvent('earning', amount, description)}
        isOpen={showEarningDialog}
        onOpenChange={onEarningDialogChange}
      />
      <UpdateBalanceDialog
        currentBalance={currentBalance}
        onAddEvent={onAddEvent}
        isOpen={showBalanceDialog}
        onOpenChange={onBalanceDialogChange}
      />
    </>
  )
} 