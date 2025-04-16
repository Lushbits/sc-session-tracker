import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/admin'

export function useAdminStats() {
  const sessionsPerDay = useQuery({
    queryKey: ['admin', 'sessionsPerDay'],
    queryFn: () => adminService.getSessionsPerDay(),
  })

  const userSignups = useQuery({
    queryKey: ['admin', 'userSignups'],
    queryFn: () => adminService.getUserSignupsOverTime(),
  })

  const topSessionCreators = useQuery({
    queryKey: ['admin', 'topSessionCreators'],
    queryFn: () => adminService.getTopSessionCreators(),
  })

  const topLogCreators = useQuery({
    queryKey: ['admin', 'topLogCreators'],
    queryFn: () => adminService.getTopLogCreators(),
  })

  const logStats = useQuery({
    queryKey: ['admin', 'logStats'],
    queryFn: async () => {
      try {
        const result = await adminService.getLogStats()
        console.log('Log stats fetched successfully:', result)
        return result
      } catch (error) {
        console.error('Error fetching log stats:', error)
        throw error
      }
    },
    refetchOnMount: true,
    staleTime: 0, // Consider data always stale, so it will always refetch
  })

  // Debug log stats data
  console.log('logStats.data in hook:', logStats.data)
  console.log('logStats status:', { 
    isLoading: logStats.isLoading,
    isError: logStats.isError,
    error: logStats.error
  })

  return {
    sessionsPerDay,
    userSignups,
    topSessionCreators,
    topLogCreators,
    logStats,
    isLoading: 
      sessionsPerDay.isLoading || 
      userSignups.isLoading || 
      topSessionCreators.isLoading || 
      topLogCreators.isLoading || 
      logStats.isLoading,
    isError:
      sessionsPerDay.isError || 
      userSignups.isError || 
      topSessionCreators.isError || 
      topLogCreators.isError || 
      logStats.isError
  }
} 