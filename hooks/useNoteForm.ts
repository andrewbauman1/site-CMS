'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useGeolocation } from '@/hooks/useGeolocation'

export function useNoteForm() {
  const { data: session } = useSession()
  const { location, loading: geoLoading, getCurrentLocation } = useGeolocation()

  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [language, setLanguage] = useState('en')
  const [manualLocation, setManualLocation] = useState('')
  const [datetime, setDatetime] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [savedTags, setSavedTags] = useState<string[]>([])

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const settingsResponse = await fetch('/api/settings')
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json()
          setSavedTags(settings.noteTags || [])
        }
      } catch (error) {
        console.error('Failed to fetch saved tags:', error)
      }
    }

    if (session) {
      fetchTags()
    }
  }, [session])

  const resetForm = () => {
    setContent('')
    setTags('')
    setLanguage('en')
    setManualLocation('')
    setDatetime(new Date())
  }

  const publish = async () => {
    if (!content.trim()) {
      throw new Error('Please enter some content')
    }

    setLoading(true)
    try {
      const response = await fetch('/api/publish/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          language,
          location: location || manualLocation || undefined,
          datetime
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to publish note')
      }

      resetForm()
    } finally {
      setLoading(false)
    }
  }

  const saveDraft = async (draftId?: string | null) => {
    if (!content.trim()) {
      throw new Error('Please enter some content')
    }

    setLoading(true)
    try {
      const url = draftId ? `/api/drafts/${draftId}` : '/api/drafts'
      const method = draftId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NOTE',
          content,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean).join(','),
          language,
          location: location || manualLocation || undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save draft')
      }

      resetForm()
    } finally {
      setLoading(false)
    }
  }

  return {
    content, setContent,
    tags, setTags,
    language, setLanguage,
    manualLocation, setManualLocation,
    datetime, setDatetime,
    loading,
    savedTags,
    location,
    geoLoading,
    getCurrentLocation,
    publish,
    saveDraft,
    resetForm,
  }
}
