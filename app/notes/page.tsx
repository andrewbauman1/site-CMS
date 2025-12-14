'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'

interface Note {
  path: string
  name: string
  sha: string
  content: string
  tags?: string
  lang?: string
  location?: string
  date?: string
}

export default function NotesPage() {
  const { data: session } = useSession()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [saving, setSaving] = useState(false)

  // Filter and sort states
  const [filterTag, setFilterTag] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<string>('newest')

  useEffect(() => {
    if (session) {
      fetchNotes()
    }
  }, [session])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/github/notes')
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (note: Note) => {
    setEditingNote(note)

    // Extract content from the note
    const contentMatch = note.content.match(/---\n[\s\S]*?\n---\n([\s\S]*)/)
    const noteContent = contentMatch ? contentMatch[1].trim() : note.content

    setEditContent(noteContent)
    setEditTags(note.tags || '')
    setEditLocation(note.location || '')
  }

  const handleSave = async () => {
    if (!editingNote) return

    setSaving(true)
    try {
      // Parse existing frontmatter and update only what changed
      const frontmatterMatch = editingNote.content.match(/^---\n([\s\S]*?)\n---/)
      let updatedFrontmatter = ''

      if (frontmatterMatch) {
        const lines = frontmatterMatch[1].split('\n')
        const updatedLines: string[] = []
        let inTagsArray = false

        for (const line of lines) {
          if (line.startsWith('tags:')) {
            // Replace tags section
            if (editTags) {
              updatedLines.push('tags:')
              editTags.split(',').forEach(tag => {
                updatedLines.push(`  - ${tag.trim()}`)
              })
            }
            inTagsArray = true
          } else if (line.trim().startsWith('- ') && inTagsArray) {
            // Skip old tag array items
            continue
          } else if (line.startsWith('location:')) {
            updatedLines.push(`location: ${editLocation}`)
            inTagsArray = false
          } else {
            updatedLines.push(line)
            inTagsArray = false
          }
        }

        updatedFrontmatter = updatedLines.join('\n')
      }

      const updatedContent = `---
${updatedFrontmatter}
---

${editContent}`

      const response = await fetch('/api/github/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: editingNote.path,
          sha: editingNote.sha,
          content: updatedContent
        })
      })

      if (response.ok) {
        alert('Note updated successfully!')
        setEditingNote(null)
        fetchNotes()
      } else {
        throw new Error('Failed to update note')
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (note: Note) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return
    }

    try {
      const response = await fetch('/api/github/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: note.path,
          sha: note.sha
        })
      })

      if (response.ok) {
        alert('Note deleted successfully!')
        fetchNotes()
      } else {
        throw new Error('Failed to delete note')
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  // Get unique tags from all notes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    notes.forEach(note => {
      if (note.tags) {
        note.tags.split(',').forEach(tag => tagSet.add(tag.trim()))
      }
    })
    return Array.from(tagSet).sort()
  }, [notes])

  // Filter and sort notes
  const filteredAndSortedNotes = useMemo(() => {
    let filtered = [...notes]

    // Filter by tag
    if (filterTag !== 'all') {
      filtered = filtered.filter(note => {
        if (!note.tags) return false
        const noteTags = note.tags.split(',').map(t => t.trim())
        return noteTags.includes(filterTag)
      })
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return filtered
  }, [notes, filterTag, sortOrder])

  if (!session) {
    return <div>Please sign in</div>
  }

  if (loading) {
    return <div>Loading notes...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Published Notes</h1>
        <p className="text-muted-foreground">
          View, edit, and manage your published notes
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 justify-end">
        <div className="w-full sm:w-auto sm:min-w-[200px]">
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

        <div className="w-full sm:w-auto sm:min-w-[200px]">
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

      {filteredAndSortedNotes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {notes.length === 0 ? 'No notes published yet' : 'No notes match the selected filters'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedNotes.map((note) => {
            const contentMatch = note.content.match(/---\n[\s\S]*?\n---\n([\s\S]*)/)
            const displayContent = contentMatch ? contentMatch[1].trim() : note.content

            return (
              <Card key={note.path}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base">{note.name}</CardTitle>
                      <CardDescription>
                        {note.date && new Date(note.date).toLocaleString()}
                        {note.location && ` • 📍 ${note.location}`}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(note)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(note)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap mb-2">
                    {displayContent}
                  </p>
                  {note.tags && (
                    <div className="flex gap-2 flex-wrap">
                      {note.tags.split(',').map((tag, i) => (
                        <Badge key={i} variant="secondary">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Update the content and tags for this note
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
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

            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNote(null)}>
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
