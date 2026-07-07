'use client'

import { useState } from 'react'

export function usePostForm() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [layout, setLayout] = useState('default')
  const [featured, setFeatured] = useState(false)
  const [postDate, setPostDate] = useState(new Date())
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setTitle('')
    setContent('')
    setTags('')
    setLayout('default')
    setFeatured(false)
    setPostDate(new Date())
  }

  const publish = async () => {
    if (!title.trim() || !content.trim()) {
      throw new Error('Please enter title and content')
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

      resetForm()
    } finally {
      setLoading(false)
    }
  }

  const saveDraft = async (draftId?: string | null) => {
    if (!title.trim() && !content.trim()) {
      throw new Error('Please enter at least a title or content')
    }

    setLoading(true)
    try {
      const url = draftId ? `/api/drafts/${draftId}` : '/api/drafts'
      const method = draftId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'POST',
          title,
          content,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean).join(','),
          language: layout
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save draft')
      }

      resetForm()
    } finally {
      setLoading(false)
    }
  }

  return {
    title, setTitle,
    content, setContent,
    tags, setTags,
    layout, setLayout,
    featured, setFeatured,
    postDate, setPostDate,
    loading,
    publish,
    saveDraft,
    resetForm,
  }
}
