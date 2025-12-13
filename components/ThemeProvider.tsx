'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Fetch user's theme preference from settings
  useEffect(() => {
    if (session) {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data.theme) {
            setThemeState(data.theme as Theme)
          }
        })
        .catch(err => console.error('Failed to fetch theme:', err))
    }
  }, [session])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const activeTheme = theme === 'system' ? systemTheme : theme

    setResolvedTheme(activeTheme)

    // Remove both classes first
    root.classList.remove('light', 'dark')

    // Add the active theme class
    root.classList.add(activeTheme)

    // Set data-theme attribute for compatibility with website styles
    root.setAttribute('data-theme', activeTheme)
  }, [theme])

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const systemTheme = mediaQuery.matches ? 'dark' : 'light'
      setResolvedTheme(systemTheme)
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(systemTheme)
      document.documentElement.setAttribute('data-theme', systemTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)

    // Save to database if user is logged in
    if (session) {
      try {
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: newTheme })
        })
      } catch (err) {
        console.error('Failed to save theme:', err)
      }
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
