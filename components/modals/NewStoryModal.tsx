'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { TagSelector } from '@/components/tag-selector'

interface NewStoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function NewStoryModal({ isOpen, onClose, onSuccess }: NewStoryModalProps) {
  const { data: session } = useSession()
  const { file, preview, uploading, handleFileSelect, uploadFile } = useMediaUpload()

  const [caption, setCaption] = useState('')
  const [altText, setAltText] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [storyDate, setStoryDate] = useState(new Date())
  const [availableTags, setAvailableTags] = useState<string[]>([])

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const storiesResponse = await fetch('/api/github/stories')
        if (storiesResponse.ok) {
          const data = await storiesResponse.json()
          const stories = data.stories || []

          const tagSet = new Set<string>()
          stories.forEach((story: any) => {
            if (story.meta?.tags) {
              story.meta.tags.forEach((tag: string) => tagSet.add(tag))
            }
          })

          setAvailableTags(Array.from(tagSet).sort())
        }
      } catch (error) {
        console.error('Failed to fetch story tags:', error)
      }
    }

    if (session && isOpen) {
      fetchTags()
    }
  }, [session, isOpen])

  const resetForm = () => {
    setCaption('')
    setAltText('')
    setTags([])
    setStoryDate(new Date())
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file')
      return
    }

    try {
      await uploadFile({
        caption,
        altText,
        tags,
        datetime: storyDate
      })

      alert('Story uploaded successfully!')
      resetForm()
      onSuccess?.()
      onClose()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Story</DialogTitle>
          <DialogDescription>
            Share an image or video to your stories
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Media File *</Label>
            <Input
              id="file"
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
            />
            {preview && (
              <div className="mt-4 border rounded-lg overflow-hidden">
                {file?.type.startsWith('video/') ? (
                  <video src={preview} controls className="w-full max-h-96" />
                ) : (
                  <img src={preview} alt="Preview" className="w-full max-h-96 object-contain" />
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alt">Alt Text</Label>
            <Input
              id="alt"
              placeholder="Describe the image for accessibility"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Categories</Label>
            <TagSelector
              availableTags={availableTags}
              selectedTags={tags}
              onTagsChanged={setTags}
            />
            {availableTags.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Tags will appear here after you publish your first story with tags
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Date & Time</Label>
            <DateTimePicker date={storyDate} setDate={setStoryDate} />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="flex-1"
            >
              {uploading ? 'Uploading...' : 'Upload Story'}
            </Button>
            <Button
              onClick={handleClose}
              disabled={uploading}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
