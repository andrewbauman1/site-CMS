import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { publishNote } from '@/lib/github'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    console.log('Publishing note with data:', JSON.stringify(data, null, 2))

    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_REPO

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'GitHub configuration missing' },
        { status: 500 }
      )
    }

    await publishNote(
      session.accessToken,
      owner,
      repo,
      data
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to publish note:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to publish note' },
      { status: 500 }
    )
  }
}
