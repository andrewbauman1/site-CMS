import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { assertSafeContentPath } from '@/lib/github-path'
import { errorResponse } from '@/lib/api-error'
import { getNotes } from '@/lib/notes'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const notes = await getNotes(session.accessToken)
    return NextResponse.json(notes)
  } catch (error) {
    return errorResponse(error, 'Failed to fetch notes')
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { path: rawPath, sha } = await request.json()
    const path = assertSafeContentPath(rawPath, 'note')
    const owner = process.env.GITHUB_OWNER || 'andrewbauman1'
    const repo = process.env.GITHUB_REPO || 'site'

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Delete note via web app',
          sha: sha
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to delete note: ${response.status}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid path') {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }
    return errorResponse(error, 'Failed to delete note')
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { path: rawPath, sha, content } = await request.json()
    const path = assertSafeContentPath(rawPath, 'note')
    const owner = process.env.GITHUB_OWNER || 'andrewbauman1'
    const repo = process.env.GITHUB_REPO || 'site'

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Update note via web app',
          content: Buffer.from(content).toString('base64'),
          sha: sha
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to update note: ${response.status}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid path') {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }
    return errorResponse(error, 'Failed to update note')
  }
}
