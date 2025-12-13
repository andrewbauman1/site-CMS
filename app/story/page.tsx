'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { TagSelector } from '@/components/tag-selector'

export default function StoryPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { file, preview, uploading, handleFileSelect, uploadFile } = useMediaUpload()

  const [caption, setCaption] = useState('')
  const [altText, setAltText] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [storyDate, setStoryDate] = useState(new Date())
  const [availableTags, setAvailableTags] = useState<string[]>([])

  useEffect(() => {
    // Fetch existing tags from published stories
    const fetchTags = async () => {
      try {
        const storiesResponse = await fetch('/api/github/stories')
        if (storiesResponse.ok) {
          const data = await storiesResponse.json()
          const stories = data.stories || []

          // Extract unique tags from all stories
          const tagSet = new Set<string>()
          stories.forEach((story: any) => {
            if (story.meta?.tags) {
              story.meta.tags.forEach((tag: string) => tagSet.add(tag))
            }
          })

          setAvailableTags(Array.from(tagSet).sort())
        }
      } catch (error) {
        console.error('Failed to fetch story tags:', error)
      }
    }

    if (session) {
      fetchTags()
    }
  }, [session])

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file')
      return
    }

    try {
      await uploadFile({
        caption,
        altText,
        tags,
        datetime: storyDate
      })

      alert('Story uploaded successfully!')
      router.push('/')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  if (!session) {
    return <div>Please sign in</div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Upload Story</CardTitle>
          <CardDescription>
            Share an image or video to your stories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="file">Media File *</Label>
            <Input
              id="file"
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
            />
            {preview && (
              <div className="mt-4 border rounded-lg overflow-hidden">
                {file?.type.startsWith('video/') ? (
                  <video src={preview} controls className="w-full max-h-96" />
                ) : (
                  <img src={preview} alt="Preview" className="w-full max-h-96 object-contain" />
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alt">Alt Text</Label>
            <Input
              id="alt"
              placeholder="Describe the image for accessibility"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Categories</Label>
            <TagSelector
              availableTags={availableTags}
              selectedTags={tags}
              onTagsChanged={setTags}
            />
            {availableTags.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Tags will appear here after you publish your first story with tags
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Date & Time</Label>
            <DateTimePicker date={storyDate} setDate={setStoryDate} />
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="w-full"
          >
            {uploading ? 'Uploading...' : 'Upload Story'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
