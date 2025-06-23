const BASE = '/pwa';

registerSW();

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(`${BASE}/sw.js`)
    .then(() => {
      updateSWStatus('✅ Service Worker terdaftar');
    })
    .catch(err => {
      updateSWStatus('❌ Gagal daftar SW: ' + err.message);
    });
  } else {
    updateSWStatus('⚠️ Service Worker tidak didukung browser');
  }

  updateOnlineStatus();
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
}

function updateOnlineStatus() {
  const statusEl = document.getElementById('online-status');
  statusEl.textContent = navigator.onLine ? '🌐 Online' : '🚫 Offline';
}

function updateSWStatus(text) {
  const swStatusEl = document.getElementById('sw-status');
  swStatusEl.textContent = text;
}

// ======= Tambahan untuk fitur install prompt =======
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Cegah browser memunculkan prompt default
  e.preventDefault();
  deferredPrompt = e;

  // Buat tombol install manual
  const installButton = document.createElement('button');
  installButton.textContent = 'Pasang ke Perangkat';
  installButton.style.marginTop = '20px';
  installButton.style.padding = '10px 20px';
  installButton.style.fontSize = '1rem';
  installButton.style.cursor = 'pointer';

  const infoDiv = document.getElementById('pwa-info');
  infoDiv.appendChild(installButton);

  installButton.addEventListener('click', () => {
    installButton.remove();
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(choice => {
      if (choice.outcome === 'accepted') {
        console.log('Pengguna menyetujui pemasangan.');
      } else {
        console.log('Pengguna membatalkan pemasangan.');
      }
      deferredPrompt = null;
    });
  });
});
