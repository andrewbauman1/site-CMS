import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { errorResponse } from '@/lib/api-error'
import { getStories } from '@/lib/stories'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await getStories(session.accessToken)
    return NextResponse.json(data)
  } catch (error) {
    return errorResponse(error, 'Failed to fetch stories')
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { stories, sha } = await request.json()
    const owner = process.env.GITHUB_OWNER || 'andrewbauman1'
    const repo = process.env.GITHUB_REPO || 'site'

    const content = JSON.stringify(stories, null, 2)

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/_data/stories.json`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Update stories via web app',
          content: Buffer.from(content).toString('base64'),
          sha: sha
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to update stories: ${response.status}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to update stories:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update stories' },
      { status: 500 }
    )
  }
}
