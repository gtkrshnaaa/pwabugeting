/**
 * utils.js - Berisi fungsi bantuan seperti format mata uang dan ekspor data.
 */

// Fungsi untuk mengekspor semua data ke format JSON
async function exportToJSON() {
    try {
        const totalBudget = await getConfig('totalBudget') || 0;
        const categories = await getCategories();
        const expenses = await getExpenses();

        const dataToExport = {
            pengaturan: {
                totalAnggaran: totalBudget,
                dieksporPada: new Date().toISOString()
            },
            kategori: categories.map(c => ({ nama: c.name, limit: c.limit })),
            riwayatPengeluaran: expenses.map(e => ({
                jumlah: e.amount,
                id_kategori: e.categoryId,
                deskripsi: e.description,
                tanggal: e.date
            }))
        };

        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `dompet-damai-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Ekspor JSON berhasil.');

    } catch (error) {
        console.error('Gagal mengekspor data ke JSON:', error);
        alert('Gagal mengekspor data.');
    }
}

// Fungsi untuk mengekspor riwayat pengeluaran ke format CSV
async function exportToCSV() {
    try {
        const expenses = await getExpenses();
        if (expenses.length === 0) {
            alert('Tidak ada riwayat pengeluaran untuk diekspor.');
            return;
        }
        
        const categories = await getCategories();
        const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Tanggal,Kategori,Deskripsi,Jumlah\r\n"; // Header CSV

        expenses.forEach(exp => {
            const date = new Date(exp.date).toLocaleString('id-ID');
            const categoryName = categoryMap.get(exp.categoryId) || 'Tidak Diketahui';
            const description = exp.description ? `"${exp.description.replace(/"/g, '""')}"` : '';
            csvContent += `${date},${categoryName},${description},${exp.amount}\r\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `riwayat-pengeluaran-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('Ekspor CSV berhasil.');

    } catch (error) {
        console.error('Gagal mengekspor data ke CSV:', error);
        alert('Gagal mengekspor data.');
    }
}
