'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { Badge } from '@/components/ui/badge'
import { useNoteForm } from '@/hooks/useNoteForm'

export default function NotePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const form = useNoteForm()
  const {
    content, setContent,
    tags, setTags,
    language, setLanguage,
    manualLocation, setManualLocation,
    datetime, setDatetime,
    loading,
    savedTags,
    location,
    geoLoading,
    getCurrentLocation,
  } = form

  const [editingDraftId, setEditingDraftId] = useState<string | null>(null)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePublish = async () => {
    try {
      await form.publish()
      alert('Note published successfully!')
      router.push('/')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleSaveDraft = async () => {
    try {
      await form.saveDraft(editingDraftId)
      alert('Draft saved!')
      router.push('/drafts')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
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
