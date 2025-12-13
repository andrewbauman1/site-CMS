'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TagSelectorProps {
  availableTags: string[]
  selectedTags: string[]
  onTagsChanged: (tags: string[]) => void
  className?: string
}

export function TagSelector({ availableTags, selectedTags, onTagsChanged, className }: TagSelectorProps) {
  const toggleTag = (tag: string) => {
    const isSelected = selectedTags.includes(tag)
    const newTags = isSelected
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]
    onTagsChanged(newTags)
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {availableTags.map((tag) => {
        const isSelected = selectedTags.includes(tag)
        return (
          <Badge
            key={tag}
            variant={isSelected ? "default" : "outline"}
            className="cursor-pointer hover:bg-accent"
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Badge>
        )
      })}
      {availableTags.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No tags available. Add some in Settings.
        </p>
      )}
    </div>
  )
}
