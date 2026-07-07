'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { TagSelector } from '@/components/tag-selector'
import { useStoryForm } from '@/hooks/useStoryForm'

export default function StoryPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const form = useStoryForm()
  const {
    file,
    preview,
    uploading,
    caption, setCaption,
    altText, setAltText,
    tags, setTags,
    storyDate, setStoryDate,
    availableTags,
    handleFileChange,
  } = form

  const handleUpload = async () => {
    try {
      await form.upload()
      alert('Story uploaded successfully!')
      router.push('/')
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
