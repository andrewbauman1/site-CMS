import { Photo } from '@/types/models'

export interface PhotosData {
  photos: Photo[]
  sha: string | null
}

export async function getPhotos(accessToken: string): Promise<PhotosData> {
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO

  if (!owner || !repo) {
    throw new Error('GitHub configuration missing')
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/_data/photos.json`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
      }
    }
  )

  if (!response.ok) {
    if (response.status === 404) {
      return { photos: [], sha: null }
    }
    throw new Error(`Failed to fetch photos: ${response.status}`)
  }

  const data = await response.json()
  const content = Buffer.from(data.content, 'base64').toString('utf-8')
  const photos = JSON.parse(content)

  return { photos, sha: data.sha }
}
