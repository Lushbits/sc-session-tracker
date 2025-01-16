interface ChartDotProps {
  cx: number
  cy: number
  payload: {
    type: string
    time: string
  }
  hoveredEventTime: string | null
}

/**
 * Returns the appropriate color for a chart dot based on event type.
 * Uses consistent colors across the application for different event types.
 */
export function getDotColor(type: string) {
  switch (type) {
    case 'earning': return `hsl(var(--event-earning))`
    case 'spending': return `hsl(var(--event-spending))`
    case 'balance': return `hsl(var(--event-balance-adjust))`
    default: return `hsl(var(--primary))`
  }
}

/**
 * Renders a single dot on the chart.
 * Includes hover effects and color coding based on event type.
 */
export function ChartDot({ cx, cy, payload, hoveredEventTime }: ChartDotProps) {
  const isHovered = hoveredEventTime === payload.time
  
  // Don't render the dot if cx or cy is not a valid number
  if (typeof cx !== 'number' || isNaN(cx) || typeof cy !== 'number' || isNaN(cy)) {
    return null;
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={isHovered ? 10 : 6}
      fill={getDotColor(payload.type)}
      stroke={isHovered ? "hsl(var(--foreground))" : "none"}
      strokeWidth={2}
    />
  )
} 