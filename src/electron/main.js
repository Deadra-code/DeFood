// Lokasi file: src/electron/main.js
// Deskripsi: File utama proses main Electron, disesuaikan untuk Vite.
// - Mode Pengembangan: Memuat konten dari server pengembangan Vite.
// - Mode Produksi: Memuat file statis dari direktori 'dist'.
// - Menangani semua siklus hidup aplikasi dan IPC.

const { app, dialog, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const log = require('electron-log');
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater');
const { initializeDatabase, getDbInstance, closeDatabase } = require('./database');
const { registerIpcHandlers } = require('./ipcHandlers');
const dns = require('dns');

// --- SOLUSI: Mengatur nama aplikasi secara eksplisit ---
// Baris ini akan membuat Electron menggunakan "DeFood" sebagai nama folder data
// di C:\Users\HP\AppData\Roaming\DeFood
app.setName('DeFood');

// --- Konfigurasi Jaringan & Logging ---
// Mengutamakan IPv4 untuk mengatasi masalah jaringan tertentu.
dns.setDefaultResultOrder('ipv4first');
// Menonaktifkan penolakan sertifikat TLS yang tidak sah (gunakan dengan hati-hati).
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// Mengatur path untuk file log utama dan renderer.
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs/main.log');
log.transports.file.level = 'info';
Object.assign(console, log.functions);
autoUpdater.logger = log;
const rendererLogger = log.create({ logId: 'rendererLogger' });
rendererLogger.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs/renderer.log');
rendererLogger.transports.file.level = 'error';

// --- Penanganan Error Global ---
// Menangkap semua error yang tidak tertangani untuk mencegah crash.
process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception:', error);
    dialog.showErrorBox('Kesalahan Fatal', 'Aplikasi mengalami kesalahan yang tidak terduga. Silakan periksa file log untuk detailnya.');
    app.quit();
});


let mainWindow;

function createWindow() {
    // Membuat jendela browser utama.
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        frame: false, // Jendela tanpa bingkai standar (frameless).
        webPreferences: {
            // --- PERBAIKAN KRUSIAL ---
            // Path ini sekarang menunjuk ke file preload.js yang akan kita pastikan
            // berada di direktori yang sama dengan main.js setelah proses build.
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false, // Penting untuk keamanan.
            contextIsolation: true, // Penting untuk keamanan.
        },
        // Path ikon di produksi akan berada di root, jadi kita sesuaikan
        icon: path.join(__dirname, isDev ? '../../public/favicon.ico' : 'favicon.ico'),
        show: false // Jendela disembunyikan saat dibuat, ditampilkan saat siap.
    });

    // --- PERBAIKAN LOGIKA PATH UNTUK VITE ---
    const VITE_DEV_SERVER_URL = 'http://localhost:5173';

    // Menentukan URL yang akan dimuat berdasarkan lingkungan (dev/prod).
    if (isDev) {
        mainWindow.loadURL(VITE_DEV_SERVER_URL);
    } else {
        // Di produksi, React app (index.html) dan main.js berada di level yang sama
        // di dalam folder 'dist' yang menjadi root dari app.asar.
        mainWindow.loadFile(path.join(__dirname, 'index.html'));
    }
        
    // Menampilkan jendela setelah konten siap untuk ditampilkan.
    mainWindow.once('ready-to-show', () => {
        mainWindow.maximize();
        mainWindow.show();
        // Cek pembaruan hanya di mode produksi.
        if (!isDev) {
            autoUpdater.checkForUpdatesAndNotify();
        }
    });

    // Buka DevTools hanya di mode pengembangan.
    if (isDev) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
}

// Menghapus menu aplikasi default.
Menu.setApplicationMenu(null);

log.info('Aplikasi dimulai...');

// --- Siklus Hidup Aplikasi: 'ready' ---
app.whenReady().then(async () => {
    try {
        // Inisialisasi database sebelum membuat jendela.
        await initializeDatabase();
        const db = getDbInstance();
        
        // --- Registrasi Handler Kontrol Jendela & Aplikasi ---
        ipcMain.on('app:minimize', () => mainWindow.minimize());
        ipcMain.on('app:maximize', () => {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            } else {
                mainWindow.maximize();
            }
        });
        ipcMain.on('app:close', () => mainWindow.close());
        ipcMain.handle('app:get-version', () => app.getVersion());
        ipcMain.handle('app:open-logs', () => {
            const logPath = log.transports.file.getFile().path;
            shell.openPath(logPath);
        });
        ipcMain.handle('app:check-for-updates', () => {
            autoUpdater.checkForUpdates();
        });
        ipcMain.on('app:quit', () => app.quit());

        // Mendaftarkan semua IPC handler lainnya (untuk database, AI, dll.).
        registerIpcHandlers(db);
        
        // Handler untuk mencatat error dari proses renderer.
        ipcMain.on('log-error-to-main', (event, error) => {
            rendererLogger.error('Error dari renderer:', error);
        });

        createWindow();
    } catch (error) {
        log.error('Fatal: Gagal menginisialisasi aplikasi.', error);
        dialog.showErrorBox('Error Aplikasi', 'Gagal menginisialisasi aplikasi. Lihat log untuk detail.');
        app.quit();
    }
});

// --- Handler untuk Auto Updater ---
autoUpdater.on('update-available', () => {
    log.info('Pembaruan tersedia.');
    mainWindow.webContents.send('update-status', 'Pembaruan tersedia!');
});
autoUpdater.on('update-not-available', () => {
    log.info('Tidak ada pembaruan.');
    mainWindow.webContents.send('update-status', 'Versi terbaru');
});
autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Kecepatan unduh: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Diunduh ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    log.info(log_message);
    mainWindow.webContents.send('update-status', `Mengunduh pembaruan... ${Math.round(progressObj.percent)}%`);
});
autoUpdater.on('update-downloaded', () => {
    log.info('Pembaruan diunduh.');
    mainWindow.webContents.send('update-status', 'Pembaruan siap diinstal');
    dialog.showMessageBox({
        type: 'info',
        title: 'Pembaruan Siap',
        message: 'Versi baru telah diunduh. Mulai ulang aplikasi untuk menerapkan pembaruan.',
        buttons: ['Mulai Ulang', 'Nanti']
    }).then(buttonIndex => {
        if (buttonIndex.response === 0) {
            autoUpdater.quitAndInstall();
        }
    });
});
autoUpdater.on('error', (err) => {
    log.error('Error di autoUpdater. ' + err);
    mainWindow.webContents.send('update-status', 'Gagal memeriksa pembaruan');
});


// --- Siklus Hidup Aplikasi: Penutupan & Aktivasi ---
app.on('window-all-closed', () => {
    // Di macOS, aplikasi tetap aktif meskipun semua jendela ditutup.
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // Di macOS, buat kembali jendela jika di-klik di dock dan tidak ada jendela lain.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// --- PERBAIKAN KRITIS: Menangani penutupan DB di event 'will-quit' ---
app.on('will-quit', async (event) => {
    log.info('Aplikasi akan ditutup. Menutup koneksi database...');
    // Mencegah aplikasi langsung keluar untuk memberi waktu pada operasi asinkron.
    event.preventDefault(); 
    try {
        await closeDatabase();
        log.info('Database ditutup, aplikasi akan keluar sekarang.');
        // Keluar dari aplikasi setelah database berhasil ditutup.
        app.exit();
    } catch (err) {
        log.error('Error saat menutup database sebelum keluar:', err);
        // Tetap keluar meskipun ada error.
        app.exit();
    }
});
