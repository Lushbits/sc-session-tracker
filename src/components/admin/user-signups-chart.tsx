import { CumulativeUserSignup } from '@/services/admin'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  TooltipProps
} from 'recharts'
import { format, parseISO, startOfMonth, addMonths, isBefore } from 'date-fns'

// Custom tooltip component with better dark mode styling
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) {
    return null
  }
  
  return (
    <div className="bg-background border border-border rounded-md shadow-md p-2 text-foreground">
      <p className="font-medium">{`Date: ${format(new Date(label), 'MMM dd')}`}</p>
      <p className="text-primary">{`${payload[0].value} users`}</p>
    </div>
  )
}

interface UserSignupsChartProps {
  data: CumulativeUserSignup[]
}

export function UserSignupsChart({ data }: UserSignupsChartProps) {
  // Convert string dates to timestamps for proper time scaling
  const chartData = data
    .map(item => ({
      ...item,
      // Keep the original date as a timestamp for the X-axis
      date: parseISO(item.date).getTime(),
      // Format the display date for tooltips/labels
      displayDate: format(parseISO(item.date), 'MMM dd'),
      count: Number(item.count)
    }))
    .sort((a, b) => a.date - b.date) // Ensure data is sorted chronologically

  // Define the date range based on the data
  const getDateRange = () => {
    if (chartData.length === 0) return [new Date().getTime(), new Date().getTime()]
    
    const startDate = new Date(chartData[0].date).getTime()
    const endDate = new Date(chartData[chartData.length - 1].date).getTime()
    
    return [startDate, endDate]
  }

  // Generate ticks for the 1st of each month between start and end date
  const generateMonthlyTicks = () => {
    if (chartData.length === 0) return []
    
    const [startTimestamp, endTimestamp] = getDateRange()
    
    // Find the start of the month after our start date
    let currentDate = startOfMonth(new Date(startTimestamp))
    // Move to the next month's 1st
    currentDate = addMonths(currentDate, 1)
    
    const ticks = []
    
    // Generate ticks for the 1st of each month
    while (isBefore(currentDate, new Date(endTimestamp))) {
      ticks.push(currentDate.getTime())
      currentDate = addMonths(currentDate, 1)
    }
    
    return ticks
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            type="number" 
            domain={getDateRange()} 
            scale="time"
            ticks={generateMonthlyTicks()}
            tickFormatter={(timestamp) => format(new Date(timestamp), 'MMM d')}
          />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#82ca9d" 
            name="Users" 
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 