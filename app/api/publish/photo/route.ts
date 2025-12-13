import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadPhotoToCloudflare, triggerPhotoWorkflow } from '@/lib/cloudflare'

/**
 * POST /api/publish/photo
 * Handles photo upload to Cloudflare and triggers GitHub workflow
 * Validates required fields (alt text, albums)
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()

    // Extract form data
    const file = formData.get('file') as File
    const caption = formData.get('caption') as string
    const alt = formData.get('alt') as string
    const albumsJson = formData.get('albums') as string
    const location = formData.get('location') as string
    const featuredStr = formData.get('featured') as string
    const datetimeStr = formData.get('datetime') as string
    const ratioStr = formData.get('ratio') as string
    const orientation = formData.get('orientation') as string

    // Validate file
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate alt text (required for accessibility)
    if (!alt || !alt.trim()) {
      return NextResponse.json({ error: 'Alt text is required for accessibility' }, { status: 400 })
    }

    // Parse and validate albums
    let albums: string[]
    try {
      albums = JSON.parse(albumsJson)
      if (!Array.isArray(albums) || albums.length === 0) {
        return NextResponse.json({ error: 'At least one album is required' }, { status: 400 })
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid albums format' }, { status: 400 })
    }

    // Parse boolean and number fields
    const featured = featuredStr === 'true'
    const ratio = parseFloat(ratioStr)
    const datetime = datetimeStr || undefined

    // Upload to Cloudflare Images
    const uploadResult = await uploadPhotoToCloudflare(file, {
      caption: caption || undefined,
      alt: alt.trim(),
      albums,
      location: location || undefined,
      featured,
      datetime,
      ratio,
      orientation
    })

    // Trigger GitHub workflow to add to photos.json
    await triggerPhotoWorkflow(session.accessToken, uploadResult)

    return NextResponse.json(uploadResult)
  } catch (error: any) {
    console.error('Photo upload failed:', error)

    // Provide more specific error messages
    if (error.message.includes('Cloudflare')) {
      return NextResponse.json(
        { error: `Cloudflare upload failed: ${error.message}` },
        { status: 500 }
      )
    }

    if (error.message.includes('GitHub')) {
      return NextResponse.json(
        { error: `GitHub workflow trigger failed: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
