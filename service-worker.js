// service-worker.js
const CACHE_NAME = 'pwabudgeting-cache-v11'; 
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './db.js',
    './app.js',
    './utils.js',
    './manifest.json',
    'https://cdn.jsdelivr.net/npm/idb@7/build/umd.js',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
    // 'https://fonts.gstatic.com' <<< DIHAPUS dari daftar ini
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
                // Jika ada di cache, kembalikan dari cache
                if (response) {
                    return response;
                }
            
                // Jika tidak ada, coba ambil dari jaringan
                return fetch(event.request)
                    .then(networkResponse => {
                        // Buka cache dan simpan response dari jaringan
                        return caches.open(CACHE_NAME).then(cache => {
                            // Pastikan response valid sebelum di-cache
                            // Ini akan menangkap file font .woff2 dari fonts.gstatic.com
                            if (networkResponse.ok || networkResponse.type === 'opaque') {
                                cache.put(event.request, networkResponse.clone());
                            }
                            return networkResponse;
                        });
                    })
                    .catch(error => {
                        console.log('Fetch failed, and no cache entry found for:', event.request.url, error);
                        // Di sini bisa ditambahkan fallback jika diperlukan
                    });
            })
    );
});