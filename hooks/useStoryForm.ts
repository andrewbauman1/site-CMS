'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useMediaUpload } from '@/hooks/useMediaUpload'

export function useStoryForm() {
  const { data: session } = useSession()
  const { file, preview, uploading, handleFileSelect, uploadFile, clearFile } = useMediaUpload()

  const [caption, setCaption] = useState('')
  const [altText, setAltText] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [storyDate, setStoryDate] = useState(new Date())
  const [availableTags, setAvailableTags] = useState<string[]>([])

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const storiesResponse = await fetch('/api/github/stories')
        if (storiesResponse.ok) {
          const data = await storiesResponse.json()
          const stories = data.stories || []

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

  const resetForm = () => {
    setCaption('')
    setAltText('')
    setTags([])
    setStoryDate(new Date())
    clearFile()
  }

  const upload = async () => {
    if (!file) {
      throw new Error('Please select a file')
    }

    await uploadFile({
      caption,
      altText,
      tags,
      datetime: storyDate
    })

    resetForm()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  return {
    file,
    preview,
    uploading,
    caption, setCaption,
    altText, setAltText,
    tags, setTags,
    storyDate, setStoryDate,
    availableTags,
    handleFileChange,
    upload,
    resetForm,
  }
}
