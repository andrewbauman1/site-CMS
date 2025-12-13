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

    // Fetch the list of files in _notes directory
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/_notes`,
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
      throw new Error(`Failed to fetch notes: ${response.status}`)
    }

    const files = await response.json()

    // Fetch content for each file
    const notes = await Promise.all(
      files.map(async (file: any) => {
        const contentResponse = await fetch(file.url, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Accept': 'application/vnd.github+json',
          }
        })

        if (!contentResponse.ok) return null

        const contentData = await contentResponse.json()
        const content = Buffer.from(contentData.content, 'base64').toString('utf-8')

        // Parse frontmatter (YAML-aware)
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
        let metadata: any = {}

        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1]
          const lines = frontmatter.split('\n')
          let currentKey: string | null = null
          let arrayValues: string[] = []

          lines.forEach((line, index) => {
            // Check if this is an array item (starts with - )
            if (line.trim().startsWith('-')) {
              const value = line.trim().substring(1).trim()
              arrayValues.push(value)

              // If next line doesn't start with -, or this is last line, save the array
              const nextLine = lines[index + 1]
              if (!nextLine || !nextLine.trim().startsWith('-')) {
                if (currentKey) {
                  metadata[currentKey] = arrayValues.join(',')
                  currentKey = null
                  arrayValues = []
                }
              }
            } else if (line.includes(':')) {
              // Regular key: value pair
              const [key, ...valueParts] = line.split(':')
              const value = valueParts.join(':').trim()

              if (key && value) {
                // Has immediate value
                metadata[key.trim()] = value
              } else if (key) {
                // Key with no immediate value (likely followed by array)
                currentKey = key.trim()
                arrayValues = []
              }
            }
          })
        }

        return {
          path: file.path,
          name: file.name,
          sha: file.sha,
          content: content,
          ...metadata
        }
      })
    )

    return NextResponse.json(notes.filter(Boolean))
  } catch (error: any) {
    console.error('Failed to fetch notes:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { path, sha } = await request.json()
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
  } catch (error: any) {
    console.error('Failed to delete note:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete note' },
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
    const { path, sha, content } = await request.json()
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
  } catch (error: any) {
    console.error('Failed to update note:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update note' },
      { status: 500 }
    )
  }
}
