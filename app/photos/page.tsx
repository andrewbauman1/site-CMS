'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
import { AlbumSelector } from '@/components/album-selector'
import { Photo } from '@/types/models'

export default function PhotosPage() {
  const { data: session } = useSession()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [sha, setSha] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterAlbum, setFilterAlbum] = useState<string>('all')
  const [filterFeatured, setFilterFeatured] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<string>('newest')

  // Edit state
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [editAlt, setEditAlt] = useState('')
  const [editAlbums, setEditAlbums] = useState<string[]>([])
  const [editLocation, setEditLocation] = useState('')
  const [editFeatured, setEditFeatured] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session) {
      fetchPhotos()
    }
  }, [session])

  const fetchPhotos = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/github/photos')
      if (response.ok) {
        const data = await response.json()
        setPhotos(data.photos)
        setSha(data.sha)
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get unique albums from all photos
  const allAlbums = useMemo(() => {
    const albumSet = new Set<string>()
    photos.forEach(photo => {
      photo.meta.albums?.forEach(album => albumSet.add(album))
    })
    return Array.from(albumSet).sort()
  }, [photos])

  // Filter and sort photos
  const filteredAndSortedPhotos = useMemo(() => {
    let filtered = [...photos]

    // Filter by album
    if (filterAlbum !== 'all') {
      filtered = filtered.filter(photo =>
        photo.meta.albums?.includes(filterAlbum)
      )
    }

    // Filter by featured
    if (filterFeatured === 'featured') {
      filtered = filtered.filter(photo => photo.meta.featured)
    } else if (filterFeatured === 'non-featured') {
      filtered = filtered.filter(photo => !photo.meta.featured)
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.uploaded).getTime()
      const dateB = new Date(b.uploaded).getTime()

      if (sortOrder === 'newest') {
        return dateB - dateA
      } else if (sortOrder === 'oldest') {
        return dateA - dateB
      } else if (sortOrder === 'featured-first') {
        if (a.meta.featured === b.meta.featured) {
          return dateB - dateA  // Within same featured status, newest first
        }
        return a.meta.featured ? -1 : 1
      }
      return 0
    })

    return filtered
  }, [photos, filterAlbum, filterFeatured, sortOrder])

  const handleEdit = (photo: Photo) => {
    setEditingPhoto(photo)
    setEditCaption(photo.meta.caption || '')
    setEditAlt(photo.meta.alt)
    setEditAlbums(photo.meta.albums)
    setEditLocation(photo.meta.location || '')
    setEditFeatured(photo.meta.featured)
  }

  const handleSave = async () => {
    if (!editingPhoto) return

    // Validate required fields
    if (!editAlt.trim()) {
      alert('Alt text is required for accessibility')
      return
    }

    if (editAlbums.length === 0) {
      alert('At least one album is required')
      return
    }

    setSaving(true)
    try {
      // Update photo in array
      const updatedPhotos = photos.map(p =>
        p.id === editingPhoto.id
          ? {
              ...p,
              meta: {
                ...p.meta,
                caption: editCaption || undefined,
                alt: editAlt.trim(),
                albums: editAlbums,
                location: editLocation || undefined,
                featured: editFeatured
              }
            }
          : p
      )

      // Save to GitHub
      const response = await fetch('/api/github/photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: updatedPhotos, sha })
      })

      if (response.ok) {
        alert('Photo updated successfully!')
        setEditingPhoto(null)
        fetchPhotos()
      } else {
        throw new Error('Failed to update photo')
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (photo: Photo) => {
    if (!confirm(`Are you sure you want to delete this photo? This action cannot be undone.`)) {
      return
    }

    try {
      const updatedPhotos = photos.filter(p => p.id !== photo.id)

      const response = await fetch('/api/github/photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: updatedPhotos, sha })
      })

      if (response.ok) {
        alert('Photo deleted successfully!')
        fetchPhotos()
      } else {
        throw new Error('Failed to delete photo')
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Please sign in to view photos</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading photos...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Published Photos</h1>
        <p className="text-muted-foreground">
          View, edit, and manage your photo gallery
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 justify-end">
        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <Select value={filterAlbum} onValueChange={setFilterAlbum}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by album" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Albums</SelectItem>
              {allAlbums.map(album => (
                <SelectItem key={album} value={album}>{album}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <Select value={filterFeatured} onValueChange={setFilterFeatured}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by featured" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Photos</SelectItem>
              <SelectItem value="featured">Featured Only</SelectItem>
              <SelectItem value="non-featured">Non-Featured</SelectItem>
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
              <SelectItem value="featured-first">Featured First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Photo Grid */}
      {filteredAndSortedPhotos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {photos.length === 0
                ? 'No photos uploaded yet. Upload your first photo to get started!'
                : 'No photos match the selected filters'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSortedPhotos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-square">
                <img
                  src={photo.variants[1]}  // Use thumbnail URL for performance
                  alt={photo.meta.alt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {photo.meta.featured && (
                  <Badge className="absolute top-2 left-2">Featured</Badge>
                )}
              </div>
              <CardContent className="pt-4 space-y-2">
                {photo.meta.caption && (
                  <p className="text-sm line-clamp-2">{photo.meta.caption}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {photo.meta.albums?.map(album => (
                    <Badge key={album} variant="outline" className="text-xs">
                      {album}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(photo.uploaded).toLocaleDateString()}
                  {photo.meta.location && ` • ${photo.meta.location}`}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(photo)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(photo)}
                    className="flex-1"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editingPhoto} onOpenChange={() => setEditingPhoto(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Photo</DialogTitle>
            <DialogDescription>
              Update the metadata for this photo
            </DialogDescription>
          </DialogHeader>

          {editingPhoto && (
            <div className="space-y-4 py-4">
              {/* Photo preview */}
              <img
                src={editingPhoto.variants[0]}  // Use public URL for editing
                alt={editingPhoto.meta.alt}
                className="w-full max-h-64 object-contain rounded border"
              />

              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="edit-caption">Caption</Label>
                <Textarea
                  id="edit-caption"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>

              {/* Alt text (required) */}
              <div className="space-y-2">
                <Label htmlFor="edit-alt">
                  Alt Text <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-alt"
                  value={editAlt}
                  onChange={(e) => setEditAlt(e.target.value)}
                  required
                  maxLength={200}
                />
              </div>

              {/* Albums (required) */}
              <div className="space-y-2">
                <Label>
                  Albums <span className="text-destructive">*</span>
                </Label>
                <AlbumSelector
                  availableAlbums={allAlbums}
                  selectedAlbums={editAlbums}
                  onAlbumsChanged={setEditAlbums}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                />
              </div>

              {/* Featured checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-featured"
                  checked={editFeatured}
                  onCheckedChange={(checked) => setEditFeatured(checked as boolean)}
                />
                <Label htmlFor="edit-featured" className="font-normal cursor-pointer">
                  Featured photo
                </Label>
              </div>

              {/* Photo info */}
              <p className="text-xs text-muted-foreground">
                {editingPhoto.meta.orientation} • {editingPhoto.meta.ratio.toFixed(2)} ratio
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPhoto(null)}>
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
