// Duty service worker — network-first for HTML, notifications, auto-update
const CACHE_NAME = 'duty-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // HTML navigation requests: always go to network first
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          // Cache a copy for offline fallback
          const clone = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone))
          return res
        })
        .catch(() => caches.match(e.request))
    )
    return
  }

  // Hashed assets (Vite adds hashes to filenames): cache-first since the hash changes on rebuild
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(e.request).then((cached) =>
        cached || fetch(e.request).then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone))
          return res
        })
      )
    )
    return
  }

  // Everything else (manifest, icons, fonts, sw.js itself): network-first
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone))
        return res
      })
      .catch(() => caches.match(e.request))
  )
})

// Web Push: server pushes a JSON payload with { kind, title, body, url, badge }.
self.addEventListener('push', (e) => {
  let data = {}
  try { data = e.data ? e.data.json() : {} } catch { data = {} }
  const title = data.title || 'Duty'
  const opts = {
    body: data.body || '',
    icon: '/apple-touch-icon.png',
    badge: '/apple-touch-icon.png',
    tag: data.kind || 'duty',
    data: { url: data.url || '/', badge: data.badge },
    renotify: false,
  }
  e.waitUntil(
    self.registration.showNotification(title, opts).then(() => {
      if ('setAppBadge' in self.navigator && typeof data.badge === 'number') {
        try { self.navigator.setAppBadge(data.badge) } catch {}
      }
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const target = (e.notification.data && e.notification.data.url) || '/'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ('focus' in c) {
          c.focus()
          if ('navigate' in c) c.navigate(target).catch(() => {})
          return
        }
      }
      return self.clients.openWindow(target)
    })
  )
})

// Listen for skip-waiting message from the app
self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting()
})
