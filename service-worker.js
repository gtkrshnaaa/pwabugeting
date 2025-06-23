const CACHE_NAME = 'dompet-damai-cache-v3';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './db.js',
    './app.js',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/idb@7/build/umd.js',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
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

// Event: Fetch (Strategi Network First, Fallback to Cache)
self.addEventListener('fetch', event => {
    // Abaikan request non-GET
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        fetch(event.request).catch(() => {
            // Jika network gagal, cari di cache
            return caches.match(event.request);
        })
    );
});
