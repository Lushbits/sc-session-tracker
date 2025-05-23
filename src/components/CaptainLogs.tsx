import { useState, useRef } from 'react'
import { Trash2, Image as ImageIcon, Upload, Scissors } from 'lucide-react'
import { useCaptainLogs } from '../hooks/useCaptainLogs'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"
import { useToast } from "./ui/use-toast"
import { formatLocalDateTime } from '../utils/dateFormatting'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { deleteLogImages, getTransformedImageUrl, getOriginalImageUrl } from '../utils/storage'
import { cn } from '@/lib/utils'
import { CaptainLog } from '../types'
import { Area } from 'react-easy-crop'
import { getCroppedImg } from '../utils/image-crop'
import { LogImageCropDialog } from './log-image-crop-dialog'

interface CaptainLogsProps {
  sessionId: string
}

export function CaptainLogs({ sessionId }: CaptainLogsProps) {
  const [newLogText, setNewLogText] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [logToDelete, setLogToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [showCropDialog, setShowCropDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { logs, addLog, setLogs } = useCaptainLogs(sessionId)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleImagePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    const imageItem = Array.from(items || []).find(item => item.type.startsWith('image'))
    
    if (imageItem) {
      const file = imageItem.getAsFile()
      if (file) {
        setSelectedImage(file)
        const url = URL.createObjectURL(file)
        setImagePreviewUrl(url)
      }
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const url = URL.createObjectURL(file)
      setImagePreviewUrl(url)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file)
      const url = URL.createObjectURL(file)
      setImagePreviewUrl(url)
    }
  }

  const handleOpenCropDialog = () => {
    if (imagePreviewUrl) {
      setShowCropDialog(true)
    }
  }

  const handleCropComplete = async (croppedAreaPixels: Area) => {
    if (!imagePreviewUrl || !selectedImage) return
    
    try {
      const croppedImageUrl = await getCroppedImg(
        imagePreviewUrl,
        croppedAreaPixels
      )
      
      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()
      
      const file = new File([blob], selectedImage.name || 'log-image.jpg', {
        type: 'image/jpeg'
      })
      
      setSelectedImage(file)
      setImagePreviewUrl(croppedImageUrl)
      setShowCropDialog(false)
    } catch (error) {
      console.error('Error cropping image:', error)
      toast({
        title: "Error",
        description: "Failed to crop image. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newLogText.trim() || selectedImage) {
      await addLog(newLogText, selectedImage ? [selectedImage] : [])
      setNewLogText('')
      setSelectedImage(null)
      setImagePreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteClick = (logId: string) => {
    setLogToDelete(logId)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!logToDelete || !user) return

    setIsDeleting(true)
    setIsRemoving(true)
    try {
      const imageDeleteResult = await deleteLogImages(logToDelete, user.id)
      if (!imageDeleteResult.success) {
        throw new Error('Failed to delete images')
      }

      const { error } = await supabase
        .from('captain_logs')
        .delete()
        .eq('id', logToDelete)
        .eq('user_id', user.id)

      if (error) throw error

      setLogs((prevLogs: CaptainLog[]) => 
        prevLogs.filter((log: CaptainLog) => log.id !== logToDelete)
      )

      toast({
        title: "Log deleted",
        description: "Your captain's log has been deleted successfully."
      })
    } catch (error) {
      console.error('Error in delete operation:', error)
      setIsRemoving(false)
      toast({
        title: "Error",
        description: "Failed to delete the log. Please try again.",
        variant: "destructive"
      })
      throw error
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setLogToDelete(null)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit}>
        <div className="rounded-lg border bg-card">
          {imagePreviewUrl && (
            <div className="relative border-b">
              <img 
                src={imagePreviewUrl} 
                alt="Preview" 
                className="w-full h-auto object-contain"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleOpenCropDialog}
                >
                  <Scissors className="h-4 w-4 mr-1.5" />
                  Crop
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setSelectedImage(null)
                    setImagePreviewUrl(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          )}
          <Textarea
            value={newLogText}
            onChange={(e) => setNewLogText(e.target.value)}
            onPaste={handleImagePaste}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            placeholder="Write a new Captain's Log..."
            className="min-h-[180px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-thin scrollbar-thumb-secondary scrollbar-track-secondary/20 hover:scrollbar-thumb-secondary/80"
          />
          <div className="flex items-center justify-between border-t p-2 px-3">
            {!selectedImage && (
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <div className="flex items-center">
                  <ImageIcon className="h-4 w-4 mr-1.5" />
                  Ctrl+V or drop
                </div>
                <div className="flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-1.5" />
                    Upload
                  </Button>
                </div>
              </div>
            )}
            <div className="ml-auto">
              <Button 
                type="submit" 
                className="h-8 px-2 text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/30 hover:shadow-[0_0_15px_hsla(var(--primary)/0.2)] transition-all"
              >
                Add Log
              </Button>
            </div>
          </div>
        </div>
      </form>

      <div className="space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-secondary/20 hover:scrollbar-thumb-secondary/80">
        {logs.map((log) => (
          <div
            key={log.id}
            className={cn(
              "group rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden transition-all duration-300",
              logToDelete === log.id && isRemoving && "opacity-0 scale-95"
            )}
          >
            {log.images[0] && (
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
                      width: 800,
                      height: 200,
                      quality: 85,
                      resize: 'cover'
                    })}
                    alt="Log attachment"
                    className="w-full h-[200px] object-cover hover:opacity-90 transition-opacity cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      setViewImageUrl(log.images[0].storage_path);
                    }}
                  />
                </a>
              </div>
            )}
            <div className="p-4 space-y-2">
              <p className="whitespace-pre-wrap">{log.text}</p>
              <div className="flex items-center text-sm text-muted-foreground">
                <div className="w-0 group-hover:w-8 transition-[width] duration-200 overflow-hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleDeleteClick(log.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <span className="transition-[margin] duration-200 group-hover:ml-2">
                  {formatLocalDateTime(new Date(log.created_at))}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!viewImageUrl} onOpenChange={() => setViewImageUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Captain's Log Image</DialogTitle>
            <DialogDescription>View the full size image from your log entry.</DialogDescription>
          </DialogHeader>
          {viewImageUrl && (
            <>
              <img
                src={getTransformedImageUrl(viewImageUrl, { 
                  width: 1200,
                  quality: 95,
                  resize: 'contain'
                })}
                alt="Full size"
                className="w-full h-auto"
              />
              <div className="mt-2 text-center">
                <a
                  href={getOriginalImageUrl(viewImageUrl)}
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
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {imagePreviewUrl && (
        <LogImageCropDialog
          open={showCropDialog}
          onClose={() => setShowCropDialog(false)}
          imageUrl={imagePreviewUrl}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  )
} 