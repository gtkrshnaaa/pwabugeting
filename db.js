// ===== ./db.js =====
// db.js - Skema Database Baru untuk Pelacakan Pengeluaran

const DB_NAME = 'PWABudgetingDB-v2';
const DB_VERSION = 1;
const STORES = {
    CONFIG: 'config',
    CATEGORIES: 'categories',
    EXPENSES: 'expenses'
};

let db;

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

// --- Fungsi Config ---
async function setConfig(key, value) { return (await initDB()).put(STORES.CONFIG, { key, value }); }
async function getConfig(key) {
    const result = await (await initDB()).get(STORES.CONFIG, key);
    return result ? result.value : null;
}

// --- Fungsi Categories ---
async function clearCategories() { return (await initDB()).clear(STORES.CATEGORIES); }
async function addCategory(category) { return (await initDB()).add(STORES.CATEGORIES, category); }
async function getCategories() { return (await initDB()).getAll(STORES.CATEGORIES); }
async function updateCategory(category) { return (await initDB()).put(STORES.CATEGORIES, category); }
async function deleteCategory(id) { return (await initDB()).delete(STORES.CATEGORIES, id); }


// --- Fungsi Expenses ---
async function addExpense(expense) { return (await initDB()).add(STORES.EXPENSES, expense); }
async function getExpenses() { return (await initDB()).getAllFromIndex(STORES.EXPENSES, 'by_date'); }
async function getExpensesByCategoryId(categoryId) { return (await initDB()).getAllFromIndex(STORES.EXPENSES, 'by_category', categoryId); }


// --- FUNGSI RESET BARU ---
/**
 * Menghapus semua data dari semua object store.
 */
async function resetDatabase() {
    const db = await initDB();
    return Promise.all([
        db.clear(STORES.CONFIG),
        db.clear(STORES.CATEGORIES),
        db.clear(STORES.EXPENSES)
    ]);
}