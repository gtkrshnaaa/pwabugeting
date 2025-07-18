# **Dokumentasi Teknis Aplikasi Budgeting PWA**

Dokumentasi ini memberikan gambaran umum mengenai arsitektur, struktur file, dan logika fungsional dari aplikasi **Budgeting PWA**. Aplikasi ini dirancang sebagai sebuah *Progressive Web App* (PWA) yang sederhana untuk membantu pengguna melakukan pencatatan dan pengelolaan anggaran pribadi. Salah satu keunggulan utamanya adalah kemampuan untuk beroperasi secara luring (*offline-first*) berkat implementasi Service Worker dan IndexedDB.

-----

## 1\. Fitur Utama

Aplikasi ini menyediakan serangkaian fitur esensial untuk pengelolaan anggaran, antara lain:

  * **Pengaturan Anggaran & Kategori**: Pengguna dapat menetapkan total anggaran bulanan dan membuat beberapa kategori pengeluaran dengan alokasi limit masing-masing.
  * **Pencatatan Pengeluaran**: Memungkinkan pencatatan transaksi pengeluaran baru dengan memilih kategori dan menambahkan deskripsi opsional.
  * **Ringkasan Visual**: Menampilkan ringkasan dana (total anggaran, terpakai, dan sisa) serta visualisasi progres pengeluaran per kategori menggunakan *progress bar*.
  * **Riwayat Transaksi**: Menyajikan daftar riwayat pengeluaran terbaru untuk memudahkan pemantauan.
  * **Fungsionalitas Luring**: Aplikasi dapat diakses dan digunakan sepenuhnya tanpa koneksi internet setelah pemuatan pertama.
  * **Ekspor Data**: Menyediakan opsi untuk mencadangkan data dalam format JSON (data lengkap) dan CSV (riwayat pengeluaran).
  * **Instalasi PWA**: Dapat dipasang di layar utama perangkat (desktop atau mobile) untuk pengalaman yang menyerupai aplikasi native.
  * **Reset Data**: Opsi untuk menghapus seluruh data yang tersimpan di perangkat pengguna secara aman.

-----

## 2\. Struktur Proyek

Struktur file proyek diorganisir untuk memisahkan antara struktur (HTML), gaya (CSS), dan logika (JavaScript), sehingga memudahkan pemeliharaan.

  * `index.html`: Berkas utama yang mendefinisikan seluruh struktur antarmuka pengguna (UI), termasuk *card*, *section*, dan *modal*.
  * `style.css`: Berkas yang berisi semua aturan *styling* untuk aplikasi. Gaya ini ditulis dalam CSS murni yang mereplikasi desain berbasis utilitas (mirip Tailwind CSS).
  * `app.js`: Inti dari logika aplikasi. Berkas ini bertanggung jawab untuk menangani interaksi pengguna (event listeners), memanipulasi DOM, merender data, dan mengelola alur kerja modal.
  * `db.js`: Lapisan abstraksi data yang mengelola semua operasi basis data dengan IndexedDB. Berkas ini menyediakan fungsi-fungsi asinkron untuk menyimpan, mengambil, memperbarui, dan menghapus data.
  * `utils.js`: Berisi fungsi-fungsi pembantu (*helper functions*) yang bersifat umum, seperti pemformatan mata uang (`formatCurrency`) dan logika ekspor data ke JSON/CSV.
  * `service-worker.js`: Mengimplementasikan fungsionalitas PWA. Skrip ini bertanggung jawab untuk *caching* aset statis dan menangani permintaan jaringan, yang memungkinkan aplikasi bekerja secara luring.
  * `manifest.json`: Berkas konfigurasi PWA yang mendefinisikan metadata aplikasi seperti nama, ikon, warna tema, dan perilaku tampilan.
  * `/icons/`: Direktori yang berisi berbagai ukuran ikon aplikasi yang digunakan oleh `manifest.json`.

-----

## 3\. Struktur Direktori Proyek

Visualisasi struktur direktori dan file dalam proyek adalah sebagai berikut:

```
.
├── icons/
│   ├── icon-48x48.png
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-256x256.png
│   ├── icon-384x384.png
│   └── icon-512x512.png
├── .gitignore
├── app.js
├── db.js
├── index.html
├── index-tailwind-old.html
├── listing.txt
├── makefile
├── manifest.json
├── service-worker.js
├── style.css
└── utils.js
```

-----

## 4\. Arsitektur & Logika Aplikasi

Aplikasi ini dibangun dengan arsitektur sisi klien (*client-side*) yang mengandalkan JavaScript murni dan teknologi peramban modern.

### 4.1. Manajemen Data (`db.js`)

Penyimpanan data persisten di sisi klien ditangani oleh **IndexedDB**. Untuk menyederhanakan interaksi, aplikasi ini menggunakan *library wrapper* `idb`.

  * **Skema Basis Data**: Basis data `PWABudgetingDB-v2` memiliki tiga *object stores*: `config`, `categories`, dan `expenses`. Setiap *store* memiliki skema yang dirancang untuk menyimpan datanya masing-masing secara efisien, dengan indeks pada `expenses` untuk mempercepat kueri.
  * **Fungsi CRUD**: `db.js` menyediakan antarmuka asinkron yang jelas untuk melakukan operasi *Create, Read, Update, Delete* (CRUD) pada setiap *object store*.

### 4.2. Logika Utama (`app.js`)

Berkas ini berperan sebagai *controller* utama yang menghubungkan data dari `db.js` dengan antarmuka di `index.html`.

  * **Inisialisasi**: Saat `DOMContentLoaded`, skrip akan memasang semua *event listener* yang diperlukan dan memanggil fungsi `renderUI()` untuk pertama kalinya.
  * **Rendering UI**: Fungsi `renderUI()` adalah fungsi orkestrator yang memanggil fungsi-fungsi render spesifik secara berurutan: `renderSummary()`, `renderCategories()`, dan `renderExpenseHistory()`.
  * **Manajemen Modal**: Logika `showModal()` dan `hideModal()` mengelola visibilitas dan transisi animasi modal.
  * **Penanganan Formulir**: Fungsi `handleSetupForm()` dan `handleExpenseForm()` menangani event `submit`, melakukan validasi, memanggil fungsi dari `db.js` untuk menyimpan data, dan memicu `renderUI()` untuk merefleksikan perubahan.

### 4.3. Fungsionalitas Luring (`service-worker.js`)

Service Worker adalah kunci dari kemampuan luring aplikasi. Aplikasi ini menggunakan strategi **cache-first**, di mana setiap permintaan akan dicek ke *cache* terlebih dahulu sebelum mencoba mengambil dari jaringan.

-----

## 5\. Kutipan Kode Penting

Berikut adalah beberapa kutipan kode yang paling representatif dari fungsionalitas inti aplikasi.

### 5.1. Inisialisasi Database (`db.js`)

Fungsi `initDB` ini merupakan fondasi dari lapisan data. Fungsi ini membuka koneksi ke IndexedDB dan membuat skema (*object stores* dan *indexes*) jika basis data belum ada atau saat versi diperbarui.

```javascript
async function initDB() {
    if (db) return db;

    db = await idb.openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORES.CONFIG)) {
                db.createObjectStore(STORES.CONFIG, { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
                db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(STORES.EXPENSES)) {
                const expenseStore = db.createObjectStore(STORES.EXPENSES, { keyPath: 'id', autoIncrement: true });
                expenseStore.createIndex('by_category', 'categoryId');
                expenseStore.createIndex('by_date', 'date');
            }
        },
    });
    console.log('Database initialized successfully.');
    return db;
}
```

### 5.2. Proses Render UI Utama (`app.js`)

Fungsi `renderUI` adalah orkestrator utama untuk pembaruan tampilan. Fungsi ini memastikan bahwa semua bagian dari antarmuka pengguna (ringkasan, kategori, riwayat) diperbarui secara sinkron setelah ada perubahan data.

```javascript
async function renderUI() {
    await renderSummary();
    await renderCategories();
    await renderExpenseHistory();
    await populateCategoryDropdown();
    checkIfInitialSetupNeeded();
}
```

### 5.3. Penanganan Formulir Setup (`app.js`)

Fungsi `handleSetupForm` menunjukkan alur kerja yang kompleks: membaca beberapa input dari formulir, melakukan validasi (total limit kategori tidak boleh melebihi total anggaran), melakukan operasi *batch* ke basis data (memperbarui, menambah, dan menghapus kategori), lalu akhirnya menyegarkan UI.

```javascript
async function handleSetupForm(e) {
    e.preventDefault();
    const totalBudget = parseFloat(document.getElementById('total-budget').value);
    // ... validasi input ...

    const categoryEntries = document.querySelectorAll('.category-entry');
    // ... validasi total limit kategori ...

    await setConfig('totalBudget', totalBudget);

    const originalCategories = await getCategories();
    const formCategoryIds = [];

    for (const entry of categoryEntries) {
        const id = entry.dataset.id ? parseInt(entry.dataset.id, 10) : null;
        // ... ambil nama dan limit dari input ...
        if (name && !isNaN(limit) && limit > 0) {
            if (id) {
                await updateCategory({ id, name, limit });
                formCategoryIds.push(id);
            } else {
                await addCategory({ name, limit });
            }
        }
    }
    
    // Logika untuk menghapus kategori yang tidak ada lagi di form
    const deletedIds = originalCategoryIds.map(cat => cat.id).filter(id => !formCategoryIds.includes(id));
    for (const id of deletedIds) {
        await deleteCategory(id);
    }

    closeAllModals();
    await renderUI();
}
```

### 5.4. Strategi Cache Service Worker (`service-worker.js`)

Event listener untuk `fetch` ini adalah inti dari fungsionalitas luring. Kode ini mencegat setiap permintaan `GET`, mencoba melayaninya dari *cache* terlebih dahulu. Jika gagal, ia akan mengambil dari jaringan, lalu menyimpan respons tersebut ke dalam *cache* untuk penggunaan di masa depan.

```javascript
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
                            if (networkResponse.ok || networkResponse.type === 'opaque') {
                                cache.put(event.request, networkResponse.clone());
                            }
                            return networkResponse;
                        });
                    });
            })
    );
});
```

-----

## 6\. Antarmuka Pengguna (UI)

Antarmuka pengguna dirancang agar bersih, responsif, dan intuitif menggunakan HTML semantik dan CSS murni. Desainnya bersifat *mobile-first*, memastikan pengalaman pengguna yang baik di berbagai ukuran layar.

* **Struktur HTML**: `index.html` menggunakan tag HTML semantik untuk mendefinisikan struktur halaman, seperti `<header>`, `<main>`, dan `<section>`. Komponen utama seperti ringkasan, daftar kategori, riwayat, dan modal memiliki `id` yang jelas untuk memudahkan manipulasi DOM oleh `app.js`.
* **Styling**: `style.css` mendefinisikan seluruh tampilan visual. Meskipun tidak menggunakan *framework* CSS secara langsung, penamaan kelas dan struktur gayanya terinspirasi oleh pendekatan utilitas seperti Tailwind CSS. Ini menghasilkan CSS yang terorganisir dan modular, dengan penggunaan variabel CSS (`:root`) untuk tema warna yang konsisten.
* **Responsivitas**: Desain aplikasi bersifat *mobile-first* dan responsif, memastikan pengalaman pengguna yang baik di berbagai ukuran layar.