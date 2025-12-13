'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { X, Plus, Sun, Moon, Monitor } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useTheme } from '@/components/ThemeProvider'

interface Settings {
  theme?: 'light' | 'dark' | 'system'
  noteTags: string[]
  hiddenStoryFeeds: string[]
}

interface StoryFeed {
  name: string
  filename: string
  path: string
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<Settings>({
    theme: 'system',
    noteTags: [],
    hiddenStoryFeeds: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [storyFeeds, setStoryFeeds] = useState<StoryFeed[]>([])
  const [loadingFeeds, setLoadingFeeds] = useState(false)

  // Input state for new tags
  const [newNoteTag, setNewNoteTag] = useState('')

  useEffect(() => {
    if (session) {
      fetchSettings()
      fetchStoryFeeds()
    }
  }, [session])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStoryFeeds = async () => {
    setLoadingFeeds(true)
    try {
      const response = await fetch('/api/story-feeds')
      if (response.ok) {
        const data = await response.json()
        setStoryFeeds(data)
      }
    } catch (error) {
      console.error('Failed to fetch story feeds:', error)
    } finally {
      setLoadingFeeds(false)
    }
  }

  const toggleFeedVisibility = (feedName: string) => {
    const isCurrentlyHidden = settings.hiddenStoryFeeds.includes(feedName)
    const newHiddenFeeds = isCurrentlyHidden
      ? settings.hiddenStoryFeeds.filter(f => f !== feedName)
      : [...settings.hiddenStoryFeeds, feedName]

    setSettings({
      ...settings,
      hiddenStoryFeeds: newHiddenFeeds
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          theme // Include current theme from ThemeProvider
        })
      })

      if (response.ok) {
        alert('Settings saved successfully!')
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const addTag = (tag: string) => {
    if (!tag.trim()) return

    if (!settings.noteTags.includes(tag.trim())) {
      setSettings({
        ...settings,
        noteTags: [...settings.noteTags, tag.trim()]
      })
    }

    setNewNoteTag('')
  }

  const removeTag = (tag: string) => {
    setSettings({
      ...settings,
      noteTags: settings.noteTags.filter(t => t !== tag)
    })
  }

  if (!session) {
    return <div>Please sign in</div>
  }

  if (loading) {
    return <div>Loading settings...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your predefined tags for notes and story feeds
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>
              Choose your preferred color theme matching drewsiph.dev
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                  theme === 'light'
                    ? 'border-primary bg-accent'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <Sun className="h-8 w-8" />
                <span className="font-medium">Light</span>
                <span className="text-xs text-muted-foreground text-center">
                  Warm off-white with coral accents
                </span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                  theme === 'dark'
                    ? 'border-primary bg-accent'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <Moon className="h-8 w-8" />
                <span className="font-medium">Dark</span>
                <span className="text-xs text-muted-foreground text-center">
                  Deep teal with sage accents
                </span>
              </button>

              <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                  theme === 'system'
                    ? 'border-primary bg-accent'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <Monitor className="h-8 w-8" />
                <span className="font-medium">System</span>
                <span className="text-xs text-muted-foreground text-center">
                  Match device preference
                </span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Note Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Note Tags</CardTitle>
            <CardDescription>
              Manage predefined tags for notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag"
                value={newNoteTag}
                onChange={(e) => setNewNoteTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTag(newNoteTag)
                  }
                }}
              />
              <Button onClick={() => addTag(newNoteTag)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.noteTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
              {settings.noteTags.length === 0 && (
                <p className="text-sm text-muted-foreground">No tags defined yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Story Feeds */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Story Feeds</CardTitle>
                <CardDescription>
                  Control which story feeds are visible on your site
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStoryFeeds}
                disabled={loadingFeeds}
              >
                {loadingFeeds ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingFeeds ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading story feeds...
              </div>
            ) : storyFeeds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No story feeds found. Create feed files in your repository's /feeds/ directory.
              </div>
            ) : (
              <div className="space-y-2">
                {storyFeeds.map((feed) => {
                  const isHidden = settings.hiddenStoryFeeds.includes(feed.name)
                  return (
                    <div
                      key={feed.name}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{feed.name}</div>
                        <div className="text-sm text-muted-foreground">{feed.filename}</div>
                        {isHidden && (
                          <div className="text-xs text-red-600 mt-1">
                            Hidden from site
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`feed-${feed.name}`} className="text-sm">
                          {isHidden ? 'Hidden' : 'Visible'}
                        </Label>
                        <Switch
                          id={`feed-${feed.name}`}
                          checked={!isHidden}
                          onCheckedChange={() => toggleFeedVisibility(feed.name)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
