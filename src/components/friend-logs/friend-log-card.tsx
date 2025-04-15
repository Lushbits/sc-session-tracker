'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ThumbsUp, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from "@/lib/utils"
import { formatLocalDateTime } from "@/utils/dateFormatting"
import { getTransformedImageUrl, getOriginalImageUrl } from "@/utils/storage"

interface FriendLogCardProps {
  log: {
    id: string
    text: string
    created_at: string
    user_id: string
    upvotes?: number
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
  onVote?: (logId: string, voteType: number) => Promise<void>
}

export function FriendLogCard({ log, onVote }: FriendLogCardProps) {
  const [showFullLog, setShowFullLog] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)
  const [isTextOverflowing, setIsTextOverflowing] = useState(false)
  
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
      
      // Only show gradient if text is significantly filling the container
      const communityThreshold = 0.95;
      const hasHighFillRatio = textRatio > communityThreshold;
      
      // Set overflow state - with short text exception
      const shouldShowGradient = !isShortText && (hasStandardOverflow || hasHighFillRatio);
      setIsTextOverflowing(shouldShowGradient);
    }
  };
  
  useEffect(() => {
    // Run measurement after DOM is rendered
    const timeoutId = setTimeout(measureTextOverflow, 300);
    
    // Also measure on resize
    window.addEventListener('resize', measureTextOverflow);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', measureTextOverflow);
    };
  }, [log.text]);

  const handleVote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onVote) {
      onVote(log.id, 1); // Always upvote (1) for friends logs
    }
  };

  return (
    <>
      <div 
        className={cn(
          "group rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300",
          "h-[340px]",
          "grid grid-rows-[auto_1fr_auto] overflow-hidden isolation-auto",
          "hover:-translate-y-1 hover:shadow-[0_0_25px_hsl(var(--primary)/0.35)] hover:border-primary/70"
        )}
      >
        <div 
          className="cursor-pointer contents"
          onClick={() => setShowFullLog(true)}
        >
          {log.log_images.length > 0 && (
            <div className="relative group/image">
              <img
                src={getTransformedImageUrl(log.log_images[0].storage_path, {
                  width: 400,
                  height: 170,
                  quality: 85,
                  resize: 'cover'
                })}
                alt="Log attachment"
                className="w-full h-[170px] object-cover"
              />
            </div>
          )}
          
          <div className="p-4 pb-0 overflow-hidden min-h-0 max-h-[110px]">
            <div className="flex items-center mb-2 space-x-2">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {log.profiles.avatar_url ? (
                  <img 
                    src={log.profiles.avatar_url} 
                    alt={log.profiles.display_name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <span className="text-sm font-medium">{log.profiles.display_name}</span>
            </div>
            <div className="relative h-full">
              <p ref={textRef} className="whitespace-pre-wrap text-sm h-full">
                {log.text}
              </p>
              
              {/* Show gradient when text is overflowing */}
              {isTextOverflowing && (
                <div 
                  className="absolute bottom-0 left-0 right-0 pointer-events-none outline-none overflow-hidden h-24"
                  style={{
                    background: 'linear-gradient(to top, hsl(var(--card)) 20%, hsl(var(--card)) 30%, hsl(var(--card) / 0.8) 40%, hsl(var(--card) / 0.6) 50%, hsl(var(--card) / 0.4) 65%, transparent 100%)'
                  }}
                ></div>
              )}
            </div>
          </div>
        </div>

        <div className={cn(
          "self-end outline-none",
          // Small top padding for better spacing
          "px-4 pb-4 pt-2"
        )}>
          <div className="flex items-center justify-between text-xs text-muted-foreground outline-none">
            <span className="outline-none">
              {formatLocalDateTime(new Date(log.created_at))}
            </span>
            <div className="flex items-center gap-2 overflow-hidden outline-none border-none">
              {onVote && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 transition-colors hover:bg-transparent hover:shadow-none [&:hover]:shadow-none [&:hover]:bg-transparent",
                    log.user_vote === 1 
                      ? "text-green-500 hover:text-green-500"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={handleVote}
                  title="Upvote this log"
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showFullLog} onOpenChange={setShowFullLog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {log.profiles.avatar_url ? (
                    <img 
                      src={log.profiles.avatar_url} 
                      alt={log.profiles.display_name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <span>{log.profiles.display_name}'s Log</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div tabIndex={0} autoFocus className="outline-none" />
          <div className="space-y-4">
            {log.log_images[0] && (
              <div className="relative group/fullimage cursor-pointer"
                   onClick={() => {
                     window.open(getOriginalImageUrl(log.log_images[0].storage_path), '_blank');
                   }}>
                <img
                  src={getTransformedImageUrl(log.log_images[0].storage_path, { 
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
              <p className="whitespace-pre-wrap">{log.text}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatLocalDateTime(new Date(log.created_at))}</span>
                <div className="flex items-center gap-2">
                  {onVote && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0 transition-colors hover:bg-transparent hover:shadow-none [&:hover]:shadow-none [&:hover]:bg-transparent",
                        log.user_vote === 1 
                          ? "text-green-500 hover:text-green-500"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={handleVote}
                      tabIndex={-1}
                      title="Upvote this log"
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 