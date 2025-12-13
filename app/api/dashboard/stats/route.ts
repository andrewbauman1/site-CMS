import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface DashboardStats {
  stats: {
    notes: number
    posts: number
    publishedPosts: number
    stories: number
    storyTags: number
    photos: number
    photoAlbums: number
  }
  recent: {
    notes: Array<{ name: string; path: string; date: string }>
    posts: Array<{ name: string; path: string; date: string }>
    stories: Array<{ id: string; uploaded: string; meta: any; thumbnailUrl?: string }>
    photos: Array<{ id: string; uploaded: string; meta: any; thumbnailUrl: string }>
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const token = session.accessToken

  if (!owner || !repo) {
    return NextResponse.json(
      { error: 'GitHub configuration missing' },
      { status: 500 }
    )
  }

  try {
    // Fetch all data in parallel
    const [notesRes, postsRes, storiesRes, photosRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}/contents/_notes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
        }
      }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/contents/_posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
        }
      }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/contents/_data/stories.json`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
        }
      }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/contents/_data/photos.json`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
        }
      })
    ])

    // Parse notes
    let notes: any[] = []
    if (notesRes.ok) {
      notes = await notesRes.json()
      notes = Array.isArray(notes) ? notes.filter((f: any) => f.name.endsWith('.md')) : []
    }

    // Parse posts
    let posts: any[] = []
    let publishedPostsCount = 0
    if (postsRes.ok) {
      posts = await postsRes.json()
      posts = Array.isArray(posts) ? posts.filter((f: any) => f.name.endsWith('.md')) : []

      // Count published posts (those with featured: true in frontmatter)
      // We'll check a sample or use a heuristic to avoid fetching all files
      // For now, fetch content of each post to check frontmatter
      const publishedChecks = await Promise.all(
        posts.map(async (post) => {
          try {
            const contentRes = await fetch(
              `https://api.github.com/repos/${owner}/${repo}/contents/${post.path}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/vnd.github+json',
                }
              }
            )
            if (contentRes.ok) {
              const contentData = await contentRes.json()
              const content = Buffer.from(contentData.content, 'base64').toString('utf-8')
              // Parse frontmatter (content between --- markers)
              const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
              if (frontmatterMatch) {
                const frontmatter = frontmatterMatch[1]
                // Check if featured: true exists
                return /^feature:\s*\d+/m.test(frontmatter)
              }
            }
            return false
          } catch {
            return false
          }
        })
      )
      publishedPostsCount = publishedChecks.filter(Boolean).length
    }

    // Parse stories
    let stories: any[] = []
    let uniqueStoryTags = 0
    if (storiesRes.ok) {
      const storiesData = await storiesRes.json()
      const content = Buffer.from(storiesData.content, 'base64').toString('utf-8')
      const parsed = JSON.parse(content)
      stories = Array.isArray(parsed) ? parsed : []

      // Count unique tags across all stories
      const tagSet = new Set<string>()
      stories.forEach((story: any) => {
        if (story.meta?.tags && Array.isArray(story.meta.tags)) {
          story.meta.tags.forEach((tag: string) => tagSet.add(tag))
        }
      })
      uniqueStoryTags = tagSet.size
    }

    // Parse photos
    let photos: any[] = []
    let uniquePhotoAlbums = 0
    if (photosRes.ok) {
      const photosData = await photosRes.json()
      const content = Buffer.from(photosData.content, 'base64').toString('utf-8')
      const parsed = JSON.parse(content)
      photos = Array.isArray(parsed) ? parsed : []

      // Count unique albums across all photos
      const albumSet = new Set<string>()
      photos.forEach((photo: any) => {
        if (photo.meta?.albums && Array.isArray(photo.meta.albums)) {
          photo.meta.albums.forEach((album: string) => albumSet.add(album))
        }
      })
      uniquePhotoAlbums = albumSet.size
    }

    // Get recent items (last 5 of each type)
    // Extract date from filename (format: YYYY-MM-DD-title.md or just YYYY-MM-DD.md)
    const extractDateFromFilename = (filename: string): string => {
      // Match YYYY-MM-DD at start of filename
      const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/)
      if (dateMatch) {
        return dateMatch[1]
      }
      // Match YYYY.MM.DD format
      const dotDateMatch = filename.match(/^(\d{4}\.\d{2}\.\d{2})/)
      if (dotDateMatch) {
        return dotDateMatch[1].replace(/\./g, '-')
      }
      // If no date found, use current date as fallback
      return new Date().toISOString().split('T')[0]
    }

    const recentNotes = notes
      .map(n => ({ ...n, extractedDate: extractDateFromFilename(n.name) }))
      .sort((a, b) => new Date(b.extractedDate).getTime() - new Date(a.extractedDate).getTime())
      .slice(0, 5)
      .map(n => ({ name: n.name, path: n.path, date: n.extractedDate }))

    const recentPosts = posts
      .map(p => ({ ...p, extractedDate: extractDateFromFilename(p.name) }))
      .sort((a, b) => new Date(b.extractedDate).getTime() - new Date(a.extractedDate).getTime())
      .slice(0, 5)
      .map(p => ({ name: p.name, path: p.path, date: p.extractedDate }))

    const recentStories = stories
      .sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime())
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        uploaded: s.uploaded,
        meta: s.meta,
        thumbnailUrl: s.thumbnail || s.variants?.[1]
      }))

    const recentPhotos = photos
      .sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime())
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        uploaded: p.uploaded,
        meta: p.meta,
        thumbnailUrl: p.variants?.[1]
      }))

    const result: DashboardStats = {
      stats: {
        notes: notes.length,
        posts: posts.length,
        publishedPosts: publishedPostsCount,
        stories: stories.length,
        storyTags: uniqueStoryTags,
        photos: photos.length,
        photoAlbums: uniquePhotoAlbums
      },
      recent: {
        notes: recentNotes,
        posts: recentPosts,
        stories: recentStories,
        photos: recentPhotos
      }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
