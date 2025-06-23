// db.js - Skema Database Baru untuk Pelacakan Pengeluaran

const DB_NAME = 'DompetDamaiDB-v2';
const DB_VERSION = 1;
const STORES = {
    CONFIG: 'config', // Menyimpan pengaturan: { key: 'totalBudget', value: 5000000 }
    CATEGORIES: 'categories', // Menyimpan kategori: { id, name, limit }
    EXPENSES: 'expenses' // Menyimpan pengeluaran: { id, categoryId, amount, description, date }
};

let db;

// Fungsi untuk menginisialisasi atau membuka database
async function initDB() {
    if (db) return db;

    db = await idb.openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
            console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`);
            
            // Membuat object store yang dibutuhkan
            if (!db.objectStoreNames.contains(STORES.CONFIG)) {
                db.createObjectStore(STORES.CONFIG, { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
                db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(STORES.EXPENSES)) {
                const expenseStore = db.createObjectStore(STORES.EXPENSES, { keyPath: 'id', autoIncrement: true });
                // Buat index untuk mengambil pengeluaran berdasarkan kategori dan tanggal
                expenseStore.createIndex('by_category', 'categoryId');
                expenseStore.createIndex('by_date', 'date');
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
async function clearCategories() {
    return (await initDB()).clear(STORES.CATEGORIES);
}
async function addCategory(category) {
    // category = { name: 'String', limit: Number }
    return (await initDB()).add(STORES.CATEGORIES, category);
}

async function getCategories() {
    return (await initDB()).getAll(STORES.CATEGORIES);
}

// --- Fungsi untuk Expenses ---
async function addExpense(expense) {
    // expense = { categoryId: Number, amount: Number, description: 'String', date: ISOString }
    return (await initDB()).add(STORES.EXPENSES, expense);
}

async function getExpenses() {
    return (await initDB()).getAllFromIndex(STORES.EXPENSES, 'by_date');
}

async function getExpensesByCategoryId(categoryId) {
    return (await initDB()).getAllFromIndex(STORES.EXPENSES, 'by_category', categoryId);
}
