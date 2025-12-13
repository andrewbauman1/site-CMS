'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { Badge } from '@/components/ui/badge'
import { Maximize2, Minimize2 } from 'lucide-react'

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
)

export default function PostPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [layout, setLayout] = useState('default')
  const [featured, setFeatured] = useState(false)
  const [postDate, setPostDate] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    // Check if we're editing a draft
    const draftData = localStorage.getItem('editDraft')
    if (draftData) {
      try {
        const draft = JSON.parse(draftData)
        if (draft.type === 'POST') {
          setTitle(draft.title || '')
          setContent(draft.content || '')
          setTags(draft.tags || '')
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
    if (!title.trim() || !content.trim()) {
      alert('Please enter title and content')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/publish/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          date: postDate,
          layout,
          feature: featured ? 1 : undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to publish post')
      }

      alert('Post published successfully!')
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
          type: 'POST',
          title,
          content,
          tags
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

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
        <div className="container mx-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Create Post</h2>
              <p className="text-sm text-muted-foreground">
                Write a full blog post with markdown formatting
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(false)}
              className="shrink-0"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter your post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Post Date & Time</Label>
              <DateTimePicker date={postDate} setDate={setPostDate} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="layout">Layout</Label>
                <Input
                  id="layout"
                  placeholder="default"
                  value={layout}
                  onChange={(e) => setLayout(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="featured"
                  checked={featured}
                  onCheckedChange={(checked) => setFeatured(checked as boolean)}
                />
                <Label
                  htmlFor="featured"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Featured Post
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Content * (Markdown)</Label>
              <div data-color-mode="light">
                <MDEditor
                  value={content}
                  onChange={(val) => setContent(val || '')}
                  height={700}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                placeholder="tag1, tag2, tag3"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Comma-separated tags (Note: tags won't appear on published posts in the current Jekyll theme)</p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handlePublish}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Publishing...' : 'Publish Post'}
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
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create Post</CardTitle>
              <CardDescription>
                Write a full blog post with markdown formatting
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(true)}
              className="shrink-0"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter your post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Post Date & Time</Label>
            <DateTimePicker date={postDate} setDate={setPostDate} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="layout">Layout</Label>
              <Input
                id="layout"
                placeholder="default"
                value={layout}
                onChange={(e) => setLayout(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="featured"
                checked={featured}
                onCheckedChange={(checked) => setFeatured(checked as boolean)}
              />
              <Label
                htmlFor="featured"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Featured Post
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Content * (Markdown)</Label>
            <div data-color-mode="light">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || '')}
                height={isFullscreen ? 700 : 400}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <Input
              id="tags"
              placeholder="tag1, tag2, tag3"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Comma-separated tags (Note: tags won't appear on published posts in the current Jekyll theme)</p>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handlePublish}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Publishing...' : 'Publish Post'}
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
