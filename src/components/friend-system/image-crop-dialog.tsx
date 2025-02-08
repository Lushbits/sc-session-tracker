import { useCallback, useState } from "react"
import Cropper from "react-easy-crop"
import { Area } from "react-easy-crop"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface ImageCropDialogProps {
  imageUrl: string
  open: boolean
  onClose: () => void
  onCropComplete: (croppedAreaPixels: Area) => void
  aspectRatio?: number
  cropShape?: "rect" | "round"
}

export function ImageCropDialog({
  imageUrl,
  open,
  onClose,
  onCropComplete,
  aspectRatio = 1,
  cropShape = "round"
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleSave = () => {
    if (croppedAreaPixels) {
      onCropComplete(croppedAreaPixels)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
          <DialogDescription>
            Adjust the crop area to select your profile picture
          </DialogDescription>
        </DialogHeader>
        <div className="relative aspect-square w-full overflow-hidden rounded-lg">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
            cropShape={cropShape}
            showGrid={false}
            style={{
              containerStyle: {
                width: "100%",
                height: "100%",
                backgroundColor: "black"
              }
            }}
          />
        </div>
        <div className="py-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Zoom</span>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(values: number[]) => setZoom(values[0])}
              className="flex-1"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!croppedAreaPixels}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 