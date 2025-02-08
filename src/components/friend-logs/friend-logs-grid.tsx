'use client'

import { useState, useEffect } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { supabase } from '@/lib/supabase'
import { FriendLogCard } from './friend-log-card'
import { FriendFilterDropdown } from './friend-filter-dropdown'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/components/ui/use-toast'
import { Link } from 'wouter'

const LOGS_PER_PAGE = 20

interface Friend {
  id: string
  display_name: string
}

interface FriendLog {
  id: string
  text: string
  created_at: string
  user_id: string
  log_images: Array<{
    id: string
    storage_path: string
  }>
  profiles: {
    display_name: string
    username: string
    avatar_url: string | null
  }
}

export function FriendLogsGrid() {
  const { user } = useAuth()
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [allFriends, setAllFriends] = useState<Friend[]>([])
  const { ref, inView } = useInView()

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        // First get all friends
        const { data: friendsData, error: friendsError } = await supabase
          .from('friends')
          .select('friend_id')
          .eq('user_id', user?.id)
          .throwOnError()
        
        if (friendsError) throw friendsError
        
        if (friendsData && friendsData.length > 0) {
          const friendIds = friendsData.map(f => f.friend_id)

          // Fetch profiles for all friends first
          const { data: allProfilesData, error: allProfilesError } = await supabase
            .from('profiles')
            .select('user_id, display_name')
            .in('user_id', friendIds)

          if (allProfilesError) throw allProfilesError

          // Set all friends
          const allValidFriends = friendIds
            .map(friendId => {
              const profile = allProfilesData?.find(p => p.user_id === friendId)
              return profile ? {
                id: friendId,
                display_name: profile.display_name
              } : null
            })
            .filter((f): f is Friend => f !== null)

          setAllFriends(allValidFriends)
          
          // Then check which friends have logs
          const { data: logsData, error: logsError } = await supabase
            .from('captain_logs')
            .select('user_id')
            .in('user_id', friendIds)
            .throwOnError()
            
          if (logsError) throw logsError
          
          // Get unique friend IDs who have logs
          const friendIdsWithLogs = [...new Set(logsData?.map(log => log.user_id) || [])]
          
          if (friendIdsWithLogs.length > 0) {
            // Map profiles to friends with logs
            const validFriends = friendIdsWithLogs
              .map(friendId => {
                const profile = allProfilesData?.find(p => p.user_id === friendId)
                return profile ? {
                  id: friendId,
                  display_name: profile.display_name
                } : null
              })
              .filter((f): f is Friend => f !== null)

            setFriends(validFriends)
          } else {
            setFriends([])
          }
        } else {
          setAllFriends([])
          setFriends([])
        }
      } catch (error) {
        console.error('Error fetching friends:', error)
        toast({
          title: "Error",
          description: "Failed to load friends list. Please try refreshing the page.",
          variant: "destructive"
        })
      }
    }

    if (user?.id) {
      fetchFriends()
    }
  }, [user?.id])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    isLoading,
    error: queryError
  } = useInfiniteQuery({
    queryKey: ['friendLogs', selectedFriendIds, user?.id],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      try {
        if (!user?.id) return []

        // Use selectedFriendIds if any are selected, otherwise get all friend IDs
        let friendIds: string[] = []
        if (selectedFriendIds.length > 0) {
          friendIds = selectedFriendIds
        } else {
          const { data: friendsData, error: friendsError } = await supabase
            .from('friends')
            .select('friend_id')
            .eq('user_id', user.id)
            .throwOnError()
          
          if (friendsError) throw friendsError
          friendIds = friendsData?.map(f => f.friend_id) || []
        }

        if (friendIds.length === 0) return []

        // Query logs with explicit friend IDs
        const { data: logs, error } = await supabase
          .from('captain_logs')
          .select(`
            id,
            text,
            created_at,
            user_id
          `)
          .in('user_id', friendIds)
          .order('created_at', { ascending: false })
          .range(pageParam * LOGS_PER_PAGE, (pageParam + 1) * LOGS_PER_PAGE - 1)
        
        if (error) throw error

        // Fetch images for these logs
        const logIds = logs?.map(log => log.id) || []
        const { data: images, error: imagesError } = await supabase
          .from('log_images')
          .select('*')
          .in('log_id', logIds)

        if (imagesError) {
          console.error('Error fetching log images:', imagesError)
        }

        // Create a map of log_id to images
        const imagesMap = new Map()
        images?.forEach(img => {
          const logImages = imagesMap.get(img.log_id) || []
          logImages.push(img)
          imagesMap.set(img.log_id, logImages)
        })

        // Fetch profiles separately
        const userIds = logs?.map(log => log.user_id) || []
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            user_id,
            display_name,
            username,
            avatar_url
          `)
          .in('user_id', userIds)

        if (profilesError) {
          console.error('Error fetching user profiles:', profilesError)
        }

        // Create a map of user_id to profile
        const profileMap = new Map()
        profiles?.forEach(profile => {
          profileMap.set(profile.user_id, {
            display_name: profile.display_name,
            username: profile.username,
            avatar_url: profile.avatar_url
          })
        })
        
        // Transform the logs to handle missing profiles
        const transformedLogs = (logs || []).map((rawLog: any) => {
          const profile = profileMap.get(rawLog.user_id)
          return {
            id: rawLog.id,
            text: rawLog.text,
            created_at: rawLog.created_at,
            user_id: rawLog.user_id,
            log_images: imagesMap.get(rawLog.id) || [],
            profiles: {
              display_name: profile?.display_name || `User ${rawLog.user_id.slice(0, 8)}`,
              username: profile?.username || `user_${rawLog.user_id.slice(0, 8)}`,
              avatar_url: profile?.avatar_url || null
            }
          }
        }) as FriendLog[]

        return transformedLogs
      } catch (error) {
        console.error('Error fetching friend logs:', error)
        throw error
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.length === LOGS_PER_PAGE ? allPages.length : undefined
    },
    initialPageParam: 0,
    enabled: !!user?.id
  })

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Friend's Logs</h1>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-[200px]" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card">
              <Skeleton className="h-[170px] w-full rounded-t-lg" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center space-x-2 pt-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Error loading logs.</p>
        <p className="text-sm">
          {queryError instanceof Error ? queryError.message : 'Please try again later.'}
        </p>
      </div>
    )
  }

  const allLogs = data?.pages?.flatMap(page => page) || []
  const isEmpty = allLogs.length === 0 && !isFetchingNextPage

  return (
    <div className="container mx-auto p-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Friend's Logs</h1>
        <div className="flex justify-end">
          <FriendFilterDropdown
            friends={friends}
            selectedFriendIds={selectedFriendIds}
            onSelectionChange={(ids) => {
              // Reset scroll position when filter changes
              window.scrollTo(0, 0)
              setSelectedFriendIds(ids)
            }}
          />
        </div>
      </div>

      {isEmpty ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>
            {allFriends.length === 0 ? (
              <>
                Add friends to see their logs here.{" "}
                <Link href="/friends" className="text-primary hover:underline">
                  Click here to go to your friends list
                </Link>{" "}
                where you can search for and send invites to your friends.
              </>
            ) : (
              "Your friends haven't posted any logs yet."
            )}
          </p>
        </div>
      ) : (
        <div 
          key={selectedFriendIds.join(',')} 
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {allLogs.map((log: FriendLog) => (
            <div
              key={log.id}
              className="transition-all duration-300 animate-in fade-in-0"
            >
              <FriendLogCard key={log.id} log={log} />
            </div>
          ))}
          {isFetchingNextPage && (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="h-[320px] rounded-lg border bg-card animate-pulse" />
            ))
          )}
          <div ref={ref} className="h-4" />
        </div>
      )}
    </div>
  )
} 