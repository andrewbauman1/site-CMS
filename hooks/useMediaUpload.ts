'use client'

import { useState } from 'react'

export function useMediaUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)

    // Generate preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.onerror = () => {
      setError('Failed to read file')
    }
    reader.readAsDataURL(selectedFile)
  }

  const uploadFile = async (additionalData: {
    caption: string
    altText: string
    tags: string[]
    datetime?: Date
  }): Promise<any> => {
    if (!file) {
      throw new Error('No file selected')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('caption', additionalData.caption)
    formData.append('altText', additionalData.altText)
    formData.append('tags', JSON.stringify(additionalData.tags))
    if (additionalData.datetime) {
      formData.append('datetime', additionalData.datetime.toISOString())
    }

    setUploading(true)
    setError(null)

    try {
      const response = await fetch('/api/publish/story', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setUploading(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setPreview(null)
    setError(null)
  }

  return {
    file,
    preview,
    uploading,
    error,
    handleFileSelect,
    uploadFile,
    clearFile
  }
}
