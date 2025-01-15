interface ChartDataPoint {
  timestamp: Date
  time: string
  balance: number
  type: string
  description?: string
  amount: number
}

/**
 * Formats the tooltip label for a chart data point.
 * Shows different information based on event type and includes color-coded amounts.
 */
export function formatTooltipLabel(event: ChartDataPoint, chartData: ChartDataPoint[], formatTime: (timestamp: Date) => string) {
  const timeStr = formatTime(event.timestamp)
  const amountStr = event.amount.toLocaleString()
  // Color coding based on event type
  const colorClass = event.type === 'earning' ? 'text-green-400' :
                    event.type === 'spending' ? 'text-red-400' :
                    'text-blue-400'

  // Starting balance event
  if (event.type === 'balance' && event.description === 'Starting balance') {
    return (
      <span>
        {timeStr} - Starting balance: <span className={colorClass}>{amountStr} aUEC</span>
      </span>
    )
  }

  // Balance adjustment event
  if (event.type === 'balance') {
    // Calculate difference from previous balance
    const eventIndex = chartData.findIndex(e => e.timestamp === event.timestamp)
    const prevBalance = eventIndex > 0 ? chartData[eventIndex - 1].balance : event.amount
    const difference = event.amount - prevBalance
    const diffStr = difference > 0 ? `+${difference.toLocaleString()}` : difference.toLocaleString()
    return (
      <span>
        {timeStr} - Balance adjusted to <span className={colorClass}>{amountStr} aUEC</span> (<span className={difference >= 0 ? 'text-green-400' : 'text-red-400'}>{diffStr} aUEC</span>)
      </span>
    )
  }

  // Earning event
  if (event.type === 'earning') {
    return (
      <span>
        {timeStr} - Earned <span className={colorClass}>{amountStr} aUEC</span>{event.description ? ` from ${event.description}` : ''}
      </span>
    )
  }

  // Spending event
  if (event.type === 'spending') {
    return (
      <span>
        {timeStr} - Spent <span className={colorClass}>{amountStr} aUEC</span>{event.description ? ` on ${event.description}` : ''}
      </span>
    )
  }

  return timeStr
}

/**
 * Tooltip styling configuration.
 * Uses CSS variables for theme-aware colors and includes backdrop blur effect.
 */
export const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: 'none',
    borderRadius: '0.25rem',
    color: 'hsl(var(--foreground))',
    fontFamily: 'Space Grotesk, sans-serif',
    fontSize: 12,
    fontWeight: 600,
    padding: '8px',
    lineHeight: '1.2',
    boxShadow: '0 0 0 1px hsl(var(--border)), 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    background: 'hsl(var(--card) / 0.8)'
  },
  itemStyle: {
    padding: '2px 0',
    color: 'hsl(var(--muted-foreground))'
  },
  wrapperStyle: {
    outline: 'none'
  }
} 