import { useCallback, useState, useRef, useEffect } from "react"
import { Area } from "react-easy-crop"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface LogImageCropDialogProps {
  imageUrl: string
  open: boolean
  onClose: () => void
  onCropComplete: (croppedAreaPixels: Area) => void
}

export function LogImageCropDialog({
  imageUrl,
  open,
  onClose,
  onCropComplete,
}: LogImageCropDialogProps) {
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 })
  const [cropFrame, setCropFrame] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [activeDirections, setActiveDirections] = useState<string[]>([])
  const [dragStartPos, setDragStartPos] = useState({ mouseX: 0, mouseY: 0, frameX: 0, frameY: 0 })
  const [resizeStartPos, setResizeStartPos] = useState({ 
    mouseX: 0, 
    mouseY: 0, 
    frameX: 0, 
    frameY: 0, 
    frameWidth: 0, 
    frameHeight: 0 
  })
  
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // --- Ref based event handling --- 
  // Refs to store the latest versions of the event handlers
  // Initialize with no-op functions to prevent errors before useEffect runs
  const resizeMoveRef = useRef<(e: MouseEvent) => void>(() => {});
  const resizeEndRef = useRef<(e: MouseEvent) => void>(() => {});
  const dragMoveRef = useRef<(e: MouseEvent) => void>(() => {});
  const dragEndRef = useRef<(e: MouseEvent) => void>(() => {});

  // Wrappers that will be attached/detached as listeners
  // These wrappers always call the function currently in the ref
  const handleResizeMoveWrapper = useCallback((e: MouseEvent) => resizeMoveRef.current(e), []);
  const handleResizeEndWrapper = useCallback((e: MouseEvent) => resizeEndRef.current(e), []);
  const handleDragMoveWrapper = useCallback((e: MouseEvent) => dragMoveRef.current(e), []);
  const handleDragEndWrapper = useCallback((e: MouseEvent) => dragEndRef.current(e), []);
  // --- End Ref based event handling ---

  // Prevent text selection during drag/resize operations
  useEffect(() => {
    const preventSelection = (e: Event) => {
      if (isDragging || isResizing) {
        e.preventDefault()
      }
    }
    
    document.addEventListener('selectstart', preventSelection)
    
    return () => {
      document.removeEventListener('selectstart', preventSelection)
    }
  }, [isDragging, isResizing])

  // Initialize crop frame when image loads
  const handleImageLoad = () => {
    if (imageRef.current) {
      const img = imageRef.current
      
      // Get natural image dimensions
      const naturalWidth = img.naturalWidth
      const naturalHeight = img.naturalHeight
      
      // Get display dimensions - the actual size the image is being shown at
      const displayWidth = img.width
      const displayHeight = img.height
      
      setImageDimensions({
        width: naturalWidth,
        height: naturalHeight
      })
      
      setDisplayDimensions({
        width: displayWidth,
        height: displayHeight
      })
      
      // Start with a crop that's exactly the size of the displayed image
      setCropFrame({
        x: 0,
        y: 0,
        width: displayWidth,
        height: displayHeight
      })
      
      setImageLoaded(true)
    }
  }

  // --- Define Core Logic Handlers (BEFORE useEffect updates refs) ---

  // Handle resize movement (Original useCallback definition)
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    
    e.preventDefault()
    e.stopPropagation()
    
    // Calculate deltas from the start position
    const dx = e.clientX - resizeStartPos.mouseX
    const dy = e.clientY - resizeStartPos.mouseY
    
    // Create a new frame based on original dimensions
    let newFrame = { ...cropFrame }
    
    // Apply horizontal resize
    if (activeDirections.includes('left')) {
      const newX = resizeStartPos.frameX + dx
      const newWidth = resizeStartPos.frameWidth - dx
      
      if (newX >= 0 && newWidth >= 50) {
        newFrame.x = newX
        newFrame.width = newWidth
      } else if (newX < 0) {
        // If trying to go beyond the left edge
        newFrame.x = 0
        newFrame.width = resizeStartPos.frameWidth + resizeStartPos.frameX
      }
    } else if (activeDirections.includes('right')) {
      const newWidth = resizeStartPos.frameWidth + dx
      
      if (newWidth >= 50) {
        if (resizeStartPos.frameX + newWidth <= displayDimensions.width) {
          newFrame.width = newWidth
        } else {
          // If trying to go beyond the right edge
          newFrame.width = displayDimensions.width - resizeStartPos.frameX
        }
      }
    }
    
    // Apply vertical resize
    if (activeDirections.includes('top')) {
      const newY = resizeStartPos.frameY + dy
      const newHeight = resizeStartPos.frameHeight - dy
      
      if (newY >= 0 && newHeight >= 50) {
        newFrame.y = newY
        newFrame.height = newHeight
      } else if (newY < 0) {
        // If trying to go beyond the top edge
        newFrame.y = 0
        newFrame.height = resizeStartPos.frameHeight + resizeStartPos.frameY
      }
    } else if (activeDirections.includes('bottom')) {
      const newHeight = resizeStartPos.frameHeight + dy
      
      if (newHeight >= 50) {
        if (resizeStartPos.frameY + newHeight <= displayDimensions.height) {
          newFrame.height = newHeight
        } else {
          // If trying to go beyond the bottom edge
          newFrame.height = displayDimensions.height - resizeStartPos.frameY
        }
      }
    }
    
    setCropFrame(newFrame)
  }, [isResizing, activeDirections, resizeStartPos, cropFrame, displayDimensions.width, displayDimensions.height])
  
  // End resize operation (Original useCallback definition)
  const handleResizeEnd = useCallback((e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(false)
    setActiveDirections([])
    
    // Remove document-level event listeners using the stable wrappers
    document.removeEventListener('mousemove', handleResizeMoveWrapper)
    document.removeEventListener('mouseup', handleResizeEndWrapper)
  }, [handleResizeMoveWrapper, handleResizeEndWrapper]) // Depend on wrappers now

  // Handle mouse move for dragging (Original useCallback definition)
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    
    e.preventDefault()
    e.stopPropagation()
    
    // Calculate delta from the original mouse position
    const deltaX = e.clientX - dragStartPos.mouseX
    const deltaY = e.clientY - dragStartPos.mouseY
    
    // Apply delta to the original frame position
    const newX = dragStartPos.frameX + deltaX
    const newY = dragStartPos.frameY + deltaY
    
    // Ensure the crop frame stays within image bounds
    const boundedX = Math.max(0, Math.min(newX, displayDimensions.width - cropFrame.width))
    const boundedY = Math.max(0, Math.min(newY, displayDimensions.height - cropFrame.height))
    
    setCropFrame(prev => ({
      ...prev,
      x: boundedX,
      y: boundedY
    }))
  }, [isDragging, dragStartPos, cropFrame.width, cropFrame.height, displayDimensions.width, displayDimensions.height])
  
  // Handle mouse up to end dragging (Original useCallback definition)
  const handleDragEnd = useCallback((e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragging(false)
    
    // Remove document-level event listeners using the stable wrappers
    document.removeEventListener('mousemove', handleDragMoveWrapper)
    document.removeEventListener('mouseup', handleDragEndWrapper)
  }, [handleDragMoveWrapper, handleDragEndWrapper]) // Depend on wrappers now

  // --- End Define Core Logic Handlers ---

  // --- Update Refs with latest handlers (AFTER defining them) ---
  useEffect(() => {
    resizeMoveRef.current = handleResizeMove;
  }, [handleResizeMove]);

  useEffect(() => {
    resizeEndRef.current = handleResizeEnd;
  }, [handleResizeEnd]);

  useEffect(() => {
    dragMoveRef.current = handleDragMove;
  }, [handleDragMove]);

  useEffect(() => {
    dragEndRef.current = handleDragEnd;
  }, [handleDragEnd]);
  // --- End Update Refs ---

  // Start resize operation
  const handleResizeStart = (e: React.MouseEvent, directions: string[]) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(true)
    setActiveDirections(directions)
    
    // Store the initial mouse position and frame dimensions
    setResizeStartPos({
      mouseX: e.clientX,
      mouseY: e.clientY,
      frameX: cropFrame.x,
      frameY: cropFrame.y,
      frameWidth: cropFrame.width,
      frameHeight: cropFrame.height
    })
    
    // Add global event listeners using the stable wrappers
    document.addEventListener('mousemove', handleResizeMoveWrapper, { passive: false })
    document.addEventListener('mouseup', handleResizeEndWrapper, { passive: false })
  }
  
  // Handle mouse down for dragging
  const handleDragStart = (e: React.MouseEvent) => {
    // Prevent default to stop text selection
    e.preventDefault()
    e.stopPropagation()
    
    // Only start drag if we're not clicking a resize handle
    if ((e.target as HTMLElement).closest('.resize-handle')) {
      return
    }
    
    setIsDragging(true)
    
    // Store both the mouse position and frame position at drag start
    setDragStartPos({
      mouseX: e.clientX,
      mouseY: e.clientY,
      frameX: cropFrame.x,
      frameY: cropFrame.y
    })
    
    // Add document-level event listeners using the stable wrappers
    document.addEventListener('mousemove', handleDragMoveWrapper, { passive: false })
    document.addEventListener('mouseup', handleDragEndWrapper, { passive: false })
  }
  
  // Cleanup for drag operation
  useEffect(() => {
    // Cleanup function to remove listeners if the component unmounts unexpectedly
    // during a drag or resize operation.
    return () => {
      if (isDragging) {
        document.removeEventListener('mousemove', handleDragMoveWrapper);
        document.removeEventListener('mouseup', handleDragEndWrapper);
      }
      if (isResizing) {
        document.removeEventListener('mousemove', handleResizeMoveWrapper);
        document.removeEventListener('mouseup', handleResizeEndWrapper);
      }
    };
  }, [isDragging, isResizing, handleDragMoveWrapper, handleDragEndWrapper, handleResizeMoveWrapper, handleResizeEndWrapper]);

  const handleSave = () => {
    // Get scale factors to convert from display coordinates to actual image coordinates
    const scaleX = imageDimensions.width / displayDimensions.width
    const scaleY = imageDimensions.height / displayDimensions.height
    
    // Convert crop frame from display coordinates to actual image coordinates
    const croppedAreaPixels: Area = {
      x: Math.round(cropFrame.x * scaleX),
      y: Math.round(cropFrame.y * scaleY),
      width: Math.round(cropFrame.width * scaleX),
      height: Math.round(cropFrame.height * scaleY)
    }
    
    onCropComplete(croppedAreaPixels)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-4 flex flex-col gap-4 w-auto h-auto sm:max-w-none">
        <DialogHeader className="pb-0">
          <DialogTitle>Crop Log Image</DialogTitle>
          <DialogDescription className="select-none">
            Click and drag the resize handles to adjust the crop area
          </DialogDescription>
        </DialogHeader>
        <div 
          className="relative select-none overflow-hidden" 
          ref={containerRef}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="To crop"
            className="max-w-[80vw] max-h-[80vh] block select-none"
            onLoad={handleImageLoad}
            style={{
              userSelect: 'none'
            }}
          />
          
          {imageLoaded && (
            <div 
              className="absolute inset-0 select-none"
            >
              <div className="absolute inset-0 bg-black/60" />
              
              <div 
                className="absolute cursor-move select-none"
                style={{
                  top: cropFrame.y,
                  left: cropFrame.x,
                  width: cropFrame.width,
                  height: cropFrame.height,
                  background: 'transparent',
                  border: '2px dashed white'
                }}
                onMouseDown={handleDragStart}
              >
                <div className="absolute inset-0 bg-transparent" />
                
                <div 
                  className="absolute top-0 left-0 right-0 h-6 cursor-ns-resize"
                  onMouseDown={(e) => handleResizeStart(e, ['top'])}
                >
                  <div className="resize-handle absolute left-1/2 top-[-2px] w-3 h-3 bg-white -translate-x-1/2" />
                </div>
                
                <div 
                  className="absolute bottom-0 left-0 right-0 h-6 cursor-ns-resize"
                  onMouseDown={(e) => handleResizeStart(e, ['bottom'])}
                >
                  <div className="resize-handle absolute left-1/2 bottom-[-2px] w-3 h-3 bg-white -translate-x-1/2" />
                </div>
                
                <div 
                  className="absolute left-0 top-0 bottom-0 w-6 cursor-ew-resize"
                  onMouseDown={(e) => handleResizeStart(e, ['left'])}
                >
                  <div className="resize-handle absolute left-[-2px] top-1/2 w-3 h-3 bg-white -translate-y-1/2" />
                </div>
                
                <div 
                  className="absolute right-0 top-0 bottom-0 w-6 cursor-ew-resize"
                  onMouseDown={(e) => handleResizeStart(e, ['right'])}
                >
                  <div className="resize-handle absolute right-[-2px] top-1/2 w-3 h-3 bg-white -translate-y-1/2" />
                </div>
                
                <div 
                  className="absolute top-0 left-0 w-6 h-6 cursor-nwse-resize"
                  onMouseDown={(e) => handleResizeStart(e, ['top', 'left'])}
                >
                  <div className="resize-handle absolute left-[-2px] top-[-2px] w-3 h-3 bg-white" />
                </div>
                
                <div 
                  className="absolute top-0 right-0 w-6 h-6 cursor-nesw-resize"
                  onMouseDown={(e) => handleResizeStart(e, ['top', 'right'])}
                >
                  <div className="resize-handle absolute right-[-2px] top-[-2px] w-3 h-3 bg-white" />
                </div>
                
                <div 
                  className="absolute bottom-0 left-0 w-6 h-6 cursor-nesw-resize"
                  onMouseDown={(e) => handleResizeStart(e, ['bottom', 'left'])}
                >
                  <div className="resize-handle absolute left-[-2px] bottom-[-2px] w-3 h-3 bg-white" />
                </div>
                
                <div 
                  className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize"
                  onMouseDown={(e) => handleResizeStart(e, ['bottom', 'right'])}
                >
                  <div className="resize-handle absolute right-[-2px] bottom-[-2px] w-3 h-3 bg-white" />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!imageLoaded}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 