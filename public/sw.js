
const CACHE_NAME = 'zeitScan-v2';
const urlsToCache = [
  '/',
  '/offline.html',
];

// Install: Cache essential files
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Gracefully handle if offline or files don't exist
        console.log('[Service Worker] Cache addAll partially failed');
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Implement network-first strategy with fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST to /api/checkout etc.)
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip API calls entirely — let them go straight to network
  // API routes should never be cached by the SW, especially POST-heavy ones like /api/checkout
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Static assets: Cache first, fallback to network
  if (/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          // Clone BEFORE consuming
          if (networkResponse.ok) {
            const cloned = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cloned);
            });
          }
          return networkResponse;
        }).catch(() => {
          return new Response('Resource not available offline', { status: 503 });
        });
      })
    );
    return;
  }

  // HTML pages: Network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Clone BEFORE consuming
        if (networkResponse.ok) {
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cloned);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Redirect to offline page if available
          return caches.match('/offline.html').then((offlinePage) => {
            if (offlinePage) return offlinePage;
            return new Response('Offline - page not available', { status: 503 });
          });
        });
      })
  );
});
