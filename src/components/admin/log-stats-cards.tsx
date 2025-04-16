import { LogStats } from '@/services/admin'
import { BookOpen, Globe } from 'lucide-react'

interface LogStatsCardsProps {
  data: LogStats | any
}

export function LogStatsCards({ data }: LogStatsCardsProps) {
  // Extract values from the data, which appears to be an array with a single object
  // based on console logs: [{total: 25, public: 7}]
  let total = 0;
  let publicLogs = 0;
  
  // Check if data exists and extract values
  if (data) {
    // If data is an array, use the first item
    if (Array.isArray(data) && data.length > 0) {
      total = data[0].total || 0;
      publicLogs = data[0].public || 0;
    } 
    // If data is directly an object with the expected properties
    else if (typeof data === 'object') {
      total = data.total || 0;
      publicLogs = data.public || 0;
    }
  }
  
  // Calculate percentage
  const publicPercentage = total > 0 ? Math.round((publicLogs / total) * 100) : 0
  
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center">
          <div className="mr-4 rounded-full bg-primary/10 p-2">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Logs
            </p>
            <h3 className="text-2xl font-bold">{total}</h3>
          </div>
        </div>
      </div>
      
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center">
          <div className="mr-4 rounded-full bg-primary/10 p-2">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Public Logs
            </p>
            <h3 className="text-2xl font-bold">{publicLogs}</h3>
            <p className="text-sm text-muted-foreground">
              {publicPercentage}% of total
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 