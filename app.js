// app.js - Logika Utama Aplikasi Budgeting (Versi Performa Ditingkatkan)

document.addEventListener('DOMContentLoaded', () => {
    // --- Seleksi Elemen DOM ---
    const setupButton = document.getElementById('setup-button');
    const addExpenseButton = document.getElementById('add-expense-button');
    const setupModal = document.getElementById('setup-modal');
    const expenseModal = document.getElementById('expense-modal');
    const confirmResetModal = document.getElementById('confirm-reset-modal');
    const modalOverlay = document.getElementById('modal-overlay');

    // Form
    const setupForm = document.getElementById('setup-form');
    const expenseForm = document.getElementById('expense-form');
    
    // Tombol Modal
    const closeSetupModalBtn = document.getElementById('close-setup-modal');
    const closeExpenseModalBtn = document.getElementById('close-expense-modal');
    const addCategoryFieldBtn = document.getElementById('add-category-field-button');
    
    // Tombol Aksi
    const resetDataBtn = document.getElementById('reset-data-button');
    const cancelResetBtn = document.getElementById('cancel-reset-btn');
    const confirmResetBtn = document.getElementById('confirm-reset-btn');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');

    // --- Event Listeners ---
    setupButton.addEventListener('click', openSetupModal);
    addExpenseButton.addEventListener('click', () => showModal(expenseModal));
    
    [closeSetupModalBtn, closeExpenseModalBtn, modalOverlay, cancelResetBtn].forEach(el => {
        el.addEventListener('click', () => {
            hideModal(setupModal);
            hideModal(expenseModal);
            hideModal(confirmResetModal);
        });
    });

    addCategoryFieldBtn.addEventListener('click', () => createCategoryInput());
    setupForm.addEventListener('submit', handleSetupForm);
    expenseForm.addEventListener('submit', handleExpenseForm);
    
    resetDataBtn.addEventListener('click', () => {
        hideModal(setupModal);
        showModal(confirmResetModal);
    });
    confirmResetBtn.addEventListener('click', handleDataReset);

    exportJsonBtn.addEventListener('click', exportToJSON);
    exportCsvBtn.addEventListener('click', exportToCSV);
    
    // --- Inisialisasi ---
    registerServiceWorker();
    initPwaInstall();
    renderUI();
});

/**
 * OPTIMASI PERFORMA UTAMA
 * Fungsi ini mengambil semua data yang diperlukan dari database secara bersamaan.
 * Data tersebut kemudian diteruskan ke fungsi-fungsi render sebagai argumen,
 * sehingga menghindari query berulang di setiap fungsi render.
 */
async function renderUI() {
    const [limit, categories, expenses] = await Promise.all([
        getConfig('totalBudget'),
        getCategories(),
        getExpenses()
    ]);

    renderSummary(limit, expenses);
    renderCategories(categories, expenses);
    renderExpenseHistory(categories, expenses);
    populateCategoryDropdown(categories);
    checkIfInitialSetupNeeded(limit);
}

// Menerima data sebagai argumen, tidak melakukan query sendiri
function renderSummary(limit = 0, allExpenses = []) {
    const spent = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = limit - spent;
    
    document.getElementById('summary-limit').textContent = formatCurrency(limit);
    document.getElementById('summary-spent').textContent = formatCurrency(spent);
    document.getElementById('summary-remaining').textContent = formatCurrency(remaining);
}

// Menerima data sebagai argumen, tidak melakukan query di dalam loop
function renderCategories(categories = [], allExpenses = []) {
    const categoryListEl = document.getElementById('category-list');
    if (categories.length === 0) {
        categoryListEl.innerHTML = `<p class="text-center text-gray-500 text-sm">Belum ada kategori. Klik 'Atur' untuk memulai.</p>`;
        return;
    }

    const spentByCategory = new Map();
    for (const expense of allExpenses) {
        const currentSpent = spentByCategory.get(expense.categoryId) || 0;
        spentByCategory.set(expense.categoryId, currentSpent + expense.amount);
    }

    categoryListEl.innerHTML = '';
    for (const cat of categories) {
        const spentOnCat = spentByCategory.get(cat.id) || 0;
        const progress = cat.limit > 0 ? (spentOnCat / cat.limit) * 100 : 0;
        const item = document.createElement('div');
        item.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="font-semibold text-gray-700">${cat.name}</span>
                <span class="text-sm text-gray-500">${formatCurrency(spentOnCat)} / ${formatCurrency(cat.limit)}</span>
            </div>
            <div class="w-full bg-violet-100 rounded-full h-2.5">
                <div class="bg-gradient-to-r from-purple-300 to-violet-500 h-2.5 rounded-full" style="width: ${Math.min(100, progress)}%"></div>
            </div>`;
        categoryListEl.appendChild(item);
    }
}

function renderExpenseHistory(categories = [], expenses = []) {
    const historyEl = document.getElementById('expense-history');
    const reversedExpenses = [...expenses].reverse();

    if (reversedExpenses.length === 0) {
        historyEl.innerHTML = `<p class="text-center text-gray-500 text-sm">Belum ada pengeluaran.</p>`;
        return;
    }

    historyEl.innerHTML = '';
    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
    
    reversedExpenses.slice(0, 15).forEach(exp => {
        const item = document.createElement('div');
        item.className = "flex justify-between items-center text-sm";
        item.innerHTML = `
            <div>
                <p class="font-semibold">${exp.description || 'Pengeluaran'}</p>
                <p class="text-xs text-gray-500">${categoryMap.get(exp.categoryId) || 'Lainnya'}</p>
            </div>
            <span class="font-semibold text-red-500">${formatCurrency(exp.amount)}</span>`;
        historyEl.appendChild(item);
    });
}

// --- Fungsi Modal & Form ---
function showModal(modalEl) {
    const modalContent = modalEl.querySelector('div');
    document.getElementById('modal-overlay').classList.remove('hidden');
    modalEl.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function hideModal(modalEl) {
    const modalContent = modalEl.querySelector('div');
    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
         modalEl.classList.add('hidden');
         if (modalEl.id === 'confirm-reset-modal') {
             document.getElementById('modal-overlay').classList.add('hidden');
         }
    }, 200);
}

async function openSetupModal() {
    const totalBudgetInput = document.getElementById('total-budget');
    const categoryFieldsContainer = document.getElementById('category-fields');
    
    const currentBudget = await getConfig('totalBudget');
    const currentCategories = await getCategories();

    totalBudgetInput.value = currentBudget || '';
    categoryFieldsContainer.innerHTML = '';
    if (currentCategories.length > 0) {
        currentCategories.forEach(cat => createCategoryInput(cat.name, cat.limit));
    } else {
        createCategoryInput(); // Buat satu field kosong jika belum ada kategori
    }

    showModal(document.getElementById('setup-modal'));
}

function createCategoryInput(name = '', limit = '') {
    const container = document.getElementById('category-fields');
    const fieldWrapper = document.createElement('div');
    fieldWrapper.className = 'flex gap-2 items-center';
    fieldWrapper.innerHTML = `
        <input type="text" name="category_name" class="w-2/3 p-2 border border-violet-200 rounded-lg" placeholder="Nama Kategori" value="${name}" required>
        <input type="number" name="category_limit" class="w-1/3 p-2 border border-violet-200 rounded-lg" placeholder="Limit" value="${limit}" required>
        <button type="button" class="text-red-500 remove-cat-btn p-1">&times;</button>`;
    container.appendChild(fieldWrapper);
    fieldWrapper.querySelector('.remove-cat-btn').addEventListener('click', () => fieldWrapper.remove());
}

async function handleSetupForm(e) {
    e.preventDefault();
    const totalBudget = parseFloat(document.getElementById('total-budget').value);
    if (isNaN(totalBudget) || totalBudget < 0) {
        alert('Total anggaran harus diisi dengan angka yang valid.');
        return;
    }
    const categoryNames = document.querySelectorAll('input[name="category_name"]');
    const categoryLimits = document.querySelectorAll('input[name="category_limit"]');
    let totalLimit = 0;
    const categories = [];
    for (let i = 0; i < categoryNames.length; i++) {
        const name = categoryNames[i].value.trim();
        const limit = parseFloat(categoryLimits[i].value);
        if (name && !isNaN(limit) && limit > 0) {
            totalLimit += limit;
            categories.push({ name, limit });
        }
    }
    if (totalLimit > totalBudget) {
        alert('Total limit kategori tidak boleh melebihi total anggaran bulanan!');
        return;
    }
    await setConfig('totalBudget', totalBudget);
    await clearCategories();
    for (const cat of categories) { await addCategory(cat); }
    hideModal(document.getElementById('setup-modal'));
    await renderUI();
}

async function handleExpenseForm(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const categoryId = parseInt(document.getElementById('expense-category').value, 10);
    const description = document.getElementById('expense-desc').value.trim();
    if (isNaN(amount) || amount <= 0 || isNaN(categoryId)) {
        alert('Mohon isi jumlah dan kategori dengan benar.');
        return;
    }
    await addExpense({ amount, categoryId, description, date: new Date().toISOString() });
    document.getElementById('expense-form').reset();
    hideModal(document.getElementById('expense-modal'));
    await renderUI();
}

async function handleDataReset() {
    await resetDatabase();
    hideModal(document.getElementById('confirm-reset-modal'));
    await renderUI();
}

// --- Fungsi Bantuan & PWA ---
function checkIfInitialSetupNeeded(budget) {
    if (budget === null) {
        openSetupModal();
        document.getElementById('close-setup-modal').classList.add('hidden');
    } else {
        document.getElementById('close-setup-modal').classList.remove('hidden');
    }
}

function populateCategoryDropdown(categories = []) {
    const selectEl = document.getElementById('expense-category');
    selectEl.innerHTML = '<option value="" disabled selected>Pilih kategori...</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        selectEl.appendChild(option);
    });
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(reg => console.log('Service Worker terdaftar.', reg))
                .catch(err => console.error('Gagal mendaftarkan Service Worker:', err));
        });
    }
}
let deferredPrompt;
function initPwaInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const installContainer = document.getElementById('install-container');
        installContainer.innerHTML = '';
        const installButton = document.createElement('button');
        installButton.textContent = 'Pasang Aplikasi Dompet Damai';
        installButton.className = 'px-4 py-2 bg-violet-500 text-white font-semibold rounded-lg shadow-md hover:bg-violet-600 transition';
        installContainer.appendChild(installButton);
        installButton.addEventListener('click', () => {
            installButton.style.display = 'none';
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
        });
    });
}
