import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CaptainLog } from '@/types'
import { Loader2, ThumbsUp, ThumbsDown, ExternalLink, Link } from 'lucide-react'
import { Button } from './ui/button'
import { getTransformedImageUrl, getOriginalImageUrl } from '@/utils/storage'
import { formatLocalDateTime } from '@/utils/dateFormatting'
import { Footer } from './Footer'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from './ui/use-toast'
import { cn } from '@/lib/utils'

interface PublicLogViewProps {
  logId: string
}

export function PublicLogView({ logId }: PublicLogViewProps) {
  const [log, setLog] = useState<CaptainLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<any[]>([])
  const [author, setAuthor] = useState<any>(null)
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const isOwnLog = user && log ? user.id === log.user_id : false

  useEffect(() => {
    const fetchLog = async () => {
      try {
        setLoading(true)
        
        // Only fetch logs that are marked as public
        const { data, error } = await supabase
          .from('captain_logs')
          .select('*')
          .eq('id', logId)
          .eq('is_public', true)
          .single()
          
        if (error) {
          console.error('Error fetching log:', error)
          throw error
        }
        
        if (data) {
          setLog(data)
          
          // Fetch images for this log
          const { data: imageData } = await supabase
            .from('log_images')
            .select('*')
            .eq('log_id', logId)
            
          setImages(imageData || [])
          
          // Fetch author profile data
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, user_id, display_name, username, avatar_url')
            .eq('user_id', data.user_id)
            .single()
            
          setAuthor(profileData)
          
          // If user is logged in, fetch their vote on this log
          if (isAuthenticated && user) {
            const { data: voteData } = await supabase
              .from('log_votes')
              .select('vote_type')
              .eq('log_id', logId)
              .eq('user_id', user.id)
              .single()
            
            if (voteData) {
              setLog(prev => prev ? {...prev, user_vote: voteData.vote_type} : prev)
            }
          }
        } else {
          setError('Log not found or is private')
        }
      } catch (error) {
        console.error('Error fetching log:', error)
        setError('Could not load the requested log. It may be private or no longer exist.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchLog()
  }, [logId, isAuthenticated, user])
  
  const handleVote = async (voteType: number) => {
    if (!user || !log) {
      toast({
        title: "Sign in required",
        description: "You need to be signed in to vote on logs.",
        variant: "destructive"
      })
      return
    }

    try {
      // Check if user already voted the same way
      const currentVote = log.user_vote || 0;
      
      // Determine the new vote value - toggle if same button clicked
      let newVoteValue = voteType;
      if (currentVote === voteType) {
        // If clicking the same button again, remove the vote
        newVoteValue = 0;
      }
      
      // Call the toggle_vote_on_log RPC function
      const { error } = await supabase.rpc('toggle_vote_on_log', {
        p_log_id: log.id,
        p_user_id: user.id,
        p_vote_type: newVoteValue
      })

      if (error) throw error

      toast({
        title: newVoteValue === 0 ? "Vote Removed" : 
               newVoteValue === 1 ? "Upvoted" : "Downvoted",
        description: newVoteValue === 0 ? "Your vote has been removed." :
                     `You have ${newVoteValue === 1 ? 'upvoted' : 'downvoted'} this log.`
      })

      // Update the log in the UI (optimistic update)
      setLog(prevLog => {
        if (!prevLog) return null;
        
        // Calculate vote changes based on previous and new vote
        let upvoteChange = 0;
        let downvoteChange = 0;
        
        // Handle removing previous vote
        if (currentVote === 1) upvoteChange--;
        if (currentVote === -1) downvoteChange--;
        
        // Handle adding new vote
        if (newVoteValue === 1) upvoteChange++;
        if (newVoteValue === -1) downvoteChange++;
        
        const newUpvotes = (prevLog.upvotes || 0) + upvoteChange;
        const newDownvotes = (prevLog.downvotes || 0) + downvoteChange;
        const newScore = (newUpvotes || 0) - (newDownvotes || 0);
        
        return { 
          ...prevLog, 
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          score: newScore,
          user_vote: newVoteValue
        };
      });
    } catch (error) {
      console.error('Error voting on log:', error)
      toast({
        title: "Error",
        description: "Failed to register your vote. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  const handleCopyLink = () => {
    // Create a shareable URL for this log
    const shareableUrl = window.location.href;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareableUrl).then(() => {
      // Show the tooltip
      setShowCopiedTooltip(true);
      
      // Hide it after 2 seconds
      setTimeout(() => {
        setShowCopiedTooltip(false);
      }, 2000);
      
      toast({
        title: "Link copied",
        description: "Shareable link copied to clipboard."
      });
    }).catch(() => {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard. Please try again.",
        variant: "destructive"
      });
    });
  };
  
  if (loading) {
    return (
      <div className={`${!isAuthenticated ? 'min-h-screen' : ''} bg-background flex items-center justify-center p-4`}>
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading shared log...</p>
        </div>
      </div>
    )
  }
  
  if (error || !log) {
    return (
      <div className={`${!isAuthenticated ? 'min-h-screen' : ''} bg-background flex items-center justify-center p-4`}>
        <div className="max-w-md w-full bg-card border rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Log Not Available</h2>
          <p className="text-muted-foreground mb-6">
            {error || "This log doesn't exist or is private."}
          </p>
          <Button onClick={() => window.location.href = '/'} className="mt-4">
            Return Home
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`bg-background ${!isAuthenticated ? 'min-h-screen flex flex-col' : ''}`}>
      
      <main className={`container mx-auto p-4 ${!isAuthenticated ? 'py-8 flex-grow' : 'py-6'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border rounded-lg shadow-md overflow-hidden">
            {author && (
              <div className="p-6 pb-2 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {author.avatar_url ? (
                      <img 
                        src={author.avatar_url} 
                        alt={author.display_name || author.username} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-primary/20 text-primary flex items-center justify-center">
                        {(author.display_name || author.username || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h1 className="text-xl font-bold">
                        {author.display_name || author.username || `User ${author.user_id.substring(0, 6)}`}'s Log
                      </h1>
                      <p className="text-sm text-muted-foreground">
                        Shared on {formatLocalDateTime(new Date(log.created_at))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {!author && (
              <div className="p-6 pb-2 border-b">
                <div className="flex justify-between items-center">
                  <h1 className="text-xl font-bold">Shared Log</h1>
                  <p className="text-sm text-muted-foreground">
                    Shared on {formatLocalDateTime(new Date(log.created_at))}
                  </p>
                </div>
              </div>
            )}
            
            {images.length > 0 && (
              <div className="relative cursor-pointer" onClick={() => {
                window.open(getOriginalImageUrl(images[0].storage_path), '_blank')
              }}>
                <img
                  src={getTransformedImageUrl(images[0].storage_path, {
                    width: 1200,
                    quality: 95,
                    resize: 'contain'
                  })}
                  alt="Log attachment"
                  className="w-full max-h-[500px] object-contain bg-black/20"
                />
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  View original
                </div>
              </div>
            )}
            
            <div className="p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-base leading-relaxed">{log.text}</p>
              </div>
              
              <div className="mt-6 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  {(log.score ?? 0) > 0 && !isAuthenticated && (
                    <span className="text-green-500 flex items-center gap-1 mr-3">
                      <ThumbsUp className="h-4 w-4" />
                      {log.score ?? 0}
                    </span>
                  )}
                  {!isAuthenticated && <span>Shared from SC Session Tracker</span>}
                </div>
                
                {/* Voting and sharing buttons for logged-in users who aren't the author */}
                {isAuthenticated && !isOwnLog && (
                  <div className="flex items-center gap-2">
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
                        onClick={() => handleVote(1)}
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
                        onClick={() => handleVote(-1)}
                        title="Downvote this log"
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 transition-colors hover:bg-transparent hover:shadow-none [&:hover]:shadow-none [&:hover]:bg-transparent text-muted-foreground hover:text-purple-500 relative"
                      onClick={handleCopyLink}
                      title="Copy shareable link"
                      tabIndex={-1}
                    >
                      <Link className="h-4 w-4" />
                      {showCopiedTooltip && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-200">
                          Copied!
                        </div>
                      )}
                    </Button>
                  </div>
                )}
                
                {/* Show score for own logs */}
                {isAuthenticated && isOwnLog && (log.score || 0) !== 0 && (
                  <div className="flex items-center">
                    <span className={cn(
                      "text-xs font-medium min-w-[1.5rem] text-center",
                      (log.score || 0) > 0 ? "text-green-500" : "text-red-500"
                    )}>
                      <ThumbsUp className="inline-block h-3 w-3 mr-0.5" />
                      {Math.abs(log.score || 0)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* CTA Section - only show when not authenticated */}
              {!isAuthenticated && (
                <div className="mt-8 bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg text-primary">Track your Star Citizen sessions</h3>
                      <p className="text-sm text-muted-foreground">
                        This log was captured using SC Session Tracker. 
                        Sign up free to track your own missions and share with friends.
                      </p>
                    </div>
                    <Button 
                      size="lg"
                      className="whitespace-nowrap gap-2"
                      onClick={() => window.location.href = '/'}
                    >
                      <span>Sign Up Free</span>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Only show footer for non-authenticated users */}
      {!isAuthenticated && <Footer />}
    </div>
  )
} 