import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let settings = await prisma.settings.findUnique({
      where: { userId: session.user.id }
    })

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId: session.user.id,
          theme: 'system',
          noteTags: [],
          hiddenStoryFeeds: []
        }
      })
    }

    return NextResponse.json({
      theme: settings.theme,
      noteTags: settings.noteTags,
      hiddenStoryFeeds: settings.hiddenStoryFeeds
    })
  } catch (error: any) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { theme, noteTags, hiddenStoryFeeds } = body

    // Build update object dynamically to only update provided fields
    const updateData: any = {}
    if (theme !== undefined) updateData.theme = theme
    if (noteTags !== undefined) updateData.noteTags = noteTags
    if (hiddenStoryFeeds !== undefined) updateData.hiddenStoryFeeds = hiddenStoryFeeds

    const settings = await prisma.settings.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        theme: theme || 'system',
        noteTags: noteTags || [],
        hiddenStoryFeeds: hiddenStoryFeeds || []
      }
    })

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Failed to update settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    )
  }
}
