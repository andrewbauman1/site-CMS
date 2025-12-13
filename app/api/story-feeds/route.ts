import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || !session?.accessToken) {
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

    // Fetch feed files from /feeds/ directory
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/feeds`,
      {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/vnd.github+json',
        }
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json([])
      }
      throw new Error(`Failed to fetch feeds: ${response.status}`)
    }

    const files = await response.json()

    // Extract feed information from filenames like "stories-life.json" -> { name: "Life", filename: "stories-life.json", path: "feeds/stories-life.json" }
    const feeds = files
      .filter((file: any) =>
        file.type === 'file' &&
        file.name.startsWith('stories-') &&
        file.name.endsWith('.json')
      )
      .map((file: any) => {
        const feedName = file.name
          .replace('stories-', '')
          .replace('.json', '')
          .split('-')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

        return {
          name: feedName,
          filename: file.name,
          path: file.path
        }
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name))

    return NextResponse.json(feeds)
  } catch (error: any) {
    console.error('Failed to fetch story feeds:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch story feeds' },
      { status: 500 }
    )
  }
}
