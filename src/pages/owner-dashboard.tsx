import { useAdminStats } from '../hooks/useAdminStats'
import { SessionsPerDayChart } from '../components/admin/sessions-per-day-chart'
import { UserSignupsChart } from '../components/admin/user-signups-chart'
import { TopUsersList } from '../components/admin/top-users-list'
import { LogStatsCards } from '../components/admin/log-stats-cards'
import { Loader2 } from 'lucide-react'

export function OwnerDashboard() {
  const {
    sessionsPerDay,
    userSignups,
    topSessionCreators,
    topLogCreators,
    logStats,
    isLoading,
    isError
  } = useAdminStats()
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Owner Dashboard</h1>
      
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <p>Failed to load dashboard data. Please try again later.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Sessions Per Day Chart */}
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Sessions Created Per Day</h2>
            {sessionsPerDay.data && sessionsPerDay.data.length > 0 ? (
              <SessionsPerDayChart data={sessionsPerDay.data} />
            ) : (
              <p className="text-center py-12 text-muted-foreground">No session data available</p>
            )}
          </div>
          
          {/* User Signups Chart */}
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">User Signups Over Time (Cumulative)</h2>
            {userSignups.data && userSignups.data.length > 0 ? (
              <UserSignupsChart data={userSignups.data} />
            ) : (
              <p className="text-center py-12 text-muted-foreground">No user signup data available</p>
            )}
          </div>
          
          {/* Log Stats Cards */}
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Captain's Log Statistics</h2>
            <LogStatsCards data={logStats.data || { total: 0, public: 0 }} />
          </div>
          
          {/* Top Users Lists */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Session Creators */}
            <TopUsersList 
              data={topSessionCreators.data || []} 
              title="Top Session Creators" 
              countLabel="sessions"
            />
            
            {/* Top Log Creators */}
            <TopUsersList 
              data={topLogCreators.data || []} 
              title="Top Captain's Log Creators" 
              countLabel="logs"
            />
          </div>
        </div>
      )}
    </div>
  )
} 