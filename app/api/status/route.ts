import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { statusText, date } = await req.json()

    // Allow empty statusText for clearing status
    if (statusText === undefined || statusText === null) {
      return NextResponse.json({ error: 'Status text is required' }, { status: 400 })
    }

    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_RESOURCES_REPO
    const path = 'status.txt'
    const token = session.accessToken

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'GitHub configuration missing' },
        { status: 500 }
      )
    }

    // Format the date as ISO 8601 with timezone offset
    const statusDate = new Date(date)

    // Get local time components to preserve the exact time selected by the user
    const year = statusDate.getFullYear()
    const month = String(statusDate.getMonth() + 1).padStart(2, '0')
    const day = String(statusDate.getDate()).padStart(2, '0')
    const hours = String(statusDate.getHours()).padStart(2, '0')
    const minutes = String(statusDate.getMinutes()).padStart(2, '0')
    const seconds = String(statusDate.getSeconds()).padStart(2, '0')

    // Get timezone offset (positive values mean behind UTC)
    const offsetMinutes = statusDate.getTimezoneOffset()
    const offsetHours = Math.abs(Math.floor(offsetMinutes / 60))
    const offsetMins = Math.abs(offsetMinutes % 60)
    const offsetSign = offsetMinutes > 0 ? '-' : '+'

    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`

    // Create the status file content (two lines: date and status)
    const content = `${formattedDate}\n${statusText}`

    // First, get the current file to get its SHA (if it exists)
    let sha: string | undefined
    try {
      const currentFileResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
          }
        }
      )

      if (currentFileResponse.ok) {
        const currentFile = await currentFileResponse.json()
        sha = currentFile.sha
      }
    } catch (error) {
      // File might not exist yet, that's okay
      console.log('File does not exist yet, will create new')
    }

    // Update or create the file
    const updateResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update status: ${statusText.substring(0, 50)}${statusText.length > 50 ? '...' : ''}`,
          content: Buffer.from(content).toString('base64'),
          ...(sha && { sha })
        })
      }
    )

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json()
      throw new Error(errorData.message || 'Failed to update status')
    }

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully'
    })

  } catch (error: any) {
    console.error('Failed to update status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update status' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_RESOURCES_REPO
    const path = 'status.txt'
    const token = session.accessToken

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'GitHub configuration missing' },
        { status: 500 }
      )
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
        }
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'Status not found' }, { status: 404 })
    }

    const fileData = await response.json()
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8')
    const [date, statusText] = content.split('\n', 2)

    return NextResponse.json({
      date,
      statusText,
      raw: content
    })

  } catch (error: any) {
    console.error('Failed to fetch status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch status' },
      { status: 500 }
    )
  }
}
