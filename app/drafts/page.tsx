'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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

interface Draft {
  id: string
  type: string
  title?: string
  content: string
  tags?: string
  createdAt: string
  updatedAt: string
}

export default function DraftsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)

  // Filter and sort states
  const [filterType, setFilterType] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<string>('updated')

  useEffect(() => {
    if (session) {
      fetchDrafts()
    }
  }, [session])

  const fetchDrafts = async () => {
    try {
      const response = await fetch('/api/drafts')
      if (response.ok) {
        const data = await response.json()
        setDrafts(data)
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (draft: Draft) => {
    // Store draft in localStorage so the respective page can load it
    localStorage.setItem('editDraft', JSON.stringify(draft))

    // Navigate to the appropriate page based on draft type
    const pageMap: Record<string, string> = {
      'NOTE': '/note',
      'POST': '/post',
      'STORY': '/story'
    }

    const targetPage = pageMap[draft.type] || '/'
    router.push(targetPage)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) {
      return
    }

    try {
      const response = await fetch(`/api/drafts/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDrafts(drafts.filter(d => d.id !== id))
      }
    } catch (error) {
      alert('Failed to delete draft')
    }
  }

  // Filter and sort drafts
  const filteredAndSortedDrafts = useMemo(() => {
    let filtered = [...drafts]

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(draft => draft.type === filterType)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [drafts, filterType, sortOrder])

  if (!session) {
    return <div>Please sign in</div>
  }

  if (loading) {
    return <div>Loading drafts...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Drafts</h1>
        <p className="text-muted-foreground">
          Manage your saved drafts
        </p>
      </div>

      {/* Filters */}
      {drafts.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-4 justify-end">
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="NOTE">Notes</SelectItem>
                <SelectItem value="POST">Posts</SelectItem>
                <SelectItem value="STORY">Stories</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Recently Updated</SelectItem>
                <SelectItem value="created">Recently Created</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {filteredAndSortedDrafts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {drafts.length === 0 ? 'No drafts yet' : 'No drafts match the selected filters'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedDrafts.map((draft) => (
            <Card key={draft.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge>{draft.type}</Badge>
                      {draft.title && (
                        <CardTitle>{draft.title}</CardTitle>
                      )}
                    </div>
                    <CardDescription>
                      Last updated: {new Date(draft.updatedAt).toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(draft)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(draft.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-3">
                  {draft.content}
                </p>
                {draft.tags && (
                  <div className="mt-2 flex gap-2">
                    {draft.tags.split(',').map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
