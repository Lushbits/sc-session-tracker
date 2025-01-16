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

export const profitDisplayStyles = {
  label: "text-xs text-muted-foreground",
  value: "text-base",
  positive: "event-earning",
  negative: "event-spending"
} 