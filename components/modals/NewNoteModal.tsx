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
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGeolocation } from '@/hooks/useGeolocation'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { Badge } from '@/components/ui/badge'

interface NewNoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function NewNoteModal({ isOpen, onClose, onSuccess }: NewNoteModalProps) {
  const { data: session } = useSession()
  const { location, loading: geoLoading, getCurrentLocation } = useGeolocation()

  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [language, setLanguage] = useState('en')
  const [manualLocation, setManualLocation] = useState('')
  const [datetime, setDatetime] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [savedTags, setSavedTags] = useState<string[]>([])

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const settingsResponse = await fetch('/api/settings')
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json()
          setSavedTags(settings.noteTags || [])
        }
      } catch (error) {
        console.error('Failed to fetch saved tags:', error)
      }
    }

    if (session && isOpen) {
      fetchTags()
    }
  }, [session, isOpen])

  const resetForm = () => {
    setContent('')
    setTags('')
    setLanguage('en')
    setManualLocation('')
    setDatetime(new Date())
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handlePublish = async () => {
    if (!content.trim()) {
      alert('Please enter some content')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/publish/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          language,
          location: location || manualLocation || undefined,
          datetime: datetime
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to publish note')
      }

      alert('Note published successfully!')
      resetForm()
      onSuccess?.()
      onClose()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Note</DialogTitle>
          <DialogDescription>
            Write a quick note with tags and optional location
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <Input
              id="tags"
              placeholder="tag1, tag2, tag3"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Comma-separated tags</p>

            {savedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">Quick add:</span>
                {savedTags.map((tag) => {
                  const currentTags = tags.split(',').map(t => t.trim()).filter(Boolean)
                  const isSelected = currentTags.includes(tag)

                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (isSelected) {
                          const newTags = currentTags.filter(t => t !== tag)
                          setTags(newTags.join(', '))
                        } else {
                          const newTags = [...currentTags, tag]
                          setTags(newTags.join(', '))
                        }
                      }}
                    >
                      {tag}
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                placeholder="en"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Date & Time</Label>
              <DateTimePicker date={datetime} setDate={setDatetime} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={geoLoading}
                size="sm"
              >
                {geoLoading ? 'Getting location...' : 'Use Current Location'}
              </Button>
              {location && (
                <span className="text-sm text-muted-foreground flex items-center">
                  📍 {location}
                </span>
              )}
            </div>
            <Input
              placeholder="Or enter location manually"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              onClick={handlePublish}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Publishing...' : 'Publish Note'}
            </Button>
            <Button
              onClick={handleClose}
              disabled={loading}
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
