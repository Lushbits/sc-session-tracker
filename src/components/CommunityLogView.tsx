import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { CaptainLog } from '../types'
import { CaptainLogCard } from './ui/captain-log-card'
import { useToast } from './ui/use-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"
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
} from './ui/pagination'

// Number of logs to display per page
const LOGS_PER_PAGE = 12

export function CommunityLogView() {
  const [logs, setLogs] = useState<CaptainLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const { user } = useAuth()
  const { toast } = useToast()

  // Calculate paginated logs and total pages
  const { paginatedLogs, totalPages } = useMemo(() => {
    const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
    const endIndex = startIndex + LOGS_PER_PAGE;
    return {
      paginatedLogs: logs.slice(startIndex, endIndex),
      totalPages: Math.max(1, Math.ceil(logs.length / LOGS_PER_PAGE))
    };
  }, [logs, currentPage]);
  
  // Reset to page 1 if we're on a page that no longer exists
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    const fetchPublicLogs = async () => {
      setIsLoading(true)
      try {
        // Query only public logs and include user_id to check for votes
        const { data: publicLogs, error } = await supabase
          .from('captain_logs')
          .select(`
            id,
            text,
            created_at,
            user_id,
            upvotes,
            downvotes,
            score,
            is_hidden
          `)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
        
        if (error) throw error

        // Fetch images for these logs
        const logIds = publicLogs?.map(log => log.id) || []
        
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

        // Fetch profiles separately - we want display name and avatar
        const userIds = publicLogs?.map(log => log.user_id) || []
        
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
            user_id: profile.user_id,
            display_name: profile.display_name || profile.username || `User ${profile.user_id.substring(0, 8)}`,
            avatar_url: profile.avatar_url
          })
        })
        
        // Fetch user's votes if logged in
        let userVotes = {}
        if (user?.id) {
          const { data: votes, error: votesError } = await supabase
            .from('log_votes')
            .select('log_id, vote_type')
            .eq('user_id', user.id)
            .in('log_id', logIds)
            
          if (!votesError && votes) {
            userVotes = votes.reduce((acc: any, vote: any) => {
              acc[vote.log_id] = vote.vote_type
              return acc
            }, {})
          }
        }

        // Transform the logs for rendering
        const transformedLogs = (publicLogs || []).map(rawLog => {
          const profile = profileMap.get(rawLog.user_id)
          
          return {
            ...rawLog,
            user_vote: (userVotes as any)[rawLog.id] || 0,
            images: imagesMap.get(rawLog.id) || [],
            session_id: null,
            updated_at: rawLog.created_at,
            deleted_session: false,
            is_favorite: false,
            reported_count: 0,
            author: profile ? {
              ...profile,
              display_name: profile.display_name
            } : {
              user_id: rawLog.user_id,
              display_name: `User ${rawLog.user_id.substring(0, 8)}`,
              avatar_url: null
            }
          }
        }).filter(log => !log.is_hidden) as CaptainLog[]

        setLogs(transformedLogs)
      } catch (error) {
        console.error('Error fetching community logs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPublicLogs()

    // Subscribe to changes to public logs
    const channel = supabase
      .channel('community_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'captain_logs',
          filter: 'is_public=eq.true'
        },
        () => {
          fetchPublicLogs()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

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
      // Update UI optimistically
      setLogs(prevLogs => {
        return prevLogs.map(log => {
          if (log.id !== logId) return log

          // Calculate the changes based on previous vote
          const currentVote = log.user_vote || 0
          let upvoteChange = 0
          let downvoteChange = 0
          
          // Remove effect of previous vote
          if (currentVote === 1) upvoteChange--
          if (currentVote === -1) downvoteChange--
          
          // Add effect of new vote
          if (voteType === 1) upvoteChange++
          if (voteType === -1) downvoteChange++
          
          // If clicking same button, toggle off
          const newVoteType = currentVote === voteType ? 0 : voteType
          
          // If toggling off, we don't add the new vote
          if (newVoteType === 0) {
            if (voteType === 1) upvoteChange--
            if (voteType === -1) downvoteChange--
          }
          
          // Calculate new upvotes and downvotes
          const newUpvotes = (log.upvotes || 0) + upvoteChange
          const newDownvotes = (log.downvotes || 0) + downvoteChange
          
          return {
            ...log,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            score: newUpvotes - newDownvotes,
            user_vote: newVoteType
          }
        })
      })

      // Call the toggle_vote_on_log RPC function
      const { error } = await supabase.rpc('toggle_vote_on_log', {
        p_log_id: logId,
        p_user_id: user.id,
        p_vote_type: voteType
      })

      if (error) throw error
    } catch (error) {
      console.error('Error voting on log:', error)
      toast({
        title: "Error",
        description: "Failed to register your vote. Please try again.",
        variant: "destructive"
      })
      
      // Refresh logs to get correct state
      const { data: logVote } = await supabase
        .from('log_votes')
        .select('vote_type')
        .eq('log_id', logId)
        .eq('user_id', user.id)
        .single()
      
      // Update the specific log with correct vote state
      setLogs(prevLogs => {
        return prevLogs.map(log => {
          if (log.id !== logId) return log
          
          return {
            ...log,
            user_vote: logVote ? logVote.vote_type : 0
          }
        })
      })
    }
  }
  
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
      <div className="container mx-auto px-4 py-12">
        <div className="flex h-[70vh] items-center justify-center">
          <div className="text-muted-foreground">Loading community logs...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="space-y-8">
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">Community Logs</h1>
            
          </div>
        </div>
        
        {logs.length === 0 ? (
          <div className="flex h-[50vh] items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>No public logs found.</p>
              <p className="text-sm">Be the first to share your logs with the community!</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedLogs.map((log) => (
                <div
                  key={log.id}
                  className="transition-all duration-300 animate-in fade-in-0"
                >
                  <CaptainLogCard
                    log={{...log, is_public: true}}
                    onVote={(voteType) => handleVoteOnLog(log.id, voteType)}
                    showAuthor={true}
                    communityView={true}
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
    </div>
  )
} 