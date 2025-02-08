import { useState, useRef, useEffect } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop, convertToPixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageCropDialogProps {
  open: boolean
  onClose: () => void
  imageUrl: string
  onCropComplete: (croppedImageUrl: string) => void
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function ImageCropDialog({ open, onClose, imageUrl, onCropComplete }: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Crop>()
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 })
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const image = new Image()
    image.src = imageUrl
    image.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = image
      setImgDimensions({ width, height })
      setCrop(centerAspectCrop(width, height, 1))
    }
  }, [imageUrl])

  const getCroppedImg = (image: HTMLImageElement, percentCrop: Crop) => {
    const canvas = document.createElement('canvas')
    
    // Convert percentage crop to pixel values
    const pixelCrop = convertToPixelCrop(
      percentCrop,
      image.naturalWidth,
      image.naturalHeight
    )

    // Set canvas size to the cropped image size
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('No 2d context')
    }

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    return canvas.toDataURL('image/jpeg', 0.9)
  }

  const handleComplete = () => {
    if (imageRef.current && crop?.width && crop?.height) {
      const croppedImageUrl = getCroppedImg(imageRef.current, crop)
      onCropComplete(croppedImageUrl)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[675px]">
        <DialogHeader>
          <DialogTitle>Adjust Profile Picture</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {!!crop && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              aspect={1}
              circularCrop
              className="max-h-[500px] rounded-lg"
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop me"
                className="max-h-[500px] w-auto"
                style={{ maxHeight: '500px', width: 'auto' }}
              />
            </ReactCrop>
          )}
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleComplete}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 