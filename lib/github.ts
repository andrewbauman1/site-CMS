// GitHub API integration
// Ported from: /Users/drewsiph/Documents/GitHub/site-AndroidApp/app/src/main/java/dev/drewsiph/writer/data/repository/GitHubRepository.kt

import { Note, Post } from '@/types/models'

export async function publishNote(
  token: string,
  owner: string,
  repo: string,
  note: Note
): Promise<void> {
  const inputs = {
    content: note.content || '',
    tags: note.tags && note.tags.length > 0 ? note.tags.join(',') : 'note',
    lang: note.language || 'en',
    location: note.location || '',
    datetime: new Date(note.datetime).toISOString()
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/notes.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to publish note: ${response.status} - ${errorText}`)
  }
}

export async function publishPost(
  token: string,
  owner: string,
  repo: string,
  post: Post
): Promise<void> {
  const inputs: Record<string, string> = {
    title: post.title || 'Untitled',
    content: post.content || '',
    date: post.date.toISOString().split('T')[0],
    layout: post.layout || 'default'
  }

  if (post.tags && post.tags.length > 0) {
    inputs.tags = post.tags.join(',')
  }

  if (post.feature) {
    inputs.feature = post.feature.toString()
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/posts.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to publish post: ${response.status} - ${errorText}`)
  }
}

export async function fetchPublishedNotes(
  token: string,
  owner: string,
  repo: string
): Promise<any[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/_notes`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch notes: ${response.status}`)
  }

  return await response.json()
}

export async function fetchPublishedPosts(
  token: string,
  owner: string,
  repo: string
): Promise<any[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/_posts`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.status}`)
  }

  return await response.json()
}

export async function getCurrentUser(token: string): Promise<any> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`)
  }

  return await response.json()
}
