import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { CaptainLog } from '../types'
import { CaptainLogCard } from './ui/captain-log-card'
import { SessionDetailsDialog } from './SessionDetailsDialog'
import { Button } from './ui/button'
import { Heart, Globe } from 'lucide-react'
import { cn } from '../lib/utils'
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

export function CaptainLogView() {
  const [logs, setLogs] = useState<CaptainLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showPublic, setShowPublic] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const { user } = useAuth()
  const { toast } = useToast()

  // Calculate filtered logs based on current filter settings
  const filteredLogs = useMemo(() => {
    let filtered = logs;
    
    if (showFavorites) {
      filtered = filtered.filter(log => log.is_favorite);
    } else if (showPublic) {
      filtered = filtered.filter(log => log.is_public);
    }
    
    return filtered;
  }, [logs, showFavorites, showPublic]);
  
  // Calculate paginated logs and total pages
  const { paginatedLogs, totalPages } = useMemo(() => {
    const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
    const endIndex = startIndex + LOGS_PER_PAGE;
    return {
      paginatedLogs: filteredLogs.slice(startIndex, endIndex),
      totalPages: Math.max(1, Math.ceil(filteredLogs.length / LOGS_PER_PAGE))
    };
  }, [filteredLogs, currentPage]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [showFavorites, showPublic]);
  
  // Reset to page 1 if we're on a page that no longer exists
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    if (!user) return

    const fetchLogs = async () => {
      try {
        const { data: logs, error } = await supabase
          .from('captain_logs')
          .select(`
            *,
            log_images (
              id,
              storage_path,
              created_at
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        const logsWithUrls = logs.map(log => ({
          ...log,
          images: log.log_images.map((image: any) => ({
            ...image,
            storage_path: image.storage_path
          }))
        }))

        setLogs(logsWithUrls)
      } catch (error) {
        console.error('Error fetching logs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogs()

    // Subscribe to changes
    const channel = supabase
      .channel('captain_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'captain_logs',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchLogs()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const handleDelete = async (logId: string) => {
    if (!user) return
    setLogs(prevLogs => prevLogs.filter(log => log.id !== logId))
  }

  const handleToggleFavorite = async (logId: string, isFavorite: boolean) => {
    if (!user) return

    // Optimistic update
    setLogs(prevLogs =>
      prevLogs.map(log =>
        log.id === logId ? { ...log, is_favorite: isFavorite } : log
      )
    )

    try {
      const { error } = await supabase
        .from('captain_logs')
        .update({ is_favorite: isFavorite })
        .eq('id', logId)
        .eq('user_id', user.id)

      if (error) throw error

      toast({
        title: isFavorite ? "Added to favorites" : "Removed from favorites",
        description: isFavorite 
          ? "This log has been added to your favorites."
          : "This log has been removed from your favorites."
      })
    } catch (error) {
      console.error('Error updating favorite status:', error)
      // Revert the optimistic update if there was an error
      setLogs(prevLogs =>
        prevLogs.map(log =>
          log.id === logId ? { ...log, is_favorite: !isFavorite } : log
        )
      )
      toast({
        title: "Error",
        description: "Failed to update favorite status. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleTogglePublic = async (logId: string, isPublic: boolean) => {
    if (!user) return

    // Optimistic update
    setLogs(prevLogs =>
      prevLogs.map(log =>
        log.id === logId ? { ...log, is_public: isPublic } : log
      )
    )

    try {
      const { error } = await supabase
        .from('captain_logs')
        .update({ is_public: isPublic })
        .eq('id', logId)
        .eq('user_id', user.id)

      if (error) throw error

      toast({
        title: isPublic ? "Made public" : "Made private",
        description: isPublic 
          ? "This log is now publicly accessible via a shareable link."
          : "This log is now private."
      })
    } catch (error) {
      console.error('Error updating public status:', error)
      // Revert the optimistic update if there was an error
      setLogs(prevLogs =>
        prevLogs.map(log =>
          log.id === logId ? { ...log, is_public: !isPublic } : log
        )
      )
      toast({
        title: "Error",
        description: "Failed to update visibility. Please try again.",
        variant: "destructive"
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
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-muted-foreground">Loading logs...</div>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto p-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">My Captain's Log</h1>
          <div className="flex gap-2">
            <Button
              variant={!showFavorites && !showPublic ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "gap-2",
                !showFavorites && !showPublic 
                  ? "hover:bg-secondary/80"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => {
                setShowFavorites(false)
                setShowPublic(false)
              }}
            >
              All logs
            </Button>
            <Button
              variant={showFavorites ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "gap-2",
                showFavorites 
                  ? "hover:bg-secondary/80"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => {
                setShowFavorites(true)
                setShowPublic(false)
              }}
            >
              <Heart className={cn("w-4 h-4", showFavorites && "fill-current")} />
              Favorites
            </Button>
            <Button
              variant={showPublic ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "gap-2",
                showPublic 
                  ? "hover:bg-secondary/80"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => {
                setShowPublic(true)
                setShowFavorites(false)
              }}
            >
              <Globe className={cn("w-4 h-4", showPublic && "fill-current")} />
              Public
            </Button>
          </div>
        </div>
        
        {filteredLogs.length === 0 ? (
          <div className="flex h-[50vh] items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>No logs {showFavorites ? "marked as favorite" : showPublic ? "marked as public" : "recorded yet"}.</p>
              <p className="text-sm">
                {showFavorites 
                  ? "Mark some logs as favorite to see them here."
                  : showPublic
                    ? "Mark some logs as public to see them here."
                    : "Start a session and add some logs to see them here."}
              </p>
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
                    log={log}
                    onDelete={() => handleDelete(log.id)}
                    onToggleFavorite={(isFavorite) => handleToggleFavorite(log.id, isFavorite)}
                    onTogglePublic={(isPublic) => handleTogglePublic(log.id, isPublic)}
                  />
                </div>
              ))}
            </div>
            
            {/* Pagination with tooltips */}
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
      
      {selectedSessionId && (
        <SessionDetailsDialog
          session={null}
          isOpen={!!selectedSessionId}
          onOpenChange={(open) => !open && setSelectedSessionId(null)}
        />
      )}
    </>
  )
} 