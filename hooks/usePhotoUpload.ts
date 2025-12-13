import { useState } from 'react'
import { getImageDimensions } from '@/lib/image-utils'
import { PhotoDraft, UploadProgress } from '@/types/models'

const BATCH_SIZE = 3  // Upload 3 photos at a time for optimal performance

/**
 * Custom hook for managing bulk photo uploads with batching and progress tracking
 */
export function usePhotoUpload() {
  const [drafts, setDrafts] = useState<PhotoDraft[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)

  /**
   * Handle multiple file selection
   * Validates files and calculates dimensions for each
   */
  const handleFilesSelect = async (files: FileList) => {
    console.log('handleFilesSelect called with', files.length, 'files')
    const validFiles: File[] = []

    // Validate files
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`)
      // Only accept image files
      if (!file.type.startsWith('image/')) {
        console.warn(`Skipping non-image file: ${file.name}`)
        continue
      }
      // 25MB file size limit
      if (file.size > 25 * 1024 * 1024) {
        console.warn(`Skipping file over 25MB: ${file.name}`)
        continue
      }
      validFiles.push(file)
    }

    console.log(`${validFiles.length} valid files to process`)

    // Process each valid file with error handling
    const newDraftsPromises = validFiles.map(async (file): Promise<PhotoDraft | null> => {
      try {
        const preview = URL.createObjectURL(file)
        const dimensionsData = await getImageDimensions(file)

        return {
          file,
          preview,
          caption: '',
          alt: '',
          albums: [],
          location: '',
          featured: false,
          datetime: new Date(), // Default to current time
          ratio: dimensionsData.ratio,
          orientation: dimensionsData.orientation as 'landscape' | 'portrait' | 'square',
          dimensions: {
            width: dimensionsData.width,
            height: dimensionsData.height
          },
          uploadStatus: 'pending' as const,
        }
      } catch (error) {
        console.error(`Failed to process file ${file.name}:`, error)
        return null
      }
    })

    const results = await Promise.all(newDraftsPromises)
    const newDrafts = results.filter((draft): draft is PhotoDraft => draft !== null)

    if (newDrafts.length === 0) {
      alert('Failed to process any of the selected files. Please try again.')
      return
    }

    setDrafts([...drafts, ...newDrafts])
  }

  /**
   * Update metadata for a specific draft
   */
  const updateDraft = (index: number, updates: Partial<PhotoDraft>) => {
    setDrafts(drafts.map((d, i) => i === index ? { ...d, ...updates } : d))
  }

  /**
   * Remove a draft from the batch
   */
  const removeDraft = (index: number) => {
    // Clean up object URL to prevent memory leaks
    URL.revokeObjectURL(drafts[index].preview)
    setDrafts(drafts.filter((_, i) => i !== index))
  }

  /**
   * Upload all photos in batches of 3
   * Individual failures don't stop the entire batch
   */
  const uploadPhotos = async () => {
    setUploading(true)
    setProgress({ total: drafts.length, completed: 0, failed: 0, currentBatch: 0 })

    // Process in batches of BATCH_SIZE
    for (let i = 0; i < drafts.length; i += BATCH_SIZE) {
      const batch = drafts.slice(i, i + BATCH_SIZE)
      setProgress(prev => ({ ...prev!, currentBatch: Math.floor(i / BATCH_SIZE) + 1 }))

      // Upload batch concurrently using Promise.allSettled
      // This allows individual failures without stopping the batch
      const results = await Promise.allSettled(
        batch.map(draft => uploadSinglePhoto(draft))
      )

      // Update status for each photo in the batch
      results.forEach((result, idx) => {
        const absoluteIndex = i + idx
        if (result.status === 'rejected') {
          updateDraft(absoluteIndex, {
            uploadStatus: 'error',
            error: result.reason?.message || 'Upload failed'
          })
          setProgress(prev => ({ ...prev!, failed: prev!.failed + 1 }))
        } else {
          updateDraft(absoluteIndex, { uploadStatus: 'success' })
          setProgress(prev => ({ ...prev!, completed: prev!.completed + 1 }))
        }
      })
    }

    setUploading(false)
  }

  /**
   * Upload a single photo to the API
   */
  const uploadSinglePhoto = async (draft: PhotoDraft) => {
    const formData = new FormData()
    formData.append('file', draft.file)
    formData.append('caption', draft.caption)
    formData.append('alt', draft.alt)
    formData.append('albums', JSON.stringify(draft.albums))
    formData.append('location', draft.location)
    formData.append('featured', draft.featured.toString())
    formData.append('datetime', draft.datetime.toISOString())
    formData.append('ratio', draft.ratio.toString())
    formData.append('orientation', draft.orientation)

    const response = await fetch('/api/publish/photo', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }

    return response.json()
  }

  return {
    drafts,
    uploading,
    progress,
    handleFilesSelect,
    updateDraft,
    removeDraft,
    uploadPhotos
  }
}
