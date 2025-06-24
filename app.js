// ===== ./app.js =====
// app.js - Logika Utama Aplikasi Budgeting

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
    
    // Event Listener Terpusat untuk Menutup Modal
    [closeSetupModalBtn, closeExpenseModalBtn, modalOverlay, cancelResetBtn].forEach(el => {
        el.addEventListener('click', closeAllModals);
    });

    addCategoryFieldBtn.addEventListener('click', () => createCategoryInput());
    setupForm.addEventListener('submit', handleSetupForm);
    expenseForm.addEventListener('submit', handleExpenseForm);

    resetDataBtn.addEventListener('click', () => {
        hideModal(setupModal); // Sembunyikan modal setup
        showModal(confirmResetModal); // Tampilkan modal konfirmasi
    });
    confirmResetBtn.addEventListener('click', handleDataReset);

    // Event listener untuk tombol ekspor
    exportJsonBtn.addEventListener('click', exportToJSON);
    exportCsvBtn.addEventListener('click', exportToCSV);

    // --- Inisialisasi ---
    registerServiceWorker();
    initPwaInstall();
    renderUI();
});

// --- Fungsi Utama Render ---
async function renderUI() {
    await renderSummary();
    await renderCategories();
    await renderExpenseHistory();
    await populateCategoryDropdown();
    checkIfInitialSetupNeeded();
}

async function renderSummary() {
    const limit = await getConfig('totalBudget') || 0;
    const allExpenses = await getExpenses();
    const spent = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = limit - spent;

    document.getElementById('summary-limit').textContent = formatCurrency(limit);
    document.getElementById('summary-spent').textContent = formatCurrency(spent);
    document.getElementById('summary-remaining').textContent = formatCurrency(remaining);
}

async function renderCategories() {
    const categoryListEl = document.getElementById('category-list');
    const categories = await getCategories();
    if (categories.length === 0) {
        categoryListEl.innerHTML = `<p class="text-center text-gray-500 text-sm">Belum ada kategori. Klik 'Atur' untuk memulai.</p>`;
        return;
    }
    categoryListEl.innerHTML = '';
    for (const cat of categories) {
        const expensesForCat = await getExpensesByCategoryId(cat.id);
        const spentOnCat = expensesForCat.reduce((sum, exp) => sum + exp.amount, 0);
        const progress = cat.limit > 0 ? (spentOnCat / cat.limit) * 100 : 0;
        const item = document.createElement('div');
        item.className = 'category-item-wrapper';
        item.innerHTML = `
            <div class="category-item-header">
                <span class="category-name">${cat.name}</span>
                <span class="category-amount">${formatCurrency(spentOnCat)} / ${formatCurrency(cat.limit)}</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${Math.min(100, progress)}%"></div>
            </div>`;
        categoryListEl.appendChild(item);
    }
}

async function renderExpenseHistory() {
    const historyEl = document.getElementById('expense-history');
    const expenses = (await getExpenses()).reverse();
    if (expenses.length === 0) {
        historyEl.innerHTML = `<p class="text-center text-gray-500 text-sm">Belum ada pengeluaran.</p>`;
        return;
    }
    historyEl.innerHTML = '';
    const categories = await getCategories();
    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
    expenses.slice(0, 15).forEach(exp => { // Tampilkan 15 terakhir
        const item = document.createElement('div');
        item.className = "expense-item";
        item.innerHTML = `
            <div>
                <p class="expense-description">${exp.description || 'Pengeluaran'}</p>
                <p class="expense-category-name">${categoryMap.get(exp.categoryId) || 'Lainnya'}</p>
            </div>
            <span class="expense-amount-value">${formatCurrency(exp.amount)}</span>`;
        historyEl.appendChild(item);
    });
}

// --- Fungsi Modal & Form ---

function closeAllModals() {
    const overlay = document.getElementById('modal-overlay');
    // Hanya sembunyikan overlay jika ada modal yang aktif
    if (!overlay.classList.contains('hidden')) {
        const activeModals = document.querySelectorAll('.modal:not(.hidden)');
        activeModals.forEach(modal => hideModal(modal));
        // Sembunyikan overlay setelah semua modal selesai transisi
        setTimeout(() => overlay.classList.add('hidden'), 200); // Sesuaikan dengan durasi transisi CSS
    }
}

function showModal(modalEl) {
    document.getElementById('modal-overlay').classList.remove('hidden');
    modalEl.classList.remove('hidden');
    // Tambahkan kelas 'is-active' untuk memulai transisi
    setTimeout(() => { // Beri sedikit delay agar browser menerapkan 'display: block' sebelum transisi
        modalEl.classList.add('is-active');
    }, 10);
}

function hideModal(modalEl) {
    if (!modalEl || modalEl.classList.contains('hidden')) return;

    // Hapus kelas 'is-active' untuk memulai transisi keluar
    modalEl.classList.remove('is-active');
    setTimeout(() => { // Sembunyikan setelah transisi selesai
        modalEl.classList.add('hidden');
    }, 200); // Sesuaikan dengan durasi transisi CSS
}


async function openSetupModal() {
    const totalBudgetInput = document.getElementById('total-budget');
    const categoryFieldsContainer = document.getElementById('category-fields');

    const currentBudget = await getConfig('totalBudget');
    const currentCategories = await getCategories();

    totalBudgetInput.value = currentBudget || '';
    categoryFieldsContainer.innerHTML = '';
    currentCategories.forEach(cat => {
        createCategoryInput(cat.id, cat.name, cat.limit);
    });

    showModal(document.getElementById('setup-modal'));
}

function createCategoryInput(id = null, name = '', limit = '') {
    const container = document.getElementById('category-fields');
    const fieldWrapper = document.createElement('div');
    fieldWrapper.className = 'category-entry'; 
    if (id) {
        fieldWrapper.dataset.id = id;
    }
    fieldWrapper.innerHTML = `
        <input type="text" name="category_name" class="input-field-half" placeholder="Nama Kategori" value="${name}" required>
        <input type="number" name="category_limit" class="input-field-half" placeholder="Limit" value="${limit}" required>
        <button type="button" class="remove-cat-btn">&times;</button>`;
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

    const categoryEntries = document.querySelectorAll('.category-entry');
    let totalLimit = 0;
    const formCategoryIds = [];

    for (const entry of categoryEntries) {
        const limit = parseFloat(entry.querySelector('input[name="category_limit"]').value);
        if (!isNaN(limit) && limit > 0) {
            totalLimit += limit;
        }
    }

    if (totalLimit > totalBudget) {
        alert('Total limit kategori tidak boleh melebihi total anggaran bulanan!');
        return;
    }

    await setConfig('totalBudget', totalBudget);

    const originalCategories = await getCategories();
    const originalCategoryIds = originalCategories.map(cat => cat.id);

    for (const entry of categoryEntries) {
        const id = entry.dataset.id ? parseInt(entry.dataset.id, 10) : null;
        const name = entry.querySelector('input[name="category_name"]').value.trim();
        const limit = parseFloat(entry.querySelector('input[name="category_limit"]').value);

        if (name && !isNaN(limit) && limit > 0) {
            if (id) {
                await updateCategory({ id, name, limit });
                formCategoryIds.push(id);
            } else {
                await addCategory({ name, limit });
            }
        }
    }

    const deletedIds = originalCategoryIds.filter(id => !formCategoryIds.includes(id));
    for (const id of deletedIds) {
        await deleteCategory(id);
    }

    closeAllModals();
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
    closeAllModals();
    await renderUI();
}

async function handleDataReset() {
    await resetDatabase();
    closeAllModals();
    await renderUI();
}

// --- Fungsi Bantuan & PWA ---
async function checkIfInitialSetupNeeded() {
    const budget = await getConfig('totalBudget');
    const categories = await getCategories();
    if (budget === null && categories.length === 0) {
        openSetupModal();
        document.getElementById('close-setup-modal').classList.add('hidden');
    } else {
        document.getElementById('close-setup-modal').classList.remove('hidden');
    }
}


async function populateCategoryDropdown() {
    const selectEl = document.getElementById('expense-category');
    const categories = await getCategories();
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
        installContainer.style.display = 'block';
        installContainer.innerHTML = '';
        
        const installButton = document.createElement('button');
        installButton.textContent = 'Pasang Aplikasi Dompet Damai';
        installButton.className = 'btn-pwa-install'; 
        installContainer.appendChild(installButton);
        
        installButton.addEventListener('click', () => {
            installButton.style.display = 'none';
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
        });
    });

    window.addEventListener('appinstalled', () => {
        const installContainer = document.getElementById('install-container');
        if (installContainer) {
            installContainer.style.display = 'none';
        }
    });
}