import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/github/photos
 * Fetches the photos.json file from GitHub repository
 * Returns array of photos and SHA for optimistic locking
 */
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_REPO

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'GitHub configuration missing' },
        { status: 500 }
      )
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/_data/photos.json`,
      {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/vnd.github+json',
        }
      }
    )

    if (!response.ok) {
      // Return empty array if photos.json doesn't exist yet
      if (response.status === 404) {
        return NextResponse.json({ photos: [], sha: null })
      }
      throw new Error(`Failed to fetch photos: ${response.status}`)
    }

    const data = await response.json()
    const content = Buffer.from(data.content, 'base64').toString('utf-8')
    const photos = JSON.parse(content)

    return NextResponse.json({ photos, sha: data.sha })
  } catch (error: any) {
    console.error('Failed to fetch photos:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch photos' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/github/photos
 * Updates the photos.json file in GitHub repository
 * Requires SHA for optimistic locking to prevent conflicts
 */
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { photos, sha } = await request.json()
    const owner = process.env.GITHUB_OWNER || 'andrewbauman1'
    const repo = process.env.GITHUB_REPO || 'site'

    const content = JSON.stringify(photos, null, 2)
    const base64Content = Buffer.from(content).toString('base64')

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/_data/photos.json`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Update photos via web app',
          content: base64Content,
          sha: sha
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to update photos: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to update photos:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update photos' },
      { status: 500 }
    )
  }
}
