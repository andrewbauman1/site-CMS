const CACHE_NAME = 'writer-static-v1'

const STATIC_CACHE_PATTERNS = [
  /^\/_next\/static\//,
  /^\/icons\//,
  /^\/manifest\.webmanifest$/,
  /^\/apple-icon\.png$/,
  /^\/favicon\.ico$/,
]

function isStaticAsset(url) {
  return STATIC_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/')
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add('/offline.html'))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Never cache auth or any other API route — always hit the network.
  if (isApiRequest(url)) {
    return
  }

  // Static assets: cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              cache.put(request, response.clone())
              return response
            })
        )
      )
    )
    return
  }

  // Navigation requests: network-first, falling back to the offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    )
    return
  }
})
