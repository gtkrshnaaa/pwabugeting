const BASE = '/pwa';
const CACHE_NAME = 'pwa-revalidate-v1';
const ASSETS_TO_CACHE = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/style.css`,
  `${BASE}/app.js`,
  `${BASE}/offline.html`
];

// Cache asset saat install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Bersihkan cache lama saat activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Tangani fetch dan fallback ke offline.html
self.addEventListener('fetch', event => {
  // Abaikan request non-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Update cache dengan response terbaru
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse.clone();
      })
      .catch(async () => {
        const cache = await caches.open(CACHE_NAME);

        // Fallback ke offline.html kalau request HTML
        const acceptHeader = event.request.headers.get('accept') || '';
        if (acceptHeader.includes('text/html')) {
          return cache.match(`${BASE}/offline.html`);
        }

        // Kalau bukan HTML, coba cari file yang cocok di cache
        return cache.match(event.request);
      })
  );
});
