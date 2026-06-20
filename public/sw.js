const CACHE_VERSION = 'scholr-v1.1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Pages to cache for offline
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('scholr-') && k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and API calls (always need fresh data)
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/_next/webpack')) return;

  // For navigation requests — network first, cache fallback, offline page fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then(c => c.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match('/offline');
        })
    );
    return;
  }

  // For static assets — cache first, network fallback
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icon-')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(c => c.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Default — network with dynamic cache
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then(c => c.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Scholr', {
      body: data.body || 'You have a class coming up!',
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      tag: data.tag || 'scholr',
      data: data.url ? { url: data.url } : {},
      actions: data.actions || [],
    })
  );
});

// Notification click — open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
