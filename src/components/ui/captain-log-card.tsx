import { Trash2, Heart, Globe, Link, ThumbsUp, ThumbsDown, User } from 'lucide-react'
import { CaptainLog } from '@/types'
import { Button } from './button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog"
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatLocalDateTime } from '@/utils/dateFormatting'
import { deleteLogImages, getTransformedImageUrl, getOriginalImageUrl } from '@/utils/storage'

interface CaptainLogCardProps {
  log: CaptainLog
  onDelete?: () => void
  onToggleFavorite?: (isFavorite: boolean) => void
  onTogglePublic?: (isPublic: boolean) => void
  onVote?: (voteType: number) => void
  showAuthor?: boolean
  communityView?: boolean
}

export function CaptainLogCard({ 
  log, 
  onDelete, 
  onToggleFavorite, 
  onTogglePublic,
  onVote,
  showAuthor = false,
  communityView = false
}: CaptainLogCardProps) {
  const [showFullLog, setShowFullLog] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false)
  const [showBlurredContent, setShowBlurredContent] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)
  const [isTextOverflowing, setIsTextOverflowing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        // Check standard overflow (for personal view)
        const hasOverflow = textRef.current.scrollHeight > textRef.current.offsetHeight;
        setIsTextOverflowing(hasOverflow);
        
        console.log('Text check:', 
          'length:', log.text?.length || 0,
          'standard overflow:', hasOverflow
        );
      }
    };
    
    // Run this check after a short delay to ensure content is rendered
    const timeoutId = setTimeout(checkOverflow, 100);
    window.addEventListener('resize', checkOverflow);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [log.text]);

  // Function to properly measure text overflow with detailed debugging
  const measureTextOverflow = () => {
    if (textRef.current) {
      const el = textRef.current;
      const text = log.text || '';
      const scrollHeight = el.scrollHeight; 
      const offsetHeight = el.offsetHeight;
      const textRatio = scrollHeight / offsetHeight;
      
      // Count approximate number of lines (typical line height ~20px)
      const lineHeight = 20;
      const approximateLines = Math.ceil(scrollHeight / lineHeight);
      
      // For short texts, never show gradient
      const isShortText = approximateLines <= 3 || text.length < 100;
      
      // Standard overflow detection - must be clearly overflowing
      const hasStandardOverflow = scrollHeight > offsetHeight + 5; // Add 5px buffer
      
      // Community view - stricter criteria
      // Only show gradient if text is significantly filling the container
      const communityThreshold = 0.95; // Increased from 0.85 to be more strict
      const hasCommunityOverflow = communityView && textRatio > communityThreshold;
      
      // Set overflow state - with short text exception
      const shouldShowGradient = !isShortText && (hasStandardOverflow || hasCommunityOverflow);
      setIsTextOverflowing(shouldShowGradient);
      
      // Debug log
      console.log(
        `Log ${log.id.substring(0, 6)}: ` +
        `${scrollHeight}px / ${offsetHeight}px = ${textRatio.toFixed(2)}, ` +
        `~${approximateLines} lines, ${text.length} chars, ` +
        `(${shouldShowGradient ? 'GRADIENT' : 'NO GRADIENT'}) ` +
        `[${communityView ? 'COMMUNITY' : 'REGULAR'}] ` +
        `${isShortText ? '(SHORT TEXT)' : ''}`
      );
    }
  };
  
  useEffect(() => {
    // Run measurement after DOM is rendered
    // We need a longer timeout for community view to ensure everything is properly rendered
    const timeoutId = setTimeout(measureTextOverflow, communityView ? 300 : 100);
    
    // Also measure on resize
    window.addEventListener('resize', measureTextOverflow);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', measureTextOverflow);
    };
  }, [log.text, communityView]);

  const handleVote = (voteType: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Pass the vote type to the parent component
    onVote?.(voteType);
  };

  const handleDelete = async () => {
    if (!user) return

    setIsDeleting(true)
    setIsRemoving(true)
    try {
      // First delete all associated images
      await deleteLogImages(log.id, user.id)

      // Then delete the log entry
      const { error } = await supabase
        .from('captain_logs')
        .delete()
        .eq('id', log.id)
        .eq('user_id', user.id)

      if (error) throw error

      // Notify parent about deletion
      onDelete?.()
    } catch (error) {
      console.error('Error deleting log:', error)
      setIsRemoving(false)
      alert("Failed to delete the log. Please try again.")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Create a shareable URL for this log using the public route
    const baseUrl = window.location.origin;
    const shareableUrl = `${baseUrl}/share/log/${log.id}`;
    
    // Copy to clipboard using a simple approach
    navigator.clipboard.writeText(shareableUrl).then(() => {
      // Show the tooltip for visual feedback
      setShowCopiedTooltip(true);
      
      // Hide tooltip after 2 seconds
      setTimeout(() => {
        setShowCopiedTooltip(false);
      }, 2000);
    }).catch((err) => {
      // Fallback if clipboard API fails - use a non-blocking approach
      console.error("Clipboard API failed:", err);
      setShowCopiedTooltip(true);
      // Still show the tooltip
      setTimeout(() => {
        setShowCopiedTooltip(false);
      }, 2000);
    });
  };

  return (
    <>
      <div 
        className={cn(
          "group rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300",
          // Only increase height specifically for community view where author is shown
          showAuthor && communityView ? "h-[340px]" : "h-[320px]",
          "grid grid-rows-[auto_1fr_auto] overflow-hidden isolation-auto relative",
          isRemoving && "opacity-0 scale-95",
          "hover:-translate-y-1 hover:shadow-[0_0_25px_hsl(var(--primary)/0.35)] hover:border-primary/70"
        )}
      >
        {/* Show reveal button for downvoted content - positioned above all content */}
        {(log.score || 0) < 0 && !showBlurredContent && communityView && user && user.id !== log.user_id && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/30 rounded pointer-events-auto">
            <div className="bg-card border p-4 rounded-lg shadow-lg text-center">
              <p className="text-center text-sm font-medium mb-3">Downvoted content</p>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBlurredContent(true);
                }}
              >
                Show anyway
              </Button>
            </div>
          </div>
        )}
        <div 
          className="cursor-pointer contents"
          onClick={(log.score || 0) < 0 && !showBlurredContent && communityView && user && user.id !== log.user_id ? (e) => e.preventDefault() : () => setShowFullLog(true)}
        >
          {log.images.length > 0 && (
            <div className="relative group/image">
              <img
                src={getTransformedImageUrl(log.images[0].storage_path, {
                  width: 400,
                  height: 170,
                  quality: 85,
                  resize: 'cover'
                })}
                alt="Log attachment"
                className={cn(
                  "w-full h-[170px] object-cover",
                  (log.score || 0) < 0 && !showBlurredContent && communityView && user && user.id !== log.user_id && "blur-md"
                )}
              />
            </div>
          )}
          
          <div className={cn(
            "p-4 pb-0 overflow-hidden min-h-0 relative",
            // Make text container taller in community view to account for author info
            showAuthor && communityView ? "max-h-[130px]" : "max-h-[110px]",
            // Apply blur to negatively scored content that hasn't been revealed
            (log.score || 0) < 0 && !showBlurredContent && communityView && user && user.id !== log.user_id && "blur-md"
          )}>
            {showAuthor && log.author && (
              <div className="flex items-center mb-2 space-x-2">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {log.author.avatar_url ? (
                    <img 
                      src={log.author.avatar_url} 
                      alt={log.author.display_name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <span className="text-sm font-medium">{log.author.display_name}</span>
              </div>
            )}
            <div className="relative h-full">
              <p ref={textRef} className="whitespace-pre-wrap text-sm h-full">
                {log.text}
              </p>
              
              {/* Standard fade for regular view */}
              {!communityView && isTextOverflowing && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to top, hsl(var(--card)) 0%, hsl(var(--card)) 15%, hsl(var(--card) / 0.9) 30%, hsl(var(--card) / 0.7) 50%, transparent 100%)'
                  }}
                ></div>
              )}
              
              {/* Show gradient when text is overflowing, with specific styling for community view */}
              {isTextOverflowing && communityView && (
                <div 
                  className={cn(
                    "absolute bottom-0 left-0 right-0 pointer-events-none outline-none overflow-hidden",
                    // Make gradient taller when voting buttons are shown (for other users' logs)
                    onVote && user && user.id !== log.user_id ? "h-32" : "h-24"
                  )}
                  style={{
                    background: onVote && user && user.id !== log.user_id
                      // More aggressive gradient when voting buttons are shown (starts higher)
                      ? 'linear-gradient(to top, hsl(var(--card)) 20%, hsl(var(--card)) 30%, hsl(var(--card) / 0.8) 40%, hsl(var(--card) / 0.6) 50%, hsl(var(--card) / 0.4) 65%, transparent 100%)'
                      // Regular gradient for own logs or when not logged in
                      : 'linear-gradient(to top, hsl(var(--card)) 30%, hsl(var(--card)) 40%, hsl(var(--card) / 0.7) 50%, hsl(var(--card) / 0.5) 60%, transparent 100%)'
                  }}
                ></div>
              )}
            </div>
          </div>
        </div>

        <div className={cn(
          "self-end outline-none",
          // Add small top padding for community view with vote buttons
          communityView && onVote && user && user.id !== log.user_id 
            ? "px-4 pb-4 pt-2"  // Small top padding for other users' logs in community view
            : "p-4"  // Standard padding for own logs or non-community view
        )}>
          <div className="flex items-center justify-between text-xs text-muted-foreground outline-none">
            <div className="flex items-center outline-none">
              {!communityView && onDelete && (
                <div className="w-0 group-hover:w-8 transition-all duration-200 overflow-hidden outline-none">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <span className={communityView ? "" : "transition-transform duration-200 group-hover:translate-x-2"}>
                {formatLocalDateTime(new Date(log.created_at))}
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-hidden outline-none border-none">
              {onVote && user && user.id !== log.user_id && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 transition-colors hover:bg-transparent hover:shadow-none [&:hover]:shadow-none [&:hover]:bg-transparent",
                      log.user_vote === 1 
                        ? "text-green-500 hover:text-green-500"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={handleVote(1)}
                    title="Upvote this log"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <span className={cn(
                    "text-xs font-medium min-w-[1.5rem] text-center",
                    (log.score || 0) > 0 ? "text-green-500" : (log.score || 0) < 0 ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {log.score || 0}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 transition-colors hover:bg-transparent hover:shadow-none [&:hover]:shadow-none [&:hover]:bg-transparent",
                      log.user_vote === -1 
                        ? "text-red-500 hover:text-red-500"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={handleVote(-1)}
                    title="Downvote this log"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {/* Always show score for user's own logs if there is any */}
              {user && user.id === log.user_id && (log.score || 0) !== 0 && (
                <div className="flex items-center mr-1">
                  <span className={cn(
                    "text-xs font-medium min-w-[1.5rem] text-center",
                    (log.score || 0) > 0 ? "text-green-500" : "text-red-500"
                  )}>
                    <ThumbsUp className="inline-block h-3 w-3 mr-0.5" />
                    {Math.abs(log.score || 0)}
                  </span>
                </div>
              )}
              {onTogglePublic && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 transition-colors hover:bg-transparent hover:shadow-none [&:hover]:shadow-none [&:hover]:bg-transparent outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
                    log.is_public 
                      ? "text-blue-500 hover:text-muted-foreground/70" 
                      : "text-muted-foreground hover:text-blue-500"
                  )}
                  onClick={() => onTogglePublic(!log.is_public)}
                  title={log.is_public ? "Make private" : "Make public"}
                >
                  <Globe className="h-4 w-4 outline-none" />
                </Button>
              )}
              {onToggleFavorite && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 transition-colors hover:bg-transparent hover:shadow-none [&:hover]:shadow-none [&:hover]:bg-transparent",
                    log.is_favorite 
                      ? "text-red-500 hover:text-muted-foreground/70" 
                      : "text-muted-foreground hover:text-red-500"
                  )}
                  onClick={() => onToggleFavorite(!log.is_favorite)}
                  title={log.is_favorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart className={cn("h-4 w-4", log.is_favorite && "fill-current")} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Log</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this log? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showFullLog} onOpenChange={setShowFullLog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {showAuthor && log.author ? (
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {log.author.avatar_url ? (
                      <img 
                        src={log.author.avatar_url} 
                        alt={log.author.display_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <span>{log.author.display_name}'s Log</span>
                </div>
              ) : (
                "Captain's Log"
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {log.images[0] && (
              <div className="relative group/fullimage cursor-pointer"
                   onClick={() => {
                     window.open(getOriginalImageUrl(log.images[0].storage_path), '_blank');
                   }}>
                <img
                  src={getTransformedImageUrl(log.images[0].storage_path, { 
                    width: 1200,
                    quality: 95,
                    resize: 'contain'
                  })}
                  alt="Full size"
                  className="w-full max-h-[80vh] object-contain rounded-lg"
                />
                <div className="absolute inset-0 flex items-end justify-end p-2 opacity-0 group-hover/fullimage:opacity-100 transition-opacity">
                  <div
                    className="bg-black/50 hover:bg-black/70 text-white text-sm px-3 py-1.5 rounded-md backdrop-blur-sm transition-colors"
                  >
                    Open original in new tab
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div tabIndex={0} autoFocus className="outline-none" />
              {/* If content was initially blurred but user chose to view it, show a note */}
              {(log.score || 0) < 0 && communityView && user && user.id !== log.user_id && (
                <div className="bg-muted/30 p-2 rounded mb-2 text-xs border border-muted">
                  Note: This content was downvoted by the community.
                </div>
              )}
              <p className="whitespace-pre-wrap">{log.text}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatLocalDateTime(new Date(log.created_at))}</span>
                <div className="flex items-center gap-2 overflow-hidden">
                  {onVote && user && user.id !== log.user_id && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 transition-colors hover:bg-transparent hover:shadow-none [&:hover]:shadow-none [&:hover]:bg-transparent",
                          log.user_vote === 1 
                            ? "text-green-500 hover:text-green-500"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={handleVote(1)}
                        title="Upvote this log"
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <span className={cn(
                        "text-xs font-medium min-w-[1.5rem] text-center",
                        (log.score || 0) > 0 ? "text-green-500" : (log.score || 0) < 0 ? "text-red-500" : "text-muted-foreground"
                      )}>
                        {log.score || 0}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 transition-colors hover:bg-transparent hover:shadow-none [&:hover]:shadow-none [&:hover]:bg-transparent",
                          log.user_vote === -1 
                            ? "text-red-500 hover:text-red-500"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={handleVote(-1)}
                        title="Downvote this log"
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {/* Always show score for user's own logs if there is any */}
                  {user && user.id === log.user_id && (log.score || 0) !== 0 && (
                    <div className="flex items-center mr-1">
                      <span className={cn(
                        "text-xs font-medium min-w-[1.5rem] text-center",
                        (log.score || 0) > 0 ? "text-green-500" : "text-red-500"
                      )}>
                        <ThumbsUp className="inline-block h-3 w-3 mr-0.5" />
                        {Math.abs(log.score || 0)}
                      </span>
                    </div>
                  )}
                  {/* Show copy link button for logs that are public AND have non-negative scores */}
                  {log.is_public && (log.score || 0) >= 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 transition-colors hover:bg-transparent hover:shadow-none [&:hover]:shadow-none [&:hover]:bg-transparent text-muted-foreground hover:text-purple-500 relative focus:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 overflow-visible outline-none focus-visible:outline-none"
                      onClick={(e) => {
                        handleCopyLink(e);
                        // Remove focus immediately after click to allow hover to work again
                        e.currentTarget.blur();
                      }}
                      onMouseDown={(e) => {
                        // Prevent focus on mousedown to avoid focus styles
                        e.preventDefault();
                      }}
                      title="Copy shareable link"
                      tabIndex={-1}
                      data-autofocus="false"
                    >
                      <Link className={cn("h-4 w-4 outline-none", showCopiedTooltip && "text-purple-500 scale-110 transition-all")} />
                      
                      {/* Top notification that's guaranteed to be visible */}
                      {showCopiedTooltip && (
                        <div 
                          className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-sm py-2 px-4 rounded-md shadow-lg z-[9999] animate-in fade-in slide-in-from-top-5 duration-300" 
                        >
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                            Link copied to clipboard!
                          </div>
                        </div>
                      )}
                    </Button>
                  )}
                  {onTogglePublic && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0 transition-colors hover:bg-transparent hover:shadow-none [&:hover]:shadow-none [&:hover]:bg-transparent outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
                        log.is_public 
                          ? "text-blue-500 hover:text-muted-foreground/70" 
                          : "text-muted-foreground hover:text-blue-500"
                      )}
                      onClick={() => onTogglePublic(!log.is_public)}
                      title={log.is_public ? "Make private" : "Make public"}
                    >
                      <Globe className="h-4 w-4 outline-none" />
                    </Button>
                  )}
                  {onToggleFavorite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0 transition-colors hover:bg-transparent hover:shadow-none [&:hover]:shadow-none [&:hover]:bg-transparent",
                        log.is_favorite 
                          ? "text-red-500 hover:text-muted-foreground/70" 
                          : "text-muted-foreground hover:text-red-500"
                      )}
                      onClick={() => onToggleFavorite(!log.is_favorite)}
                      title={log.is_favorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={cn("h-4 w-4", log.is_favorite && "fill-current")} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image</DialogTitle>
          </DialogHeader>
          {log.images[0] && (
            <div className="relative group/fullimage cursor-pointer"
                 onClick={() => {
                   window.open(getOriginalImageUrl(log.images[0].storage_path), '_blank');
                 }}>
              <img
                src={getTransformedImageUrl(log.images[0].storage_path, { 
                  width: 1200,
                  quality: 95,
                  resize: 'contain'
                })}
                alt="Full size"
                className="w-full max-h-[80vh] object-contain rounded-lg"
              />
              <div className="absolute inset-0 flex items-end justify-end p-2 opacity-0 group-hover/fullimage:opacity-100 transition-opacity">
                <div
                  className="bg-black/50 hover:bg-black/70 text-white text-sm px-3 py-1.5 rounded-md backdrop-blur-sm transition-colors"
                >
                  Open original in new tab
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
} 