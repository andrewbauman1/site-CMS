'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlbumSelectorProps {
  availableAlbums: string[]
  selectedAlbums: string[]
  onAlbumsChanged: (albums: string[]) => void
  className?: string
}

/**
 * Album Selector Component
 * Allows users to select from existing albums and create new ones
 * Uses tag-style badges for visual selection
 */
export function AlbumSelector({
  availableAlbums,
  selectedAlbums,
  onAlbumsChanged,
  className
}: AlbumSelectorProps) {
  const [newAlbum, setNewAlbum] = useState('')

  /**
   * Toggle album selection
   */
  const toggleAlbum = (album: string) => {
    const isSelected = selectedAlbums.includes(album)
    const newAlbums = isSelected
      ? selectedAlbums.filter(a => a !== album)
      : [...selectedAlbums, album]
    onAlbumsChanged(newAlbums)
  }

  /**
   * Add a new album to the selection
   */
  const addNewAlbum = () => {
    const trimmed = newAlbum.trim()
    if (!trimmed) return

    // Prevent duplicates
    if (selectedAlbums.includes(trimmed)) {
      setNewAlbum('')
      return
    }

    onAlbumsChanged([...selectedAlbums, trimmed])
    setNewAlbum('')
  }

  /**
   * Handle Enter key in input field
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addNewAlbum()
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Existing albums */}
      {availableAlbums.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableAlbums.map((album) => {
            const isSelected = selectedAlbums.includes(album)
            return (
              <Badge
                key={album}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => toggleAlbum(album)}
              >
                {album}
              </Badge>
            )
          })}
        </div>
      )}

      {/* Create new album input */}
      <div className="flex gap-2">
        <Input
          placeholder="Create new album..."
          value={newAlbum}
          onChange={(e) => setNewAlbum(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={addNewAlbum}
          disabled={!newAlbum.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected albums (removable) */}
      {selectedAlbums.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="text-sm text-muted-foreground self-center">Selected:</span>
          {selectedAlbums.map((album) => (
            <Badge key={album} variant="secondary" className="gap-1">
              {album}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => toggleAlbum(album)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
