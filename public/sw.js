const CACHE_NAME = 'vapeshop-pos-v2';

const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function isRscRequest(url) {
  return url.searchParams.has('_rsc');
}

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/') || 
         url.pathname.endsWith('.js') || 
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.woff2') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.ico') ||
         url.pathname.endsWith('.json');
}

function isValidResponse(response) {
  return response && response.ok;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isApi = url.pathname.startsWith('/api/');

  // Always network-first for anything except static assets and precached shells
  // API calls, RSC data, page navigations — all hit network first
  if (!isStaticAsset(url) || isApi || isRscRequest(url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (isValidResponse(response)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first only for static assets (JS, CSS, fonts, images)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((response) => {
        if (isValidResponse(response)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
      return cached || fetched;
    })
  );
});
