'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { formatLocalDateTime } from "@/utils/dateFormatting"
import { getTransformedImageUrl, getOriginalImageUrl } from "@/utils/storage"

interface FriendLogCardProps {
  log: {
    id: string
    text: string
    created_at: string
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
}

export function FriendLogCard({ log }: FriendLogCardProps) {
  const [showFullLog, setShowFullLog] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)
  const [isTextOverflowing, setIsTextOverflowing] = useState(false)

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const scrollHeight = textRef.current.scrollHeight;
        const offsetHeight = textRef.current.offsetHeight;
        setIsTextOverflowing(scrollHeight > offsetHeight);
      }
    }
    
    // Initial check after a short delay to ensure content is rendered
    const initialCheckTimeout = setTimeout(checkOverflow, 100);
    
    // Add resize listener
    window.addEventListener('resize', checkOverflow);
    
    // Cleanup
    return () => {
      clearTimeout(initialCheckTimeout);
      window.removeEventListener('resize', checkOverflow);
    }
  }, [log.text]);

  useEffect(() => {
    console.log('isTextOverflowing:', isTextOverflowing);
  }, [isTextOverflowing]);

  return (
    <>
      <div 
        className={cn(
          "group rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 h-[320px] flex flex-col overflow-hidden",
          "hover:-translate-y-1 hover:shadow-[0_0_25px_hsl(var(--primary)/0.35)] hover:border-primary/70"
        )}
      >
        <div 
          className="cursor-pointer flex-1 flex flex-col overflow-hidden"
          onClick={() => setShowFullLog(true)}
        >
          {log.log_images.length > 0 && (
            <div className="relative group/image h-[170px]">
              <img
                src={getTransformedImageUrl(log.log_images[0].storage_path, {
                  width: 400,
                  height: 170,
                  quality: 85,
                  resize: 'cover'
                })}
                alt="Log attachment"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-4 pb-0 flex-1 overflow-hidden">
            <div className={cn(
              "relative h-full",
              isTextOverflowing && "after:absolute after:bottom-0 after:left-[-4px] after:right-[-4px] after:h-[var(--card-fade-height,3rem)] after:bg-gradient-to-t after:from-card after:to-transparent"
            )}>
              <p ref={textRef} className="whitespace-pre-wrap text-sm h-full">
                {log.text}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 pt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="h-8 w-8">
              <AvatarImage src={log.profiles.avatar_url || undefined} alt={log.profiles.display_name} />
              <AvatarFallback>{log.profiles.display_name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span>{log.profiles.display_name}</span>
            <span className="ml-auto">
              {formatLocalDateTime(new Date(log.created_at))}
            </span>
          </div>
        </div>
      </div>

      <Dialog open={showFullLog} onOpenChange={setShowFullLog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Captain's Log</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {log.log_images[0] && (
              <div className="relative group/fullimage">
                <img
                  src={getTransformedImageUrl(log.log_images[0].storage_path, { 
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
                <div className="absolute inset-0 flex items-end justify-end p-2 opacity-0 group-hover/fullimage:opacity-100 transition-opacity">
                  <a
                    href={getOriginalImageUrl(log.log_images[0].storage_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black/50 hover:bg-black/70 text-white text-sm px-3 py-1.5 rounded-md backdrop-blur-sm transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open original in new tab
                  </a>
                </div>
              </div>
            )}
            <p className="whitespace-pre-wrap">{log.text}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
              <Avatar className="h-8 w-8">
                <AvatarImage src={log.profiles.avatar_url || undefined} alt={log.profiles.display_name} />
                <AvatarFallback>{log.profiles.display_name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>{log.profiles.display_name}</span>
              <span className="ml-auto">
                {formatLocalDateTime(new Date(log.created_at))}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Log Image</DialogTitle>
          </DialogHeader>
          {log.log_images[0] && (
            <>
              <img
                src={getTransformedImageUrl(log.log_images[0].storage_path, { 
                  width: 1200,
                  quality: 95,
                  resize: 'contain'
                })}
                alt="Full size"
                className="w-full h-auto"
              />
              <div className="mt-2 text-center">
                <a
                  href={getOriginalImageUrl(log.log_images[0].storage_path)}
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