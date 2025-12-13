'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Area, Point } from 'react-easy-crop'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ImageCropModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string
  onCropComplete: (croppedImage: Blob, rotation: number) => void
}

const ASPECT_RATIOS = {
  free: { value: undefined, label: 'Free' },
  square: { value: 1, label: 'Square (1:1)' },
  '4:3': { value: 4 / 3, label: '4:3' },
  '16:9': { value: 16 / 9, label: '16:9' },
  '3:2': { value: 3 / 2, label: '3:2' },
  '2:3': { value: 2 / 3, label: 'Portrait (2:3)' },
}

export function ImageCropModal({ isOpen, onClose, imageSrc, onCropComplete }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)
  const [autoStraightening, setAutoStraightening] = useState(false)

  const onCropAreaChange = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleAutoStraighten = async () => {
    setAutoStraightening(true)
    try {
      const detectedAngle = await detectHorizonAngle(imageSrc)
      if (detectedAngle !== null) {
        // Normalize angle to -45 to +45 range for small corrections
        let correctionAngle = detectedAngle
        if (correctionAngle > 45) correctionAngle -= 90
        if (correctionAngle < -45) correctionAngle += 90

        setRotation(-correctionAngle) // Negative to correct the tilt
      } else {
        alert('Could not detect a clear horizon or edge to straighten. Try manual adjustment.')
      }
    } catch (error) {
      console.error('Auto-straighten failed:', error)
      alert('Auto-straighten failed. Please use manual rotation.')
    } finally {
      setAutoStraightening(false)
    }
  }

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return

    setProcessing(true)
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)
      onCropComplete(croppedBlob, rotation)
      onClose()
    } catch (error) {
      console.error('Failed to crop image:', error)
      alert('Failed to crop image. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Crop & Straighten Image</DialogTitle>
          <DialogDescription>
            Adjust the crop area, zoom, and rotation to perfect your image
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Crop area */}
          <div className="relative h-[400px] bg-muted">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onCropComplete={onCropAreaChange}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4 pt-4">
            {/* Aspect Ratio */}
            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <Select
                value={
                  aspectRatio === undefined
                    ? 'free'
                    : Object.keys(ASPECT_RATIOS).find(
                        (key) => ASPECT_RATIOS[key as keyof typeof ASPECT_RATIOS].value === aspectRatio
                      ) || 'free'
                }
                onValueChange={(value) => {
                  const ratio = ASPECT_RATIOS[value as keyof typeof ASPECT_RATIOS].value
                  setAspectRatio(ratio)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select aspect ratio" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ASPECT_RATIOS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Zoom */}
            <div className="space-y-2">
              <Label>Zoom: {zoom.toFixed(1)}x</Label>
              <Slider
                value={[zoom]}
                onValueChange={(values) => setZoom(values[0])}
                min={1}
                max={3}
                step={0.1}
              />
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Rotation: {rotation}°</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleAutoStraighten}
                    disabled={autoStraightening}
                  >
                    {autoStraightening ? '⏳ Analyzing...' : '🪄 Auto-Straighten'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation((rotation - 90 + 360) % 360)}
                  >
                    ↶ 90°
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation((rotation + 90) % 360)}
                  >
                    ↷ 90°
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation(0)}
                  >
                    Reset
                  </Button>
                </div>
              </div>
              <Slider
                value={[rotation]}
                onValueChange={(values) => setRotation(values[0])}
                min={0}
                max={360}
                step={1}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={createCroppedImage} disabled={processing}>
            {processing ? 'Processing...' : 'Apply Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Helper function to create cropped image
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number = 0
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  const maxSize = Math.max(image.width, image.height)
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

  // Set canvas size
  canvas.width = safeArea
  canvas.height = safeArea

  // Translate and rotate
  ctx.translate(safeArea / 2, safeArea / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.translate(-safeArea / 2, -safeArea / 2)

  // Draw rotated image
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  )

  const data = ctx.getImageData(0, 0, safeArea, safeArea)

  // Set canvas to final size
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Paste cropped area
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  )

  // Return as blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to create blob'))
      }
    }, 'image/jpeg', 0.95)
  })
}

/**
 * Helper to create an Image object from a URL
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })
}

/**
 * Auto-detect the horizon angle in an image
 * Uses edge detection to find dominant horizontal/vertical lines
 * Returns the angle in degrees (positive = clockwise tilt)
 */
async function detectHorizonAngle(imageSrc: string): Promise<number | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) return null

  // Resize for faster processing (max 800px)
  const scale = Math.min(1, 800 / Math.max(image.width, image.height))
  canvas.width = image.width * scale
  canvas.height = image.height * scale

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // Convert to grayscale and apply edge detection
  const edges: number[] = []
  const width = canvas.width
  const height = canvas.height

  // Simple Sobel edge detection
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4

      // Get grayscale value
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3

      // Sobel kernels
      const gx =
        -1 * data[((y - 1) * width + (x - 1)) * 4] +
        1 * data[((y - 1) * width + (x + 1)) * 4] +
        -2 * data[(y * width + (x - 1)) * 4] +
        2 * data[(y * width + (x + 1)) * 4] +
        -1 * data[((y + 1) * width + (x - 1)) * 4] +
        1 * data[((y + 1) * width + (x + 1)) * 4]

      const gy =
        -1 * data[((y - 1) * width + (x - 1)) * 4] +
        -2 * data[((y - 1) * width + x) * 4] +
        -1 * data[((y - 1) * width + (x + 1)) * 4] +
        1 * data[((y + 1) * width + (x - 1)) * 4] +
        2 * data[((y + 1) * width + x) * 4] +
        1 * data[((y + 1) * width + (x + 1)) * 4]

      const magnitude = Math.sqrt(gx * gx + gy * gy)
      edges.push(magnitude)
    }
  }

  // Find strong edges and their angles using simplified Hough transform
  const angleVotes: { [key: number]: number } = {}
  const threshold = 50 // Edge strength threshold

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y - 1) * (width - 2) + (x - 1)
      if (edges[idx] > threshold) {
        const idxImg = (y * width + x) * 4

        // Calculate gradient angle
        const gx =
          -1 * data[((y - 1) * width + (x - 1)) * 4] +
          1 * data[((y - 1) * width + (x + 1)) * 4] +
          -2 * data[(y * width + (x - 1)) * 4] +
          2 * data[(y * width + (x + 1)) * 4] +
          -1 * data[((y + 1) * width + (x - 1)) * 4] +
          1 * data[((y + 1) * width + (x + 1)) * 4]

        const gy =
          -1 * data[((y - 1) * width + (x - 1)) * 4] +
          -2 * data[((y - 1) * width + x) * 4] +
          -1 * data[((y - 1) * width + (x + 1)) * 4] +
          1 * data[((y + 1) * width + (x - 1)) * 4] +
          2 * data[((y + 1) * width + x) * 4] +
          1 * data[((y + 1) * width + (x + 1)) * 4]

        const angle = (Math.atan2(gy, gx) * 180) / Math.PI

        // Quantize to 1-degree bins
        const bin = Math.round(angle)
        angleVotes[bin] = (angleVotes[bin] || 0) + edges[idx]
      }
    }
  }

  // Find the dominant angle (most votes)
  // Focus on angles close to horizontal (0°, 180°) or vertical (90°, -90°)
  let maxVotes = 0
  let dominantAngle = 0

  // Check for horizontal lines (±15° from 0 or 180)
  for (let angle = -15; angle <= 15; angle++) {
    const votes = (angleVotes[angle] || 0) + (angleVotes[angle + 180] || 0)
    if (votes > maxVotes) {
      maxVotes = votes
      dominantAngle = angle
    }
  }

  // Check for horizontal lines around 180
  for (let angle = 165; angle <= 195; angle++) {
    const normalizedAngle = angle > 180 ? angle - 180 : angle
    const votes = angleVotes[angle] || 0
    if (votes > maxVotes) {
      maxVotes = votes
      dominantAngle = normalizedAngle
    }
  }

  // Must have significant edge strength to be confident
  if (maxVotes < 1000) {
    return null
  }

  return dominantAngle
}
