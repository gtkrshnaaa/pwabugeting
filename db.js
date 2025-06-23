// Menggunakan idb, library wrapper untuk IndexedDB: https://github.com/jakearchibald/idb
// Pastikan untuk menyertakan scriptnya di HTML: <script src="https://cdn.jsdelivr.net/npm/idb@7/build/umd.js"></script>

const DB_NAME = 'DompetDamaiDB';
const DB_VERSION = 1;
const STORES = {
    CONFIG: 'config', // Menyimpan pengaturan seperti total budget
    CATEGORIES: 'categories', // Menyimpan daftar kategori anggaran
    TRANSACTIONS: 'transactions' // Menyimpan riwayat pemasukan
};

let db;

// Fungsi untuk menginisialisasi atau membuka database
async function initDB() {
    if (db) return db;

    db = await idb.openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Membuat object store saat pertama kali DB dibuat atau saat ada upgrade versi
            if (!db.objectStoreNames.contains(STORES.CONFIG)) {
                db.createObjectStore(STORES.CONFIG, { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
                db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
                const transactionStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id', autoIncrement: true });
                transactionStore.createIndex('date', 'date');
            }
        },
    });
    console.log('Database initialized successfully.');
    return db;
}

// --- Fungsi untuk Config ---
async function setConfig(key, value) {
    return (await initDB()).put(STORES.CONFIG, { key, value });
}

async function getConfig(key) {
    const result = await (await initDB()).get(STORES.CONFIG, key);
    return result ? result.value : null;
}

// --- Fungsi untuk Categories ---
async function addCategory(category) {
    // category = { name: 'String', target: Number, allocated: Number }
    return (await initDB()).add(STORES.CATEGORIES, category);
}

async function updateCategory(category) {
    return (await initDB()).put(STORES.CATEGORIES, category);
}

async function getCategories() {
    return (await initDB()).getAll(STORES.CATEGORIES);
}

async function getCategoryById(id) {
    return (await initDB()).get(STORES.CATEGORIES, id);
}

// --- Fungsi untuk Transactions ---
async function addTransaction(transaction) {
    // transaction = { amount: Number, date: Date, description: 'String' }
    return (await initDB()).add(STORES.TRANSACTIONS, transaction);
}

async function getTransactions() {
    const tx = (await initDB()).transaction(STORES.TRANSACTIONS, 'readonly');
    const index = tx.store.index('date');
    // Mengambil data urut dari yang terbaru
    return index.getAll(null, undefined, 'prev');
}
