const CACHE_NAME = 'dompet-damai-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/db.js',
    '/utils.js',
    'https://cdn.jsdelivr.net/npm/idb@7/build/umd.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Event: Install
// Caching aset-aset inti aplikasi
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
// Membersihkan cache lama yang tidak terpakai
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
// Menggunakan strategi Cache First untuk aset aplikasi
self.addEventListener('fetch', event => {
    // Hanya tangani request GET
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Jika ada di cache, langsung kembalikan dari cache
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Jika tidak ada di cache, coba ambil dari network
                return fetch(event.request).then(
                    networkResponse => {
                        // Tidak perlu menyimpan response ke cache di sini
                        // karena semua aset penting sudah di-cache saat instalasi
                        return networkResponse;
                    }
                ).catch(() => {
                    // Jika request navigasi (halaman HTML) gagal,
                    // kembalikan index.html sebagai fallback (untuk SPA)
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});
