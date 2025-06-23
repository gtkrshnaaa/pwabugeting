// Fungsi untuk memformat angka menjadi format mata uang Rupiah
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Fungsi untuk mengekspor data ke format JSON
async function exportToJSON() {
    try {
        const budget = await getConfig('monthlyBudget') || 0;
        const categories = await getCategories();
        const transactions = await getTransactions();

        const data = {
            targetAnggaranBulanan: budget,
            kategori: categories,
            riwayatPemasukan: transactions,
            dieksporPada: new Date().toISOString()
        };

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `dompet-damai-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Gagal mengekspor data ke JSON:', error);
        alert('Gagal mengekspor data.');
    }
}


// Fungsi untuk mengekspor data ke format CSV
async function exportToCSV() {
    try {
        const categories = await getCategories();
        if (categories.length === 0) {
            alert('Tidak ada data kategori untuk diekspor.');
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID Kategori,Nama Kategori,Target Alokasi,Teralokasi\r\n"; // Header CSV

        categories.forEach(cat => {
            csvContent += `${cat.id},"${cat.name}",${cat.target},${cat.allocated}\r\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `dompet-damai-kategori-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error('Gagal mengekspor data ke CSV:', error);
        alert('Gagal mengekspor data.');
    }
}
