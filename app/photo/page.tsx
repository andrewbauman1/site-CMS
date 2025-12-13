'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { X } from 'lucide-react'
import { usePhotoUpload } from '@/hooks/usePhotoUpload'
import { AlbumSelector } from '@/components/album-selector'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { ImageCropModal } from '@/components/image-crop-modal'
import { getImageDimensions } from '@/lib/image-utils'

export default function PhotoUploadPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const {
    drafts,
    uploading,
    progress,
    handleFilesSelect,
    updateDraft,
    removeDraft,
    uploadPhotos
  } = usePhotoUpload()

  const [availableAlbums, setAvailableAlbums] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null)

  useEffect(() => {
    // Fetch existing albums from photos.json
    const fetchAlbums = async () => {
      try {
        const response = await fetch('/api/github/photos')
        if (response.ok) {
          const data = await response.json()
          const albumSet = new Set<string>()
          data.photos.forEach((photo: any) => {
            photo.meta.albums?.forEach((album: string) => albumSet.add(album))
          })
          setAvailableAlbums(Array.from(albumSet).sort())
        }
      } catch (error) {
        console.error('Failed to fetch albums:', error)
      }
    }

    if (session) {
      fetchAlbums()
    }
  }, [session])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesSelect(e.target.files)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFilesSelect(files)
    }
  }

  const handleCropComplete = async (croppedBlob: Blob, index: number) => {
    // Create a new File from the cropped Blob
    const originalFile = drafts[index].file
    const croppedFile = new File([croppedBlob], originalFile.name, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })

    // Create new preview URL
    const newPreview = URL.createObjectURL(croppedBlob)

    // Recalculate dimensions
    const dimensions = await getImageDimensions(croppedFile)

    // Clean up old preview URL
    URL.revokeObjectURL(drafts[index].preview)

    // Update the draft with new file and preview
    updateDraft(index, {
      file: croppedFile,
      preview: newPreview,
      ratio: dimensions.ratio,
      orientation: dimensions.orientation as 'landscape' | 'portrait' | 'square',
      dimensions: {
        width: dimensions.width,
        height: dimensions.height
      }
    })

    setEditingImageIndex(null)
  }

  const handleUpload = async () => {
    // Validate all drafts have required fields
    const missingAlt = drafts.filter(d => !d.alt.trim())
    if (missingAlt.length > 0) {
      alert('All photos must have alt text for accessibility')
      return
    }

    const noAlbums = drafts.filter(d => d.albums.length === 0)
    if (noAlbums.length > 0) {
      alert('All photos must belong to at least one album')
      return
    }

    await uploadPhotos()

    // Show results and optionally navigate
    if (progress && progress.failed === 0) {
      alert('All photos uploaded successfully!')
      router.push('/photos')
    } else if (progress) {
      alert(`Upload complete: ${progress.completed} succeeded, ${progress.failed} failed`)
    }
  }

  if (!session) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Please sign in to upload photos</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Photos</CardTitle>
          <CardDescription>
            Select multiple images and add metadata for each
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drag & Drop File input */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isDragging ? 'Drop images here' : 'Drag and drop images here'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse
                </p>
              </div>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={uploading}
              >
                Select Images
              </Button>
              <p className="text-xs text-muted-foreground">
                Max 25MB per image. Supported: JPEG, PNG, GIF, WebP
              </p>
            </div>
          </div>

          {/* Photo grid with metadata forms */}
          {drafts.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drafts.map((draft, index) => (
                  <Card key={index} className="relative">
                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
                      onClick={() => removeDraft(index)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    <CardContent className="pt-6 space-y-3">
                      {/* Image preview with edit button */}
                      <div className="relative">
                        <img
                          src={draft.preview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="absolute bottom-2 right-2"
                          onClick={() => setEditingImageIndex(index)}
                          disabled={uploading}
                        >
                          ✂️ Edit
                        </Button>
                      </div>

                      {/* Caption */}
                      <div>
                        <Label htmlFor={`caption-${index}`} className="text-sm">
                          Caption
                        </Label>
                        <Textarea
                          id={`caption-${index}`}
                          value={draft.caption}
                          onChange={(e) => updateDraft(index, { caption: e.target.value })}
                          rows={2}
                          disabled={uploading}
                          placeholder="Optional description..."
                          maxLength={500}
                        />
                      </div>

                      {/* Alt text (required) */}
                      <div>
                        <Label htmlFor={`alt-${index}`} className="text-sm">
                          Alt Text <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`alt-${index}`}
                          value={draft.alt}
                          onChange={(e) => updateDraft(index, { alt: e.target.value })}
                          placeholder="Describe the image for accessibility"
                          disabled={uploading}
                          required
                          maxLength={200}
                        />
                      </div>

                      {/* Albums (required) */}
                      <div>
                        <Label className="text-sm">
                          Albums <span className="text-destructive">*</span>
                        </Label>
                        <AlbumSelector
                          availableAlbums={availableAlbums}
                          selectedAlbums={draft.albums}
                          onAlbumsChanged={(albums) => updateDraft(index, { albums })}
                        />
                      </div>

                      {/* Location */}
                      <div>
                        <Label htmlFor={`location-${index}`} className="text-sm">
                          Location
                        </Label>
                        <Input
                          id={`location-${index}`}
                          value={draft.location}
                          onChange={(e) => updateDraft(index, { location: e.target.value })}
                          placeholder="Optional location..."
                          disabled={uploading}
                        />
                      </div>

                      {/* Date & Time */}
                      <div>
                        <Label htmlFor={`datetime-${index}`} className="text-sm">
                          Date & Time
                        </Label>
                        <DateTimePicker
                          date={draft.datetime}
                          setDate={(date) => updateDraft(index, { datetime: date || new Date() })}
                        />
                      </div>

                      {/* Featured checkbox */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`featured-${index}`}
                          checked={draft.featured}
                          onCheckedChange={(checked) =>
                            updateDraft(index, { featured: checked as boolean })
                          }
                          disabled={uploading}
                        />
                        <Label
                          htmlFor={`featured-${index}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          Featured photo
                        </Label>
                      </div>

                      {/* Image dimensions info */}
                      <p className="text-xs text-muted-foreground">
                        {draft.dimensions.width} × {draft.dimensions.height} •{' '}
                        {draft.orientation} • ratio: {draft.ratio.toFixed(2)}
                      </p>

                      {/* Upload status indicators */}
                      {draft.uploadStatus === 'error' && (
                        <p className="text-xs text-destructive">
                          ✗ {draft.error}
                        </p>
                      )}
                      {draft.uploadStatus === 'success' && (
                        <p className="text-xs text-green-600">
                          ✓ Uploaded successfully
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Upload progress */}
              {uploading && progress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      Uploading photos (batch {progress.currentBatch})...
                    </span>
                    <span>
                      {progress.completed + progress.failed}/{progress.total}
                    </span>
                  </div>
                  <Progress
                    value={((progress.completed + progress.failed) / progress.total) * 100}
                  />
                  {progress.failed > 0 && (
                    <p className="text-sm text-destructive">
                      {progress.failed} photo{progress.failed > 1 ? 's' : ''} failed
                    </p>
                  )}
                </div>
              )}

              {/* Upload button */}
              <Button
                onClick={handleUpload}
                disabled={uploading || drafts.length === 0}
                className="w-full"
                size="lg"
              >
                {uploading
                  ? 'Uploading...'
                  : `Upload ${drafts.length} Photo${drafts.length > 1 ? 's' : ''}`}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Image Crop Modal */}
      {editingImageIndex !== null && (
        <ImageCropModal
          isOpen={editingImageIndex !== null}
          onClose={() => setEditingImageIndex(null)}
          imageSrc={drafts[editingImageIndex].preview}
          onCropComplete={(croppedBlob) => handleCropComplete(croppedBlob, editingImageIndex)}
        />
      )}
    </div>
  )
}
