import { DailySessionCount } from '@/services/admin'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  TooltipProps
} from 'recharts'
import { format, parseISO, startOfMonth, addMonths, isBefore, addDays, startOfDay } from 'date-fns'

// Custom tooltip component with better dark mode styling
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) {
    return null
  }
  
  return (
    <div className="bg-background border border-border rounded-md shadow-md p-2 text-foreground">
      <p className="font-medium">{`Date: ${format(new Date(label), 'MMM dd')}`}</p>
      <p className="text-primary">{`${payload[0].value} sessions`}</p>
    </div>
  )
}

interface SessionsPerDayChartProps {
  data: DailySessionCount[]
}

export function SessionsPerDayChart({ data }: SessionsPerDayChartProps) {
  // Convert string dates to timestamps for proper time scaling
  const sessionData = data
    .map(item => ({
      date: parseISO(item.date).getTime(),
      displayDate: format(parseISO(item.date), 'MMM dd'),
      count: Number(item.count)
    }))
    .sort((a, b) => a.date - b.date)

  // Define fixed start date (January 15th of current year) and end date (today)
  const currentYear = new Date().getFullYear()
  const startDate = new Date(currentYear, 0, 15).getTime() // Jan 15th of current year
  const endDate = new Date().getTime() // Today

  // Generate all dates between start and end date
  const generateAllDates = () => {
    const dates = []
    let currentDate = startOfDay(new Date(startDate))
    
    while (isBefore(currentDate, new Date(endDate))) {
      const timestamp = currentDate.getTime()
      dates.push({
        date: timestamp,
        displayDate: format(currentDate, 'MMM dd'),
        count: 0 // Default to 0 sessions
      })
      currentDate = addDays(currentDate, 1)
    }
    
    return dates
  }

  // Merge session data with all possible dates
  const mergeSessionData = () => {
    const allDates = generateAllDates()
    
    // Create a map of existing session data by date
    const sessionMap = new Map()
    sessionData.forEach(item => {
      sessionMap.set(startOfDay(new Date(item.date)).getTime(), item.count)
    })
    
    // Merge with all dates, overwriting the 0 count where we have actual data
    return allDates.map(dateItem => {
      const count = sessionMap.get(dateItem.date) || 0
      return {
        ...dateItem,
        count
      }
    })
  }

  const chartData = mergeSessionData()

  // Generate ticks for the 1st of each month between start and end date
  const generateMonthlyTicks = () => {
    // Find the start of the next month from our start date
    let currentDate = startOfMonth(new Date(startDate))
    // Move to the next month's 1st
    currentDate = addMonths(currentDate, 1)
    
    const ticks = []
    
    // Generate ticks for the 1st of each month
    while (isBefore(currentDate, new Date(endDate))) {
      ticks.push(currentDate.getTime())
      currentDate = addMonths(currentDate, 1)
    }
    
    return ticks
  }
  
  // Returns min and max domain values for the x-axis
  const getXAxisDomain = () => {
    return [startDate, endDate]
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            type="number" 
            domain={getXAxisDomain()} 
            scale="time"
            ticks={generateMonthlyTicks()}
            tickFormatter={(timestamp) => format(new Date(timestamp), 'MMM d')}
          />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill="#8884d8" name="Sessions" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 