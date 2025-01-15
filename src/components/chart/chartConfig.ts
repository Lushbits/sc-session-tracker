export const chartStyles = {
  container: "border border-border rounded-lg p-4 h-[400px] dark:bg-[hsl(222,84%,2.9%)] bg-[hsl(220,23%,93%)] flex flex-col",
  tick: {
    fill: "hsl(var(--muted-foreground))",
    fontFamily: 'Space Grotesk, sans-serif',
    fontSize: 12,
    fontWeight: 600
  },
  axisLabel: {
    fill: "hsl(var(--muted-foreground))",
    fontFamily: 'Space Grotesk, sans-serif',
    fontSize: 12,
    fontWeight: 600,
    textAnchor: 'middle'
  },
  line: {
    stroke: "hsl(var(--primary))",
    strokeWidth: 2
  }
}

export const tooltipStyles = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '0.5rem',
    padding: '0.75rem',
    boxShadow: '0 0 0 1px hsl(var(--border)), 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    background: 'hsl(var(--card) / 0.8)'
  },
  itemStyle: {
    color: 'hsl(var(--foreground))',
    fontFamily: 'Space Grotesk, sans-serif',
    fontSize: '0.875rem',
    padding: '0.25rem 0'
  },
  wrapperStyle: {
    zIndex: 1000
  }
}

export const profitDisplayStyles = {
  label: "text-xs text-gray-400",
  value: "text-base",
  positive: "text-green-400",
  negative: "text-red-400"
} 