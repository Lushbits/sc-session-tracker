import { Trash2, Heart } from 'lucide-react'
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
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatLocalDateTime } from '@/utils/dateFormatting'
import { deleteLogImages, getTransformedImageUrl, getOriginalImageUrl } from '@/utils/storage'

interface CaptainLogCardProps {
  log: CaptainLog
  onDelete?: () => void
  onToggleFavorite?: (isFavorite: boolean) => void
}

export function CaptainLogCard({ log, onDelete, onToggleFavorite }: CaptainLogCardProps) {
  const [showFullLog, setShowFullLog] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)
  const [isTextOverflowing, setIsTextOverflowing] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const hasOverflow = textRef.current.scrollHeight > textRef.current.offsetHeight
        setIsTextOverflowing(hasOverflow)
      }
    }
    
    const timeoutId = setTimeout(checkOverflow, 0)
    window.addEventListener('resize', checkOverflow)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', checkOverflow)
    }
  }, [log.text])

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

      toast({
        title: "Log deleted",
        description: "Your captain's log has been deleted successfully."
      })

      // Notify parent about deletion
      onDelete?.()
    } catch (error) {
      console.error('Error deleting log:', error)
      setIsRemoving(false)
      toast({
        title: "Error",
        description: "Failed to delete the log. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <div 
        className={cn(
          "group rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 h-[320px] grid grid-rows-[auto_1fr_auto] overflow-hidden",
          isRemoving && "opacity-0 scale-95",
          "hover:-translate-y-1 hover:shadow-[0_0_25px_hsl(var(--primary)/0.35)] hover:border-primary/70"
        )}
      >
        <div 
          className="cursor-pointer contents"
          onClick={() => setShowFullLog(true)}
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
                className="w-full h-[170px] object-cover"
              />
            </div>
          )}
          
          <div className="p-4 pb-0 overflow-hidden min-h-0">
            <div className={cn(
              "relative h-full",
              isTextOverflowing && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[var(--card-fade-height,3rem)] after:bg-gradient-to-t after:from-card after:to-transparent"
            )}>
              <p ref={textRef} className="whitespace-pre-wrap text-sm h-full">
                {log.text}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 self-end">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              <div className="w-0 group-hover:w-8 transition-all duration-200 overflow-hidden">
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <span className="transition-transform duration-200 group-hover:translate-x-2">
                {formatLocalDateTime(new Date(log.created_at))}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 transition-colors hover:bg-transparent hover:shadow-none [&:hover]:shadow-none [&:hover]:bg-transparent",
                log.is_favorite 
                  ? "text-red-500 hover:text-muted-foreground/70" 
                  : "text-muted-foreground hover:text-red-500"
              )}
              onClick={() => onToggleFavorite?.(!log.is_favorite)}
            >
              <Heart className={cn("h-4 w-4", log.is_favorite && "fill-current")} />
            </Button>
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
            <DialogTitle>Captain's Log</DialogTitle>
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
              <p className="whitespace-pre-wrap">{log.text}</p>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{formatLocalDateTime(new Date(log.created_at))}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 transition-colors hover:bg-transparent hover:shadow-none [&:hover]:shadow-none [&:hover]:bg-transparent",
                    log.is_favorite 
                      ? "text-red-500 hover:text-muted-foreground/70" 
                      : "text-muted-foreground hover:text-red-500"
                  )}
                  onClick={() => onToggleFavorite?.(!log.is_favorite)}
                >
                  <Heart className={cn("h-4 w-4", log.is_favorite && "fill-current")} />
                </Button>
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