import { Button } from '../ui/button'
import { Search, Trash2 } from 'lucide-react'
import { Session } from '../../types'
import { formatNumber } from '../../utils/numberFormatting'
import { formatLocalDateTime } from '../../utils/dateFormatting'
import { formatTimeAgo } from '../../utils/timeFormatting'

interface SessionTableRowProps {
  session: Session
  stats: {
    duration: { hours: number; minutes: number }
    totalEarnings: number
    totalSpend: number
    sessionProfit: number
    profitPerHour: number
  }
  onView: () => void
  onDelete: () => void
}

export function SessionTableRow({ session, stats, onView, onDelete }: SessionTableRowProps) {
  const formattedDate = `${formatTimeAgo(new Date(session.startTime))} • ${formatLocalDateTime(session.startTime)} • ${session.endTime ? 'Completed' : 'Active'}`

  return (
    <tr className="hover:bg-white/5 border-t border-white/5">
      <td className="py-5 px-4">
        <div>
          <div className="text-base mb-1">{session.description || 'Untitled Session'}</div>
          <div className="text-xs text-muted-foreground">{formattedDate}</div>
        </div>
      </td>
      <td className="py-5 px-4 text-sm text-[hsl(var(--event-earning))] text-right">
        {stats.totalEarnings > 0 ? `+${formatNumber(stats.totalEarnings)} aUEC` : '0 aUEC'}
      </td>
      <td className="py-5 px-4 text-sm text-[hsl(var(--event-spending))] text-right">
        {stats.totalSpend > 0 ? `-${formatNumber(stats.totalSpend)} aUEC` : '0 aUEC'}
      </td>
      <td className={`py-5 px-4 text-sm text-right ${stats.sessionProfit >= 0 ? 'text-[hsl(var(--event-earning))]' : 'text-[hsl(var(--event-spending))]'}`}>
        {stats.sessionProfit > 0 ? '+' : ''}{formatNumber(stats.sessionProfit)} aUEC
      </td>
      <td className="py-5 px-4 text-sm text-muted-foreground text-right">
        {stats.duration.hours} hours {stats.duration.minutes} minutes
      </td>
      <td className="py-5 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onView} 
            title="View Details"
            className="hover:bg-primary hover:text-primary-foreground"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDelete} 
            title="Delete Session"
            className="hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
} 