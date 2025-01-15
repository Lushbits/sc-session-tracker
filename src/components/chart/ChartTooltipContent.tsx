import { ChartDataPoint } from '../../hooks/useChartData'
import { tooltipStyles } from './chartConfig'

interface ChartTooltipContentProps {
  payload?: any[]
  chartData: ChartDataPoint[]
  formatTime: (timestamp: Date) => string
}

export function ChartTooltipContent({ payload, chartData, formatTime }: ChartTooltipContentProps) {
  if (!payload?.[0]?.payload) return null

  const point = payload[0].payload as ChartDataPoint
  const prevPoint = chartData[chartData.indexOf(point) - 1]
  const difference = point.balance - (prevPoint?.balance ?? point.balance)
  
  const renderContent = () => {
    const timeStr = formatTime(point.timestamp)
    const amountStr = point.amount.toLocaleString()

    if (point.type === 'session_start') {
      return (
        <div style={tooltipStyles.itemStyle}>
          {timeStr} - Starting balance: <span className="text-white">{amountStr} aUEC</span>
        </div>
      )
    }
    
    if (point.type === 'session_end') {
      return (
        <div style={tooltipStyles.itemStyle}>
          {timeStr} - Ending balance: <span className="text-white">{amountStr} aUEC</span>
        </div>
      )
    }
    
    if (point.type === 'earning') {
      const earnedAmount = point.balance - (prevPoint?.balance ?? point.balance)
      return (
        <div style={tooltipStyles.itemStyle}>
          {timeStr} - <span className="text-green-500">Earned {earnedAmount.toLocaleString()} aUEC</span>
          {point.description && <span className="text-gray-400"> from {point.description}</span>}
        </div>
      )
    }
    
    if (point.type === 'spending') {
      const spentAmount = (prevPoint?.balance ?? point.balance) - point.balance
      return (
        <div style={tooltipStyles.itemStyle}>
          {timeStr} - <span className="text-red-500">Spent {spentAmount.toLocaleString()} aUEC</span>
          {point.description && <span className="text-gray-400"> on {point.description}</span>}
        </div>
      )
    }
    
    if (point.type === 'balance') {
      return (
        <div style={tooltipStyles.itemStyle}>
          {timeStr} - <span className="text-cyan-500">Balance adjusted to {amountStr} aUEC</span>
          {difference !== 0 && (
            <span>
              {' '}(<span className={difference > 0 ? 'text-green-500' : 'text-red-500'}>
                {difference > 0 ? '+' : '-'}{Math.abs(difference).toLocaleString()} aUEC
              </span>)
            </span>
          )}
        </div>
      )
    }
    
    // Default case - should never happen as all types are handled above
    return null
  }

  return (
    <div style={tooltipStyles.contentStyle}>
      {renderContent()}
      <div style={tooltipStyles.itemStyle}>
        Balance: <span className="text-gray-400">{point.balance.toLocaleString()} aUEC</span>
      </div>
    </div>
  )
} 