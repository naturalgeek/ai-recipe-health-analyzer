const CACHE_NAME = 'ai-recipe-analyzer-v1';
const STATIC_ASSETS = [
  '/ai-recipe-health-analyzer/',
  '/ai-recipe-health-analyzer/index.html',
  '/ai-recipe-health-analyzer/icon.svg',
  '/ai-recipe-health-analyzer/icon-192.png',
  '/ai-recipe-health-analyzer/icon-512.png',
  '/ai-recipe-health-analyzer/manifest.json'
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests and API calls
  if (request.method !== 'GET' || request.url.includes('api.openai.com') || request.url.includes('api.allorigins.win')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // For navigation requests, return the cached index.html
          if (request.mode === 'navigate') {
            return caches.match('/ai-recipe-health-analyzer/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
