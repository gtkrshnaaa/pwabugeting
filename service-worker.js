// service-worker.js
const CACHE_NAME = 'dompet-damai-cache-v10'; // Diubah ke v10
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css', // Memastikan style.css di-cache
    './db.js',
    './app.js',
    './utils.js',
    './manifest.json',
    'https://cdn.jsdelivr.net/npm/idb@7/build/umd.js',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
    'https://fonts.gstatic.com', // Penting untuk cache font dari Google
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

// Event: Install
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching essential assets.');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
    self.skipWaiting();
});

// Event: Activate
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Event: Fetch
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then(networkResponse => {
                        return caches.open(CACHE_NAME).then(cache => {
                            if (networkResponse.ok || networkResponse.type === 'opaque') {
                                cache.put(event.request, networkResponse.clone());
                            }
                            return networkResponse;
                        });
                    })
                    .catch(error => {
                        console.log('Fetch failed, and no cache entry found for:', event.request.url, error);
                    });
            })
    );
});