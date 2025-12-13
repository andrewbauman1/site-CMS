'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

interface Story {
  id: string
  uploaded: string
  filename: string
  meta?: {
    caption?: string
    alt?: string
    tags?: string[]
    url?: string
    title?: string
  }
  requireSignedURLs?: boolean
  variants?: string[]
  playback?: {
    hls?: string
  }
  thumbnail?: string
}

export default function StoriesPage() {
  const { data: session } = useSession()
  const [stories, setStories] = useState<Story[]>([])
  const [sha, setSha] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingStory, setEditingStory] = useState<Story | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [editAlt, setEditAlt] = useState('')
  const [editTags, setEditTags] = useState('')
  const [saving, setSaving] = useState(false)

  // Filter and sort states
  const [filterTag, setFilterTag] = useState<string>('all')
  const [filterMediaType, setFilterMediaType] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<string>('newest')

  useEffect(() => {
    if (session) {
      fetchStories()
    }
  }, [session])

  const fetchStories = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/github/stories')
      if (response.ok) {
        const data = await response.json()
        const storiesData = data.stories || []
        setStories(storiesData)
        setSha(data.sha)
      }
    } catch (error) {
      console.error('Failed to fetch stories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (story: Story) => {
    setEditingStory(story)
    setEditCaption(story.meta?.caption || '')
    setEditAlt(story.meta?.alt || '')
    setEditTags(story.meta?.tags?.join(', ') || '')
  }

  const handleSave = async () => {
    if (!editingStory) return

    setSaving(true)
    try {
      // Update the story in the array
      const updatedStories = stories.map(s => {
        if (s.id === editingStory.id) {
          return {
            ...s,
            meta: {
              ...s.meta,
              caption: editCaption || undefined,
              alt: editAlt || undefined,
              tags: editTags ? editTags.split(',').map(t => t.trim()) : []
            }
          }
        }
        return s
      })

      const response = await fetch('/api/github/stories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stories: updatedStories,
          sha: sha
        })
      })

      if (response.ok) {
        alert('Story updated successfully!')
        setEditingStory(null)
        fetchStories()
      } else {
        throw new Error('Failed to update story')
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (story: Story) => {
    if (!confirm('Are you sure you want to delete this story?')) {
      return
    }

    try {
      // Remove the story from the array
      const updatedStories = stories.filter(s => s.id !== story.id)

      const response = await fetch('/api/github/stories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stories: updatedStories,
          sha: sha
        })
      })

      if (response.ok) {
        alert('Story deleted successfully!')
        fetchStories()
      } else {
        throw new Error('Failed to delete story')
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const getStoryUrl = (story: Story) => {
    if (story.playback?.hls) {
      return story.playback.hls
    }
    if (story.variants && story.variants.length > 0) {
      return story.variants[0]
    }
    return `https://imagedelivery.net/LQ_Z8HgbrQpAu3k88KR0Rg/${story.id}/public`
  }

  const isVideo = (story: Story) => {
    return !!story.playback?.hls || !!story.meta?.url
  }

  // Get unique tags from all stories
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    stories.forEach(story => {
      story.meta?.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [stories])


  // Filter and sort stories
  const filteredAndSortedStories = useMemo(() => {
    let filtered = [...stories]

    // Filter by tag
    if (filterTag !== 'all') {
      filtered = filtered.filter(story =>
        story.meta?.tags?.includes(filterTag)
      )
    }

    // Filter by media type
    if (filterMediaType === 'images') {
      filtered = filtered.filter(story => !isVideo(story))
    } else if (filterMediaType === 'videos') {
      filtered = filtered.filter(story => isVideo(story))
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.uploaded).getTime()
      const dateB = new Date(b.uploaded).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return filtered
  }, [stories, filterTag, filterMediaType, sortOrder])

  if (!session) {
    return <div>Please sign in</div>
  }

  if (loading) {
    return <div>Loading stories...</div>
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Published Stories</h1>
        <p className="text-muted-foreground">
          View, edit, and manage your published stories
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Select value={filterTag} onValueChange={setFilterTag}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Select value={filterMediaType} onValueChange={setFilterMediaType}>
            <SelectTrigger>
              <SelectValue placeholder="Media type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Media</SelectItem>
              <SelectItem value="images">Images Only</SelectItem>
              <SelectItem value="videos">Videos Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredAndSortedStories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {stories.length === 0 ? 'No stories published yet' : 'No stories match the selected filters'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedStories.map((story) => (
            <Card key={story.id}>
              <CardHeader className="p-0">
                {isVideo(story) ? (
                  <video
                    src={getStoryUrl(story)}
                    controls
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                ) : (
                  <img
                    src={getStoryUrl(story)}
                    alt={story.meta?.alt || story.filename}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <CardTitle className="text-sm">{story.filename}</CardTitle>
                  {story.meta?.caption && (
                    <p className="text-xs text-muted-foreground">
                      {story.meta.caption}
                    </p>
                  )}
                  {story.meta?.tags && story.meta.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {story.meta.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <CardDescription className="text-xs">
                    {new Date(story.uploaded).toLocaleDateString()}
                  </CardDescription>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(story)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(story)}
                      className="flex-1"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingStory} onOpenChange={() => setEditingStory(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Story</DialogTitle>
            <DialogDescription>
              Update the caption, alt text, and tags for this story
            </DialogDescription>
          </DialogHeader>

          {editingStory && (
            <div className="space-y-4 py-4">
              {isVideo(editingStory) ? (
                <video
                  src={getStoryUrl(editingStory)}
                  controls
                  className="w-full max-h-64 rounded-lg"
                />
              ) : (
                <img
                  src={getStoryUrl(editingStory)}
                  alt={editingStory.meta?.alt || editingStory.filename}
                  className="w-full max-h-64 object-contain rounded-lg"
                />
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-caption">Caption</Label>
                <Textarea
                  id="edit-caption"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-alt">Alt Text</Label>
                <Input
                  id="edit-alt"
                  value={editAlt}
                  onChange={(e) => setEditAlt(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                <Input
                  id="edit-tags"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStory(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
