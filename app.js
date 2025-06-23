document.addEventListener('DOMContentLoaded', () => {
    // Registrasi Service Worker
    registerServiceWorker();

    // Inisialisasi semua elemen UI
    const budgetForm = document.getElementById('budget-form');
    const monthlyBudgetInput = document.getElementById('monthly-budget');
    const categoryForm = document.getElementById('category-form');
    const categoryNameInput = document.getElementById('category-name');
    const categoryTargetInput = document.getElementById('category-target');
    const transactionForm = document.getElementById('transaction-form');
    const transactionAmountInput = document.getElementById('transaction-amount');
    const transactionDescInput = document.getElementById('transaction-desc');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');

    // Event Listener
    budgetForm.addEventListener('submit', handleSetBudget);
    categoryForm.addEventListener('submit', handleAddCategory);
    transactionForm.addEventListener('submit', handleAddTransaction);
    exportJsonBtn.addEventListener('click', exportToJSON);
    exportCsvBtn.addEventListener('click', exportToCSV);

    // Muat data saat aplikasi pertama kali dibuka
    renderDashboard();
});

// Fungsi untuk me-render seluruh tampilan utama
async function renderDashboard() {
    await renderBudgetSummary();
    await renderCategoryList();
    await renderTransactionHistory();
}

// Render ringkasan anggaran
async function renderBudgetSummary() {
    const summaryTargetEl = document.getElementById('summary-target');
    const summaryAllocatedEl = document.getElementById('summary-allocated');
    const summaryRemainingEl = document.getElementById('summary-remaining');
    const monthlyBudgetInput = document.getElementById('monthly-budget');

    const budget = await getConfig('monthlyBudget') || 0;
    const categories = await getCategories();
    const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocated, 0);
    const remaining = Math.max(0, budget - totalAllocated);

    monthlyBudgetInput.value = budget > 0 ? budget : '';
    summaryTargetEl.textContent = formatCurrency(budget);
    summaryAllocatedEl.textContent = formatCurrency(totalAllocated);
    summaryRemainingEl.textContent = formatCurrency(remaining);
}

// Render daftar kategori beserta progress bar-nya
async function renderCategoryList() {
    const categoryListEl = document.getElementById('category-list');
    const categories = await getCategories();

    if (categories.length === 0) {
        categoryListEl.innerHTML = '<p>Belum ada kategori. Silakan tambahkan di bawah.</p>';
        return;
    }

    categoryListEl.innerHTML = ''; // Kosongkan daftar
    categories.forEach(cat => {
        const progress = cat.target > 0 ? (cat.allocated / cat.target) * 100 : 0;
        const item = document.createElement('div');
        item.className = 'category-item';
        item.innerHTML = `
            <div class="category-info">
                <span class="category-name">${cat.name}</span>
                <span class="category-amount">${formatCurrency(cat.allocated)} / ${formatCurrency(cat.target)}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${Math.min(100, progress)}%;"></div>
            </div>
        `;
        categoryListEl.appendChild(item);
    });
}

// Render riwayat pemasukan
async function renderTransactionHistory() {
    const historyEl = document.getElementById('transaction-history');
    const transactions = await getTransactions();

    if (transactions.length === 0) {
        historyEl.innerHTML = '<p>Belum ada riwayat pemasukan.</p>';
        return;
    }

    historyEl.innerHTML = '';
    transactions.forEach(tx => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        item.innerHTML = `
            <div>
                <div class="amount">${formatCurrency(tx.amount)}</div>
                <div class="date">${new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric'})} - ${tx.description || 'Pemasukan'}</div>
            </div>
        `;
        historyEl.appendChild(item);
    });
}

// --- Handler untuk Form dan Button ---

async function handleSetBudget(e) {
    e.preventDefault();
    const budgetValue = parseFloat(document.getElementById('monthly-budget').value);
    if (isNaN(budgetValue) || budgetValue < 0) {
        alert('Mohon masukkan jumlah anggaran yang valid.');
        return;
    }
    await setConfig('monthlyBudget', budgetValue);
    await renderBudgetSummary();
}

async function handleAddCategory(e) {
    e.preventDefault();
    const name = document.getElementById('category-name').value.trim();
    const target = parseFloat(document.getElementById('category-target').value);

    if (!name || isNaN(target) || target <= 0) {
        alert('Nama kategori dan target harus diisi dengan benar.');
        return;
    }

    const newCategory = { name, target, allocated: 0 };
    await addCategory(newCategory);
    
    // Reset form dan re-render
    document.getElementById('category-form').reset();
    await renderCategoryList();
}

async function handleAddTransaction(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const description = document.getElementById('transaction-desc').value.trim();

    if (isNaN(amount) || amount <= 0) {
        alert('Jumlah pemasukan tidak valid.');
        return;
    }

    // Simpan transaksi
    await addTransaction({ amount, description, date: new Date().toISOString() });
    
    // Distribusikan dana ke kategori
    await distributeFunds(amount);

    // Reset form dan re-render seluruh dashboard
    document.getElementById('transaction-form').reset();
    await renderDashboard();
}

// Logika untuk mendistribusikan dana ke kategori secara berurutan
async function distributeFunds(amount) {
    let remainingAmount = amount;
    const categories = await getCategories();

    for (const category of categories) {
        if (remainingAmount <= 0) break;

        const needed = category.target - category.allocated;
        if (needed > 0) {
            const toAllocate = Math.min(remainingAmount, needed);
            category.allocated += toAllocate;
            remainingAmount -= toAllocate;
            await updateCategory(category);
        }
    }
}


// --- Logika PWA (Service Worker & Install Prompt) ---
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker terdaftar.', reg))
            .catch(err => console.error('Gagal mendaftarkan Service Worker:', err));
    }
}

let deferredPrompt;
const installContainer = document.getElementById('install-container');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Tampilkan tombol install
    const installButton = document.createElement('button');
    installButton.id = 'install-button';
    installButton.className = 'btn btn-primary';
    installButton.textContent = 'Pasang Aplikasi ke Perangkat';
    installContainer.innerHTML = ''; // Bersihkan dulu
    installContainer.appendChild(installButton);

    installButton.addEventListener('click', () => {
        installButton.style.display = 'none';
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Pengguna menyetujui pemasangan');
            } else {
                console.log('Pengguna menolak pemasangan');
            }
            deferredPrompt = null;
        });
    });
});
