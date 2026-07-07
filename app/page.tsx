import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDashboardData } from '@/lib/dashboard'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { RecentActivity } from '@/components/dashboard/RecentActivity'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

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

  let dashboardData: Awaited<ReturnType<typeof getDashboardData>> | null = null
  let error: string | null = null

  if (!session.accessToken) {
    error = 'Unauthorized'
  } else {
    try {
      dashboardData = await getDashboardData(session.accessToken)
    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
      error = err.message
    }
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
      />

      {/* Recent Activity */}
      <RecentActivity
        recent={dashboardData?.recent || { notes: [], posts: [], stories: [], photos: [] }}
      />
    </div>
  )
}
