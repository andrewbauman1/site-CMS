import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadImageToCloudflare, uploadVideoToCloudflare, triggerStoryWorkflow } from '@/lib/cloudflare'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const caption = formData.get('caption') as string
    const altText = formData.get('altText') as string
    const tags = JSON.parse(formData.get('tags') as string || '[]')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const isVideo = file.type.startsWith('video/')

    const uploadResult = isVideo
      ? await uploadVideoToCloudflare(file, { caption, alt: altText, tags })
      : await uploadImageToCloudflare(file, { caption, alt: altText, tags })

    // Trigger GitHub workflow to add to stories.json
    await triggerStoryWorkflow(session.accessToken, uploadResult)

    return NextResponse.json(uploadResult)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to upload story' },
      { status: 500 }
    )
  }
}
