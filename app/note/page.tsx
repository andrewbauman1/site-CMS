'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGeolocation } from '@/hooks/useGeolocation'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { Badge } from '@/components/ui/badge'

export default function NotePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { location, loading: geoLoading, getCurrentLocation } = useGeolocation()

  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [language, setLanguage] = useState('en')
  const [manualLocation, setManualLocation] = useState('')
  const [datetime, setDatetime] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null)
  const [savedTags, setSavedTags] = useState<string[]>([])

  useEffect(() => {
    // Fetch saved tags from settings
    const fetchTags = async () => {
      try {
        const settingsResponse = await fetch('/api/settings')
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json()
          console.log('Settings response:', settings)
          console.log('Note tags:', settings.noteTags)
          setSavedTags(settings.noteTags || [])
        }
      } catch (error) {
        console.error('Failed to fetch saved tags:', error)
      }
    }

    if (session) {
      fetchTags()
    }
  }, [session])

  useEffect(() => {
    // Check if we're editing a draft
    const draftData = localStorage.getItem('editDraft')
    if (draftData) {
      try {
        const draft = JSON.parse(draftData)
        if (draft.type === 'NOTE') {
          setContent(draft.content || '')
          setTags(draft.tags || '')
          setLanguage(draft.language || 'en')
          setManualLocation(draft.location || '')
          setEditingDraftId(draft.id)
        }
      } catch (error) {
        console.error('Failed to load draft:', error)
      }
      // Clear the localStorage after loading
      localStorage.removeItem('editDraft')
    }
  }, [])

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
      router.push('/')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    setLoading(true)
    try {
      const url = editingDraftId ? `/api/drafts/${editingDraftId}` : '/api/drafts'
      const method = editingDraftId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NOTE',
          content,
          tags,
          language,
          location: location || manualLocation || undefined
        })
      })

      if (!response.ok) throw new Error('Failed to save draft')

      alert('Draft saved!')
      router.push('/drafts')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return <div>Please sign in</div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Note</CardTitle>
          <CardDescription>
            Write a quick note with tags and optional location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

            {/* Quick add chips */}
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
                          // Remove tag
                          const newTags = currentTags.filter(t => t !== tag)
                          setTags(newTags.join(', '))
                        } else {
                          // Add tag
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

          <div className="flex gap-4">
            <Button
              onClick={handlePublish}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Publishing...' : 'Publish Note'}
            </Button>
            <Button
              onClick={handleSaveDraft}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              Save as Draft
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
