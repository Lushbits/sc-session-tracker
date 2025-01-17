import { Button } from './ui/button'
import { RotateCcw } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip"

interface SessionStatsProps {
  currentBalance: number
  stats: {
    totalEarnings: number
    totalSpend: number
    sessionProfit: number
  }
  onUpdateBalance?: () => void
  hideUpdateBalance?: boolean
}

/**
 * Displays current session statistics including:
 * - Current balance with update button
 * - Total earnings and spending
 * - Session profit
 */
export function SessionStats({
  currentBalance,
  stats,
  onUpdateBalance,
  hideUpdateBalance
}: SessionStatsProps) {
  return (
    <div className="flex items-center justify-between">
      {/* Current balance with update button */}
      <div className="flex items-center gap-2">
        <div className="text-4xl font-bold">{currentBalance.toLocaleString()} aUEC</div>
        {!hideUpdateBalance && onUpdateBalance && (
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={onUpdateBalance}
                  className="h-8 w-8 update-balance-icon"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Update Balance</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Session statistics in a row */}
      <div className="flex items-center gap-8">
        <div>
          <div className="text-xs text-gray-400 text-right">Total Earnings</div>
          <div className="text-base event-earning text-right">{stats.totalEarnings.toLocaleString()} aUEC</div>
        </div>

        <div>
          <div className="text-xs text-gray-400 text-right">Total Spend</div>
          <div className="text-base event-spending text-right">{stats.totalSpend.toLocaleString()} aUEC</div>
        </div>

        <div>
          <div className="text-xs text-gray-400 text-right">Session Profit</div>
          <div className={`text-base text-right ${stats.sessionProfit >= 0 ? 'event-earning' : 'event-spending'}`}>
            {stats.sessionProfit >= 0 ? '+' : ''}{stats.sessionProfit.toLocaleString()} aUEC
          </div>
        </div>
      </div>
    </div>
  )
} 