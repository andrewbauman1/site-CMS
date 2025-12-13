'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Maximize2, Minimize2 } from 'lucide-react'

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
)

interface Post {
  path: string
  name: string
  sha: string
  content: string
  fullContent: string
  title?: string
  date?: string
  layout?: string
  feature?: string
  tags?: string
}

export default function PostsPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editLayout, setEditLayout] = useState('default')
  const [editFeatured, setEditFeatured] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Sort state
  const [sortOrder, setSortOrder] = useState<string>('newest')

  useEffect(() => {
    if (session) {
      fetchPosts()
    }
  }, [session])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/github/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (post: Post) => {
    setEditingPost(post)
    setEditTitle(post.title || '')
    setEditContent(post.content || '')
    setEditLayout(post.layout || 'default')
    setEditFeatured(post.feature === '1')
  }

  const handleSave = async () => {
    if (!editingPost) return

    setSaving(true)
    try {
      // Rebuild the file content with updated values
      const updatedContent = `---
title: ${editTitle}
date: ${editingPost.date || new Date().toISOString().split('T')[0]}
layout: ${editLayout}
${editFeatured ? 'feature: 1' : ''}
---

${editContent}`

      const response = await fetch('/api/github/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: editingPost.path,
          sha: editingPost.sha,
          content: updatedContent
        })
      })

      if (response.ok) {
        alert('Post updated successfully!')
        setEditingPost(null)
        fetchPosts()
      } else {
        throw new Error('Failed to update post')
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (post: Post) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return
    }

    try {
      const response = await fetch('/api/github/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: post.path,
          sha: post.sha
        })
      })

      if (response.ok) {
        alert('Post deleted successfully!')
        fetchPosts()
      } else {
        throw new Error('Failed to delete post')
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  // Sort posts
  const sortedPosts = useMemo(() => {
    let sorted = [...posts]

    // Sort by date
    sorted.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return sorted
  }, [posts, sortOrder])

  if (!session) {
    return <div>Please sign in</div>
  }

  if (loading) {
    return <div>Loading posts...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Published Posts</h1>
        <p className="text-muted-foreground">
          View, edit, and manage your published posts
        </p>
      </div>

      {/* Sort */}
      <div className="mb-6 flex justify-end">
        <div className="w-full md:w-64">
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

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No posts published yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedPosts.map((post) => (
            <Card key={post.path}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{post.title || post.name}</CardTitle>
                      {post.feature === '1' && (
                        <Badge variant="secondary">Featured</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {post.date && new Date(post.date).toLocaleDateString()}
                      {post.layout && ` • Layout: ${post.layout}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(post)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(post)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-3">
                  {post.content?.substring(0, 200)}...
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editingPost && isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <div className="container mx-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Edit Post</h2>
                <p className="text-sm text-muted-foreground">
                  Update the title and content for this post
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
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-layout">Layout</Label>
                  <Input
                    id="edit-layout"
                    value={editLayout}
                    onChange={(e) => setEditLayout(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox
                    id="edit-featured"
                    checked={editFeatured}
                    onCheckedChange={(checked) => setEditFeatured(checked as boolean)}
                  />
                  <Label
                    htmlFor="edit-featured"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Featured Post
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Content (Markdown)</Label>
                <div data-color-mode="light">
                  <MDEditor
                    value={editContent}
                    onChange={(val) => setEditContent(val || '')}
                    height={700}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setEditingPost(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingPost && !isFullscreen && (
        <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>Edit Post</DialogTitle>
                  <DialogDescription>
                    Update the title and content for this post
                  </DialogDescription>
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
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-layout">Layout</Label>
                  <Input
                    id="edit-layout"
                    value={editLayout}
                    onChange={(e) => setEditLayout(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox
                    id="edit-featured"
                    checked={editFeatured}
                    onCheckedChange={(checked) => setEditFeatured(checked as boolean)}
                  />
                  <Label
                    htmlFor="edit-featured"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Featured Post
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Content (Markdown)</Label>
                <div data-color-mode="light">
                  <MDEditor
                    value={editContent}
                    onChange={(val) => setEditContent(val || '')}
                    height={400}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPost(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
