export interface Story {
  id: string
  uploaded: string
  filename: string
  meta?: {
    caption?: string
    alt?: string
    tags?: string[]
    url?: string
    title?: string
  }
  requireSignedURLs?: boolean
  variants?: string[]
  playback?: {
    hls?: string
  }
  thumbnail?: string
}

export interface StoriesData {
  stories: Story[]
  sha: string | null
}

export async function getStories(accessToken: string): Promise<StoriesData> {
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO

  if (!owner || !repo) {
    throw new Error('GitHub configuration missing')
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/_data/stories.json`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
      }
    }
  )

  if (!response.ok) {
    if (response.status === 404) {
      return { stories: [], sha: null }
    }
    throw new Error(`Failed to fetch stories: ${response.status}`)
  }

  const fileData = await response.json()
  const content = Buffer.from(fileData.content, 'base64').toString('utf-8')
  const stories = JSON.parse(content)

  return { stories, sha: fileData.sha }
}
