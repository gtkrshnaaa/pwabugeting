// service-worker.js

const CACHE_NAME = 'dompet-damai-v1.1'; // Naikkan versi cache
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './db.js',
    './utils.js',
    'https://cdn.jsdelivr.net/npm/idb@7/build/umd.js',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

// Event: Install
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching files');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch(err => {
                console.error('Gagal membuka cache', err);
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
                        console.log('Service Worker: Menghapus cache lama', cache);
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
            .then(cachedResponse => {
                // Jika ada di cache, langsung kembalikan
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Jika tidak, ambil dari network
                return fetch(event.request).catch(() => {
                    // Jika request navigasi HTML gagal, fallback ke index.html
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});