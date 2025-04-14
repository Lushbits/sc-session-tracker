import { LineChart, Line, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { ChartDot } from './ChartDot'
import { ChartTooltipContent } from './chart/ChartTooltipContent'
import { ProfitDisplay } from './chart/ProfitDisplay'
import { chartStyles } from './chart/chartConfig'
import { ChartDataPoint } from '../hooks/useChartData'
import { formatSeconds } from '../utils/timeFormatting'

interface SessionChartProps {
  chartData: ChartDataPoint[]
  hoveredEventTime: string | null
  onHover: (time: string | null) => void
  formatTime: (timestamp: Date) => string
  profitPerHour: number
}

/**
 * Renders a line chart showing the balance history over time.
 * Includes interactive features like hover effects and tooltips.
 */
export function SessionChart({
  chartData,
  hoveredEventTime,
  onHover,
  formatTime,
  profitPerHour
}: SessionChartProps) {
  // Convert time strings to numbers for the chart
  const processedData = chartData.map(point => ({
    ...point,
    time: parseInt(point.time, 10)
  }))

  return (
    <div className={chartStyles.container}>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={processedData}
            onMouseMove={(e) => {
              if (e.activePayload?.[0]?.payload) {
                onHover(e.activePayload[0].payload.time.toString())
              }
            }}
            onMouseLeave={() => onHover(null)}
          >
            <XAxis 
              dataKey="time"
              stroke="hsl(var(--muted-foreground))"
              tick={chartStyles.tick}
              type="number"
              domain={[0, 'dataMax']}
              tickFormatter={formatSeconds}
              ticks={(function() {
                if (processedData.length < 2) return [0];
                
                const maxTime = Math.max(...processedData.map(d => d.time));
                const ticks = [0]; // Always include start time
                
                // Choose interval based on session duration
                let interval;
                if (maxTime <= 30 * 60) { // <= 30 minutes
                  interval = 5 * 60; // 5 minute intervals
                } else if (maxTime <= 2 * 60 * 60) { // <= 2 hours
                  interval = 15 * 60; // 15 minute intervals
                } else if (maxTime <= 6 * 60 * 60) { // <= 6 hours
                  interval = 30 * 60; // 30 minute intervals
                } else if (maxTime <= 24 * 60 * 60) { // <= 24 hours
                  interval = 1 * 60 * 60; // 1 hour intervals
                } else { // > 24 hours
                  interval = 4 * 60 * 60; // 4 hour intervals
                }
                
                // Add ticks at the determined interval
                let currentTime = interval;
                while (currentTime < maxTime) {
                  ticks.push(currentTime);
                  currentTime += interval;
                }
                
                // Always include the end time if it's not already included
                // and isn't too close to the last tick
                const lastTick = ticks[ticks.length - 1];
                if (lastTick !== maxTime && (maxTime - lastTick) > interval * 0.2) {
                  ticks.push(maxTime);
                }
                
                return ticks;
              })()}
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
              width={60}
              tickMargin={4}
              label={{
                value: 'aUEC',
                angle: -90,
                position: 'insideLeft',
                style: chartStyles.axisLabel
              }}
            />
            <Tooltip
              content={({ payload }) => (
                <ChartTooltipContent
                  payload={payload}
                  chartData={chartData}
                  formatTime={formatTime}
                />
              )}
              wrapperStyle={{ outline: 'none' }}
            />
            <Line
              type="monotone"
              dataKey="balance"
              {...chartStyles.line}
              dot={({ cx, cy, payload, index }) => (
                <ChartDot 
                  key={`dot-${payload.timestamp.getTime()}-${index}`}
                  cx={cx} 
                  cy={cy} 
                  payload={payload}
                  hoveredEventTime={hoveredEventTime}
                />
              )}
              activeDot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ProfitDisplay profitPerHour={profitPerHour} />
    </div>
  )
} 