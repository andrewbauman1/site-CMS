import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
      `https://api.github.com/repos/${owner}/${repo}/contents/_data/stories.json`,
      {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/vnd.github+json',
        }
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ stories: [], sha: null })
      }
      throw new Error(`Failed to fetch stories: ${response.status}`)
    }

    const fileData = await response.json()
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8')
    const stories = JSON.parse(content)

    return NextResponse.json({ stories, sha: fileData.sha })
  } catch (error: any) {
    console.error('Failed to fetch stories:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stories' },
      { status: 500 }
    )
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
