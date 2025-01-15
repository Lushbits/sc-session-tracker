import { XAxis, YAxis } from 'recharts'
import { chartStyles } from './chartConfig'
import { formatSeconds } from '../../utils/timeFormatting'

interface ChartAxesProps {
  width?: number
}

export function ChartAxes({ width = 60 }: ChartAxesProps) {
  return (
    <>
      <XAxis 
        dataKey="time"
        stroke="hsl(var(--muted-foreground))"
        tick={chartStyles.tick}
        type="number"
        domain={[0, 'dataMax']}
        tickFormatter={formatSeconds}
      />
      <YAxis
        stroke="hsl(var(--muted-foreground))"
        tick={chartStyles.tick}
        tickFormatter={(value) => {
          if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`
          }
          if (value >= 1000) {
            return `${(value / 1000).toFixed(0)}K`
          }
          return value.toString()
        }}
        width={width}
        tickMargin={4}
        label={{
          value: 'aUEC',
          angle: -90,
          position: 'insideLeft',
          style: chartStyles.axisLabel
        }}
      />
    </>
  )
} 