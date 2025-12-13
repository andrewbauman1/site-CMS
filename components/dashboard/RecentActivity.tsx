'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'

interface RecentActivityProps {
  recent: {
    notes: Array<{
      name: string
      path: string
      date: string
      content: string
      tags: string[]
    }>
    posts: Array<{ name: string; path: string; date: string }>
    stories: Array<{ id: string; uploaded: string; meta: any; thumbnailUrl?: string }>
    photos: Array<{ id: string; uploaded: string; meta: any; thumbnailUrl: string }>
  }
  loading?: boolean
}

type ActivityItem = {
  type: 'note' | 'post' | 'story' | 'photo'
  date: Date
  title: string
  subtitle?: string
  filename?: string
  tags?: string[]
  thumbnailUrl?: string
  href?: string
}

export function RecentActivity({ recent, loading }: RecentActivityProps) {
  const [dateFilter, setDateFilter] = useState<string>('7days')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Combine all items into a unified timeline
  const activityItems: ActivityItem[] = [
    ...recent.notes.map(n => ({
      type: 'note' as const,
      date: new Date(n.date),
      title: n.content || 'Empty note',
      filename: n.name.replace('.md', ''),
      tags: n.tags,
      href: '/notes'
    })),
    ...recent.posts.map(p => ({
      type: 'post' as const,
      date: new Date(p.date),
      title: p.name.replace('.md', '').replace(/^\d{4}-\d{2}-\d{2}-/, ''),
      href: '/posts'
    })),
    ...recent.stories.map(s => ({
      type: 'story' as const,
      date: new Date(s.uploaded),
      title: s.meta?.caption || 'Untitled Story',
      subtitle: s.meta?.tags?.join(', '),
      thumbnailUrl: s.thumbnailUrl,
      href: '/stories'
    })),
    ...recent.photos.map(p => ({
      type: 'photo' as const,
      date: new Date(p.uploaded),
      title: p.meta?.caption || p.meta?.alt || 'Untitled Photo',
      subtitle: p.meta?.albums?.join(', '),
      thumbnailUrl: p.thumbnailUrl,
      href: '/photos'
    }))
  ]

  // Sort by date (newest first)
  activityItems.sort((a, b) => b.date.getTime() - a.date.getTime())

  // Apply filters
  let filteredItems = activityItems

  // Filter by type
  if (typeFilter !== 'all') {
    filteredItems = filteredItems.filter(item => item.type === typeFilter)
  }

  // Filter by date range
  const now = new Date()
  if (dateFilter === '7days') {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    filteredItems = filteredItems.filter(item => item.date >= sevenDaysAgo)
  } else if (dateFilter === '30days') {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    filteredItems = filteredItems.filter(item => item.date >= thirtyDaysAgo)
  } else if (dateFilter === '90days') {
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    filteredItems = filteredItems.filter(item => item.date >= ninetyDaysAgo)
  }

  // Take top 10
  const recentActivity = filteredItems.slice(0, 10)

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'note': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'post': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'story': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'photo': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'note': return '📝'
      case 'post': return '📄'
      case 'story': return '📸'
      case 'photo': return '🖼️'
      default: return '📄'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest content across all types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-12 w-12 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recentActivity.length === 0) {
    const hasFilters = dateFilter !== 'all' || typeFilter !== 'all'
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest content across all types</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="note">Notes</SelectItem>
                  <SelectItem value="post">Posts</SelectItem>
                  <SelectItem value="story">Stories</SelectItem>
                  <SelectItem value="photo">Photos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            {hasFilters
              ? 'No activity matches the selected filters. Try adjusting your filters.'
              : 'No recent activity yet. Start creating content!'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest content across all types</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="note">Notes</SelectItem>
                <SelectItem value="post">Posts</SelectItem>
                <SelectItem value="story">Stories</SelectItem>
                <SelectItem value="photo">Photos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentActivity.map((item, index) => (
            <Link
              key={`${item.type}-${index}`}
              href={item.href || '#'}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="h-12 w-12 object-cover rounded"
                />
              ) : (
                <div className="h-12 w-12 flex items-center justify-center bg-muted rounded text-2xl">
                  {getTypeIcon(item.type)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                  <Badge variant="secondary" className={getTypeColor(item.type)}>
                    {item.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <p className="text-xs text-muted-foreground">
                    {item.date.toLocaleDateString()}
                  </p>
                  {item.filename && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground font-mono">
                        {item.filename}
                      </p>
                    </>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <div className="flex gap-1 flex-wrap">
                        {item.tags.map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs px-1.5 py-0 h-5"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                  {item.subtitle && !item.filename && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.subtitle}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
