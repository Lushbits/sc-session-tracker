'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { FriendLogCard } from './friend-log-card'
import { FriendFilterDropdown } from './friend-filter-dropdown'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { Link } from 'wouter'
import { useQueryClient } from '@tanstack/react-query'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationButton,
  PaginationNext,
  PaginationPrevious,
  PaginationFirst,
  PaginationLast,
  PaginationEllipsis,
} from '@/components/ui/pagination'

const LOGS_PER_PAGE = 12 // Match the same number used in other log views

interface Friend {
  id: string
  display_name: string
}

interface FriendLog {
  id: string
  text: string
  created_at: string
  user_id: string
  upvotes?: number
  downvotes?: number
  score?: number
  user_vote?: number
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

// Define a response type for our query
interface FriendLogsResponse {
  logs: FriendLog[]
  totalCount: number
}

export function FriendLogsGrid() {
  const { user } = useAuth()
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [allFriends, setAllFriends] = useState<Friend[]>([])
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)

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

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedFriendIds])

  const {
    data: logs,
    isLoading,
    error: queryError
  } = useQuery<FriendLogsResponse>({
    queryKey: ['friendLogs', selectedFriendIds, user?.id, currentPage],
    queryFn: async () => {
      try {
        if (!user?.id) return { logs: [], totalCount: 0 }

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

        if (friendIds.length === 0) return { logs: [], totalCount: 0 }

        // Calculate range for pagination
        const from = (currentPage - 1) * LOGS_PER_PAGE
        const to = from + LOGS_PER_PAGE - 1

        // Query logs with explicit friend IDs
        const { data: logs, error } = await supabase
          .from('captain_logs')
          .select(`
            id,
            text,
            created_at,
            user_id,
            upvotes,
            downvotes,
            score
          `)
          .in('user_id', friendIds)
          .order('created_at', { ascending: false })
          .range(from, to)
        
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
        
        // Fetch user's votes if logged in
        let userVotes = {};
        if (user?.id) {
          const logIds = logs?.map(log => log.id) || [];
          const { data: votes, error: votesError } = await supabase
            .from('log_votes')
            .select('log_id, vote_type')
            .eq('user_id', user.id)
            .in('log_id', logIds);
            
          if (!votesError && votes) {
            userVotes = votes.reduce((acc: any, vote: any) => {
              acc[vote.log_id] = vote.vote_type;
              return acc;
            }, {});
          }
        }

        // Transform the logs to handle missing profiles
        const transformedLogs = (logs || []).map((rawLog: any) => {
          const profile = profileMap.get(rawLog.user_id)
          return {
            id: rawLog.id,
            text: rawLog.text,
            created_at: rawLog.created_at,
            user_id: rawLog.user_id,
            upvotes: rawLog.upvotes || 0,
            downvotes: rawLog.downvotes || 0,
            score: rawLog.score || 0,
            user_vote: (userVotes as any)[rawLog.id] || 0,
            log_images: imagesMap.get(rawLog.id) || [],
            profiles: {
              display_name: profile?.display_name || `User ${rawLog.user_id.slice(0, 8)}`,
              username: profile?.username || `user_${rawLog.user_id.slice(0, 8)}`,
              avatar_url: profile?.avatar_url || null
            }
          }
        }) as FriendLog[]

        // Also get total count for pagination
        const { count, error: countError } = await supabase
          .from('captain_logs')
          .select('id', { count: 'exact', head: true })
          .in('user_id', friendIds)
        
        if (countError) {
          console.error('Error getting log count:', countError)
        }

        return {
          logs: transformedLogs,
          totalCount: count || 0
        }
      } catch (error) {
        console.error('Error fetching friend logs:', error)
        throw error
      }
    },
    enabled: !!user?.id
  })

  // Handler function for voting on a log
  const handleVoteOnLog = async (logId: string, voteType: number) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "You need to be signed in to vote on logs.",
        variant: "destructive"
      })
      return
    }

    try {
      // Find current log to check if user already voted
      const currentLog = logs?.logs.find(log => log.id === logId);
      if (!currentLog) return;
      
      // Get current vote value (if any)
      const currentVote = currentLog.user_vote || 0;
      
      // Determine the new vote value - toggle if same vote type
      let newVoteValue = voteType;
      if (currentVote === voteType) {
        // If clicking the same button again, remove the vote
        newVoteValue = 0;
      }
      
      console.log(`Log ${logId}: Current vote=${currentVote}, New vote=${newVoteValue}`);
      
      // Call the toggle_vote_on_log RPC function - same as community logs
      const { error } = await supabase.rpc('toggle_vote_on_log', {
        p_log_id: logId,
        p_user_id: user.id,
        p_vote_type: newVoteValue
      })

      if (error) throw error

      toast({
        title: newVoteValue === 0 ? "Vote Removed" : "Upvoted",
        description: newVoteValue === 0 
          ? "Your vote has been removed." 
          : "You have upvoted this log."
      })

      // Update the UI with the new vote (optimistic update)
      queryClient.setQueryData(
        ['friendLogs', selectedFriendIds, user.id, currentPage],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            logs: oldData.logs.map((log: any) => {
              if (log.id === logId) {
                // Calculate vote changes
                let upvoteChange = 0;
                
                // Remove previous vote
                if (currentVote === 1) upvoteChange--;
                
                // Add new vote
                if (newVoteValue === 1) upvoteChange++;
                
                const newUpvotes = (log.upvotes || 0) + upvoteChange;
                
                return {
                  ...log,
                  upvotes: newUpvotes,
                  user_vote: newVoteValue
                };
              }
              return log;
            })
          };
        }
      );
    } catch (error) {
      console.error('Error voting on log:', error)
      toast({
        title: "Error",
        description: "Failed to register your vote. Please try again.",
        variant: "destructive"
      })
    }
  };

  // Calculate total pages for pagination
  const totalPages = logs?.totalCount 
    ? Math.max(1, Math.ceil(logs.totalCount / LOGS_PER_PAGE))
    : 1;

  // Function to handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add keyboard navigation for pagination
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only handle when not typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const key = e.key.toLowerCase();
      
      if (key === 'a' && currentPage > 1) {
        handlePageChange(currentPage - 1);
      } else if (key === 'd' && currentPage < totalPages) {
        handlePageChange(currentPage + 1);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, totalPages]);

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

  if (queryError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Error loading logs.</p>
        <p className="text-sm">
          {queryError instanceof Error ? queryError.message : 'Please try again later.'}
        </p>
      </div>
    )
  }

  const isEmpty = !logs?.logs || logs.logs.length === 0;

  return (
    <div className="container mx-auto p-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Friend's Logs</h1>
          
          
        </div>
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
        <>
          <div 
            key={`${selectedFriendIds.join(',')}-${currentPage}`} 
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {logs?.logs.map((log: FriendLog) => (
              <div
                key={log.id}
                className="col-span-1 transition-all duration-300 animate-in fade-in-0"
              >
                <FriendLogCard 
                  log={log} 
                  onVote={handleVoteOnLog}
                />
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <>
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <PaginationFirst 
                              onClick={() => handlePageChange(1)} 
                              disabled={currentPage === 1}
                            />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>First page</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </PaginationItem>
                  <PaginationItem>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <PaginationPrevious 
                              onClick={() => handlePageChange(currentPage - 1)} 
                              disabled={currentPage === 1}
                            />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Previous page (or press A key)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </PaginationItem>
                  
                  {/* Generate page numbers */}
                  {(() => {
                    const pageNumbers = [];
                    const maxPages = 5; // Max page buttons to show
                    
                    if (totalPages <= maxPages) {
                      // Show all pages if there are fewer than maxPages
                      for (let i = 1; i <= totalPages; i++) {
                        pageNumbers.push(
                          <PaginationItem key={i}>
                            <PaginationButton
                              isActive={currentPage === i}
                              onClick={() => handlePageChange(i)}
                            >
                              {i}
                            </PaginationButton>
                          </PaginationItem>
                        );
                      }
                    } else {
                      // Always show first page
                      pageNumbers.push(
                        <PaginationItem key={1}>
                          <PaginationButton
                            isActive={currentPage === 1}
                            onClick={() => handlePageChange(1)}
                          >
                            1
                          </PaginationButton>
                        </PaginationItem>
                      );
                      
                      // Show ellipsis if not on first few pages
                      if (currentPage > 3) {
                        pageNumbers.push(
                          <PaginationItem key="ellipsis1">
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      
                      // Calculate range of pages to show around current page
                      const start = Math.max(2, currentPage - 1);
                      const end = Math.min(totalPages - 1, currentPage + 1);
                      
                      // Add pages between start and end
                      for (let i = start; i <= end; i++) {
                        if (i !== 1 && i !== totalPages) {
                          pageNumbers.push(
                            <PaginationItem key={i}>
                              <PaginationButton
                                isActive={currentPage === i}
                                onClick={() => handlePageChange(i)}
                              >
                                {i}
                              </PaginationButton>
                            </PaginationItem>
                          );
                        }
                      }
                      
                      // Show ellipsis if not on last few pages
                      if (currentPage < totalPages - 2) {
                        pageNumbers.push(
                          <PaginationItem key="ellipsis2">
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      
                      // Always show last page
                      pageNumbers.push(
                        <PaginationItem key={totalPages}>
                          <PaginationButton
                            isActive={currentPage === totalPages}
                            onClick={() => handlePageChange(totalPages)}
                          >
                            {totalPages}
                          </PaginationButton>
                        </PaginationItem>
                      );
                    }
                    
                    return pageNumbers;
                  })()}
                  
                  <PaginationItem>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <PaginationNext 
                              onClick={() => handlePageChange(currentPage + 1)} 
                              disabled={currentPage === totalPages}
                            />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Next page (or press D key)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </PaginationItem>
                  <PaginationItem>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <PaginationLast 
                              onClick={() => handlePageChange(totalPages)} 
                              disabled={currentPage === totalPages}
                            />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Last page</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              
              {/* Keyboard shortcuts tip below pagination */}
              <div className="mt-3 text-center text-sm text-muted-foreground">
                <span>Use</span>
                <kbd className="mx-1 px-1.5 py-0.5 text-xs font-semibold bg-background border rounded-md shadow-sm">A</kbd>
                <span>/</span>
                <kbd className="mx-1 px-1.5 py-0.5 text-xs font-semibold bg-background border rounded-md shadow-sm">D</kbd>
                <span>to navigate pages</span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
} 