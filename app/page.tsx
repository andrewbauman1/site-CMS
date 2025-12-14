'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { RecentActivity } from '@/components/dashboard/RecentActivity'

interface DashboardData {
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
    notes: Array<{ name: string; path: string; date: string; content: string; tags: string[] }>
    posts: Array<{ name: string; path: string; date: string }>
    stories: Array<{ id: string; uploaded: string; meta: any; thumbnailUrl?: string }>
    photos: Array<{ id: string; uploaded: string; meta: any; thumbnailUrl: string }>
  }
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchDashboardData()
    }
  }, [session])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      const data = await response.json()
      setDashboardData(data)
    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold">Welcome to Site Backend</h1>
          <p className="text-xl text-muted-foreground">
            A powerful content management system for your Jekyll site
          </p>
          <p className="text-muted-foreground">
            Please sign in to get started
          </p>
          <div className="pt-4">
            <a
              href="/auth/signin"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 py-2"
            >
              Sign in with GitHub
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's an overview of your content.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">Failed to load dashboard</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      )}

      {/* Quick Stats */}
      <QuickStats
        stats={dashboardData?.stats || { notes: 0, posts: 0, publishedPosts: 0, stories: 0, storyTags: 0, photos: 0, photoAlbums: 0 }}
        loading={loading}
      />

      {/* Recent Activity */}
      <RecentActivity
        recent={dashboardData?.recent || { notes: [], posts: [], stories: [], photos: [] }}
        loading={loading}
      />
    </div>
  )
}
