// service-worker.js
const CACHE_NAME = 'dompet-damai-cache-v6';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './db.js',
    './app.js',
    './utils.js', // Memastikan utils.js di-cache
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/idb@7/build/umd.js',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

// Event: Install
// Menyimpan semua aset penting ke dalam cache saat service worker diinstal.
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching essential assets.');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
    self.skipWaiting(); // Memaksa service worker baru untuk aktif segera.
});

// Event: Activate
// Membersihkan cache lama yang sudah tidak terpakai.
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
    return self.clients.claim(); // Mengambil kontrol halaman yang terbuka.
});

// Event: Fetch
// Menentukan bagaimana aplikasi merespon permintaan jaringan.
// Strategi: Cache First, Fallback to Network.
self.addEventListener('fetch', event => {
    // Abaikan request selain GET
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request) // Coba ambil dari cache dulu
            .then(response => {
                // Jika ada di cache, langsung kembalikan
                if (response) {
                    return response;
                }
                // Jika tidak ada di cache, coba dari jaringan
                return fetch(event.request)
                    .then(networkResponse => {
                        // Dan simpan ke cache untuk penggunaan selanjutnya
                        return caches.open(CACHE_NAME).then(cache => {
                            // Penting: Jangan cache request POST atau opaque responses
                            if (networkResponse.ok || networkResponse.type === 'opaque') {
                                cache.put(event.request, networkResponse.clone());
                            }
                            return networkResponse;
                        });
                    })
                    .catch(error => {
                        console.log('Fetch failed, and no cache entry found:', error);
                        // Master bisa menampilkan halaman offline khusus di sini
                        // return caches.match('/offline.html'); // Jika Master punya halaman offline.html
                    });
            })
    );
});