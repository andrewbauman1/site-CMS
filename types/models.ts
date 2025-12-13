// Type definitions ported from Android Kotlin models

export interface Note {
  content: string
  tags: string[]
  language: string
  location?: string
  datetime: Date
}

export interface Post {
  title: string
  content: string
  tags?: string[]
  date: Date
  layout: string
  feature?: number
}

export interface StoryDraft {
  mediaFile: File
  isVideo: boolean
  caption: string
  altText: string
  tags: string[]
}

export interface StoryUploadResult {
  id: string
  uploaded: Date
  filename: string
  publicUrl: string
  thumbnailUrl?: string
  meta: StoryMetadata
}

export interface StoryMetadata {
  caption?: string
  alt?: string
  tags: string[]
  url?: string
}

export interface Draft {
  id: string
  type: 'NOTE' | 'POST' | 'STORY'
  title?: string
  content: string
  tags?: string
  language?: string
  location?: string
  createdAt: Date
  updatedAt: Date
}

export enum DraftType {
  NOTE = 'NOTE',
  POST = 'POST',
  STORY = 'STORY',
}

export enum TokenType {
  OAUTH = 'OAUTH',
  PAT = 'PAT',
}

// Photo types
export interface Photo {
  uploaded: string  // ISO date string
  id: string
  filename: string
  meta: PhotoMetadata
  variants: string[]  // [publicUrl, thumbnailUrl]
  requireSignedURLs: boolean
}

export interface PhotoMetadata {
  ratio: number
  orientation: 'landscape' | 'portrait' | 'square'
  caption?: string
  alt: string  // required
  featured: boolean
  albums: string[]
  location?: string
  datetime?: string  // ISO string - user-specified date/time for the photo
}

export interface PhotoDraft {
  file: File
  preview: string
  caption: string
  alt: string
  albums: string[]
  location: string
  featured: boolean
  datetime: Date
  ratio: number
  orientation: 'landscape' | 'portrait' | 'square'
  dimensions: { width: number; height: number }
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export interface PhotoUploadResult {
  id: string
  uploaded: Date
  filename: string
  publicUrl: string
  thumbnailUrl: string
  meta: PhotoMetadata
}

export interface UploadProgress {
  total: number
  completed: number
  failed: number
  currentBatch: number
}
