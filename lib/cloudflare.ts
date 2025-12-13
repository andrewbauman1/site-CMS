// Cloudflare API integration for media uploads
// Ported from: /Users/drewsiph/Documents/GitHub/site-AndroidApp/app/src/main/java/dev/drewsiph/writer/data/repository/StoryRepository.kt

import { StoryUploadResult, StoryMetadata, PhotoUploadResult } from '@/types/models'

export async function uploadImageToCloudflare(
  file: File,
  metadata: { caption?: string; alt?: string; tags: string[] }
): Promise<StoryUploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  // Create metadata JSON
  const metadataJson = JSON.stringify({
    caption: metadata.caption || null,
    alt: metadata.alt || null,
    tags: metadata.tags
  })

  const metadataBlob = new Blob([metadataJson], { type: 'application/json' })
  formData.append('metadata', metadataBlob)

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      },
      body: formData
    }
  )

  const data = await response.json()

  if (!data.success) {
    const errors = data.errors || ['Unknown error']
    throw new Error(`Cloudflare upload failed: ${errors.join(', ')}`)
  }

  const deliveryHash = process.env.CLOUDFLARE_DELIVERY_HASH

  if (!deliveryHash) {
    throw new Error('Cloudflare delivery hash configuration missing')
  }

  return {
    id: data.result.id,
    uploaded: new Date(data.result.uploaded),
    filename: data.result.filename,
    publicUrl: `https://imagedelivery.net/${deliveryHash}/${data.result.id}/public`,
    thumbnailUrl: `https://imagedelivery.net/${deliveryHash}/${data.result.id}/thumbnail`,
    meta: {
      caption: metadata.caption,
      alt: metadata.alt,
      tags: metadata.tags
    }
  }
}

export async function uploadVideoToCloudflare(
  file: File,
  metadata: { caption?: string; alt?: string; tags: string[] }
): Promise<StoryUploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      },
      body: formData
    }
  )

  const data = await response.json()

  if (!data.success) {
    const errors = data.errors || ['Unknown error']
    throw new Error(`Cloudflare video upload failed: ${errors.join(', ')}`)
  }

  return {
    id: data.result.uid,
    uploaded: new Date(data.result.created),
    filename: file.name,
    publicUrl: data.result.playback.hls,
    thumbnailUrl: data.result.thumbnail,
    meta: {
      caption: metadata.caption,
      alt: metadata.alt,
      tags: metadata.tags,
      url: data.result.playback.hls
    }
  }
}

export async function triggerStoryWorkflow(
  token: string,
  uploadResult: StoryUploadResult
): Promise<void> {
  // Build the JSON data structure that matches what media.js expects
  const metaMap: Record<string, any> = {}

  if (uploadResult.meta.alt) metaMap.alt = uploadResult.meta.alt
  if (uploadResult.meta.caption) metaMap.caption = uploadResult.meta.caption
  metaMap.tags = uploadResult.meta.tags

  if (uploadResult.meta.url) {
    metaMap.url = uploadResult.meta.url
    metaMap.title = uploadResult.meta.caption || ''
  }

  const storyData: Record<string, any> = {
    uploaded: uploadResult.uploaded.toISOString(),
    id: uploadResult.id,
    filename: uploadResult.filename,
    meta: metaMap,
    requireSignedURLs: false
  }

  if (uploadResult.meta.url) {
    // Video - media.js checks for json.playback to determine if it's a video
    storyData.thumbnail = uploadResult.thumbnailUrl || ''
    storyData.playback = { hls: uploadResult.publicUrl }
  } else {
    // Image - media.js will construct the URL using json.id
    storyData.variants = [
      uploadResult.publicUrl,
      uploadResult.thumbnailUrl || ''
    ]
  }

  // Convert storyData to JSON string and base64 encode it
  const jsonString = JSON.stringify(storyData)
  const base64Data = Buffer.from(jsonString).toString('base64')

  const inputs = {
    filepath: '_data/stories.json',
    filedata: base64Data
  }

  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO

  if (!owner || !repo) {
    throw new Error('GitHub configuration missing')
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/cf2.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to trigger GitHub workflow: ${response.status} - ${errorText}`)
  }
}

// Photo upload functions
export async function uploadPhotoToCloudflare(
  file: File,
  metadata: {
    caption?: string
    alt: string
    albums: string[]
    location?: string
    featured: boolean
    datetime?: string
    ratio: number
    orientation: 'landscape' | 'portrait' | 'square'
  }
): Promise<PhotoUploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  // Create metadata JSON with all photo fields
  const metadataJson = JSON.stringify({
    caption: metadata.caption || null,
    alt: metadata.alt,
    albums: metadata.albums,
    location: metadata.location || null,
    featured: metadata.featured,
    datetime: metadata.datetime || null,
    ratio: metadata.ratio,
    orientation: metadata.orientation
  })

  const metadataBlob = new Blob([metadataJson], { type: 'application/json' })
  formData.append('metadata', metadataBlob)

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      },
      body: formData
    }
  )

  const data = await response.json()

  if (!data.success) {
    const errors = data.errors || ['Unknown error']
    throw new Error(`Cloudflare upload failed: ${errors.join(', ')}`)
  }

  const deliveryHash = process.env.CLOUDFLARE_DELIVERY_HASH

  if (!deliveryHash) {
    throw new Error('Cloudflare delivery hash configuration missing')
  }

  return {
    id: data.result.id,
    uploaded: new Date(data.result.uploaded),
    filename: data.result.filename,
    publicUrl: `https://imagedelivery.net/${deliveryHash}/${data.result.id}/public`,
    thumbnailUrl: `https://imagedelivery.net/${deliveryHash}/${data.result.id}/thumbnail`,
    meta: metadata
  }
}

export async function triggerPhotoWorkflow(
  token: string,
  uploadResult: PhotoUploadResult
): Promise<void> {
  // Build the photo data structure matching photos.json schema
  const photoData = {
    uploaded: uploadResult.uploaded.toISOString(),
    id: uploadResult.id,
    filename: uploadResult.filename,
    meta: {
      ratio: uploadResult.meta.ratio,
      orientation: uploadResult.meta.orientation,
      caption: uploadResult.meta.caption || null,
      alt: uploadResult.meta.alt,
      featured: uploadResult.meta.featured,
      albums: uploadResult.meta.albums,
      location: uploadResult.meta.location || null,
      datetime: uploadResult.meta.datetime || null
    },
    variants: [uploadResult.publicUrl, uploadResult.thumbnailUrl],
    requireSignedURLs: false
  }

  // Convert to JSON string and base64 encode
  const jsonString = JSON.stringify(photoData)
  const base64Data = Buffer.from(jsonString).toString('base64')

  const inputs = {
    filepath: '_data/photos.json',  // Different from stories
    filedata: base64Data
  }

  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO

  if (!owner || !repo) {
    throw new Error('GitHub configuration missing')
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/cf2.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to trigger GitHub workflow: ${response.status} - ${errorText}`)
  }
}
