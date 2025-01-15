import { useState, useEffect, useMemo } from 'react'
import { Session } from '../App'

export interface ChartDataPoint {
  timestamp: Date
  time: string
  balance: number
  type: string
  description?: string
  amount: number
}

interface UseChartDataReturn {
  chartData: ChartDataPoint[]
  hoveredEventTime: string | null
  setHoveredEventTime: (time: string | null) => void
}

export function useChartData(session: Session): UseChartDataReturn {
  const [hoveredEventTime, setHoveredEventTime] = useState<string | null>(null)

  // Generate chart data from session events
  const chartData = useMemo(() => {
    // Initialize with starting balance point at x=0
    const data: ChartDataPoint[] = [
      {
        timestamp: session.startTime,
        time: '0',
        balance: session.initialBalance,
        type: 'session_start',
        description: 'Starting balance',
        amount: session.initialBalance
      }
    ]

    let currentBalance = session.initialBalance
    
    // Sort events chronologically
    const sortedEvents = [...session.events].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    )

    // Generate data points for each event
    sortedEvents.forEach(event => {
      if (event.type === 'balance') {
        currentBalance = event.amount
      } else {
        currentBalance += event.type === 'earning' ? event.amount : -event.amount
      }
      
      const elapsed = event.timestamp.getTime() - session.startTime.getTime()
      const elapsedSeconds = Math.floor(elapsed / 1000)
      
      data.push({
        timestamp: event.timestamp,
        time: elapsedSeconds.toString(),
        balance: currentBalance,
        type: event.type,
        description: event.description,
        amount: event.amount
      })
    })

    return data
  }, [session.events, session.initialBalance, session.startTime])

  return {
    chartData,
    hoveredEventTime,
    setHoveredEventTime
  }
} 