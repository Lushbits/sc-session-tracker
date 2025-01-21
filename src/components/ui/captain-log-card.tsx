import { Trash2 } from 'lucide-react'
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
  onLogDeleted?: () => void
}

export function CaptainLogCard({ log, onDelete, onLogDeleted }: CaptainLogCardProps) {
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
      onLogDeleted?.()
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
          "hover:scale-[1.01] hover:border-primary hover:shadow-[0_0_15px_rgba(var(--primary-rgb)/0.15)]"
        )}
      >
        {log.images.length > 0 && (
          <div>
            <a
              href={getOriginalImageUrl(log.images[0].storage_path)}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <img
                src={getTransformedImageUrl(log.images[0].storage_path, {
                  width: 400,
                  height: 170,
                  quality: 85,
                  resize: 'cover'
                })}
                alt="Log attachment"
                className="w-full h-[170px] object-cover hover:opacity-90 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  setShowFullImage(true);
                }}
              />
            </a>
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
            {isTextOverflowing && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs bg-primary/10 text-primary border border-primary/20 transition-all hover:bg-primary/20 hover:border-primary/30 hover:shadow-[0_0_15px_hsla(var(--primary)/0.2)] hover-glow balance-adjust-button"
                onClick={() => setShowFullLog(true)}
              >
                Read more
              </Button>
            )}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Captain's Log</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {log.images[0] && (
              <img
                src={getTransformedImageUrl(log.images[0].storage_path, { 
                  width: 800,
                  quality: 90,
                  resize: 'contain'
                })}
                alt="Log attachment"
                className="w-full rounded-lg"
                onClick={() => {
                  setShowFullLog(false)
                  setShowFullImage(true)
                }}
              />
            )}
            <div className="space-y-4">
              <p className="whitespace-pre-wrap">{log.text}</p>
              <p className="text-sm text-muted-foreground">
                {formatLocalDateTime(new Date(log.created_at))}
              </p>
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
            <>
              <img
                src={getTransformedImageUrl(log.images[0].storage_path, { 
                  width: 1200,
                  quality: 95,
                  resize: 'contain'
                })}
                alt="Full size"
                className="w-full max-h-[80vh] object-contain rounded-lg"
              />
              <div className="mt-2 text-center">
                <a
                  href={getOriginalImageUrl(log.images[0].storage_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  Open original in new tab
                </a>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
} 