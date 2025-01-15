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
    case 'earning': return '#22C55E' // green for earnings
    case 'spending': return '#EF4444' // red for spending
    case 'balance': return '#0EA5E9' // cyan for balance updates
    default: return '#60A5FA' // blue fallback
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
      r={isHovered ? 10 : 6} // Increased both normal and hover radius
      fill={getDotColor(payload.type)}
      stroke={isHovered ? "#fff" : "none"} // White border on hover
      strokeWidth={2}
    />
  )
} 