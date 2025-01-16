import { ChartDataPoint } from '../../hooks/useChartData'
import { Card, CardContent } from '../ui/card'

interface ChartTooltipContentProps {
  payload?: any[]
  chartData: ChartDataPoint[]
  formatTime: (timestamp: Date) => string
}

export function ChartTooltipContent({ payload, chartData, formatTime }: ChartTooltipContentProps) {
  if (!payload?.[0]?.payload) return null

  const point = payload[0].payload as ChartDataPoint
  const pointIndex = chartData.findIndex(p => p.timestamp.getTime() === point.timestamp.getTime())
  const prevPoint = pointIndex > 0 ? chartData[pointIndex - 1] : null
  
  const renderContent = () => {
    const timeStr = formatTime(point.timestamp)
    const amountStr = point.amount.toLocaleString()

    if (point.type === 'session_start') {
      return (
        <div className="flex items-center space-x-1">
          <span>{timeStr} - Starting balance: <span className="text-white">{amountStr} aUEC</span></span>
        </div>
      )
    }
    
    if (point.type === 'session_end') {
      return (
        <div className="flex items-center space-x-1">
          <span>{timeStr} - Ending balance: <span className="text-white">{amountStr} aUEC</span></span>
        </div>
      )
    }
    
    if (point.type === 'earning') {
      return (
        <div className="flex items-center space-x-1">
          <span>
            {timeStr} - <span className="event-earning">Earned {point.amount.toLocaleString()} aUEC</span>
            {point.description && <span className="text-muted-foreground"> from {point.description}</span>}
          </span>
        </div>
      )
    }
    
    if (point.type === 'spending') {
      return (
        <div className="flex items-center space-x-1">
          <span>
            {timeStr} - <span className="event-spending">Spent {point.amount.toLocaleString()} aUEC</span>
            {point.description && <span className="text-muted-foreground"> on {point.description}</span>}
          </span>
        </div>
      )
    }
    
    if (point.type === 'balance') {
      const prevBalance = prevPoint?.balance ?? point.amount
      const difference = point.amount - prevBalance
      return (
        <div className="flex items-center space-x-1">
          <span>
            {timeStr} - <span className="event-balance-adjust">Balance adjusted to {amountStr} aUEC</span>
            {' '}(<span className={difference > 0 ? 'event-earning' : 'event-spending'}>
              {difference > 0 ? '+' : ''}{difference.toLocaleString()} aUEC
            </span>)
          </span>
        </div>
      )
    }

    // Default case - should never happen as all types are handled above
    return null
  }

  return (
    <Card className="border-0 bg-card/80 backdrop-blur-md">
      <CardContent className="p-3 space-y-2">
        {renderContent()}
        <div className="text-muted-foreground">
          Balance: <span>{point.balance.toLocaleString()} aUEC</span>
        </div>
      </CardContent>
    </Card>
  )
} 