'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface QuickStatsProps {
  stats: {
    notes: number
    posts: number
    publishedPosts: number
    stories: number
    storyTags: number
    photos: number
    photoAlbums: number
  }
  loading?: boolean
}

export function QuickStats({ stats, loading }: QuickStatsProps) {
  const statCards = [
    {
      title: 'Notes Published',
      value: stats.notes,
      icon: '📝',
      description: 'Total notes in repository'
    },
    {
      title: 'Posts Published',
      value: stats.posts,
      secondaryValue: stats.publishedPosts,
      icon: '📄',
      description: 'Total blog posts',
      secondaryDescription: 'published'
    },
    {
      title: 'Stories Uploaded',
      value: stats.stories,
      secondaryValue: stats.storyTags,
      icon: '📸',
      description: 'Total media stories',
      secondaryDescription: 'unique tags'
    },
    {
      title: 'Photos Uploaded',
      value: stats.photos,
      secondaryValue: stats.photoAlbums,
      icon: '🖼️',
      description: 'Total photos in gallery',
      secondaryDescription: 'unique albums'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <span className="text-2xl">{stat.icon}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <span className="animate-pulse">—</span>
              ) : (
                stat.value.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
            {'secondaryValue' in stat && stat.secondaryValue !== undefined && (
              <>
                <div className="text-xl font-semibold mt-2">
                  {loading ? (
                    <span className="animate-pulse">—</span>
                  ) : (
                    stat.secondaryValue.toLocaleString()
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.secondaryDescription}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
