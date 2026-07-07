import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'drewsiph.dev — Writer',
    short_name: 'Writer',
    description: 'Content management system for drewsiph.dev',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F2EFE9',
    theme_color: '#F2EFE9',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
