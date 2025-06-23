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
// Strategi: Network First, Fallback to Cache.
self.addEventListener('fetch', event => {
    // Abaikan request selain GET
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        // Coba ambil dari jaringan terlebih dahulu
        fetch(event.request).catch(() => {
            // Jika gagal (misalnya, offline), cari di dalam cache.
            return caches.match(event.request);
        })
    );
});