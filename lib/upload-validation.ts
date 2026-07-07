const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime'])

const IMAGE_MAX_BYTES = 25 * 1024 * 1024
const VIDEO_MAX_BYTES = 200 * 1024 * 1024

export function assertValidImage(file: File): void {
  if (!IMAGE_TYPES.has(file.type)) {
    throw new Error('Unsupported image type')
  }
  if (file.size > IMAGE_MAX_BYTES) {
    throw new Error('Image exceeds 25MB limit')
  }
}

export function assertValidMedia(file: File): void {
  if (IMAGE_TYPES.has(file.type)) {
    if (file.size > IMAGE_MAX_BYTES) {
      throw new Error('Image exceeds 25MB limit')
    }
    return
  }

  if (VIDEO_TYPES.has(file.type)) {
    if (file.size > VIDEO_MAX_BYTES) {
      throw new Error('Video exceeds 200MB limit')
    }
    return
  }

  throw new Error('Unsupported file type')
}
