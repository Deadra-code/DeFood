// Lokasi file: src/electron/main.js
// Deskripsi: Memindahkan logika penutupan database ke event 'will-quit'
//            dan menunggunya selesai sebelum aplikasi benar-benar berhenti.

const { app, dialog, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const log = require('electron-log');
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater');
const { initializeDatabase, getDbInstance, closeDatabase } = require('./database');
const { registerIpcHandlers } = require('./ipcHandlers');
const dns = require('dns');

// ... (Konfigurasi Jaringan, Logging, dan process.on('uncaughtException') tetap sama) ...
dns.setDefaultResultOrder('ipv4first');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs/main.log');
log.transports.file.level = 'info';
Object.assign(console, log.functions);
autoUpdater.logger = log;
const rendererLogger = log.create({ logId: 'rendererLogger' });
rendererLogger.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs/renderer.log');
rendererLogger.transports.file.level = 'error';
process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception:', error);
    dialog.showErrorBox('Kesalahan Fatal', 'Aplikasi mengalami kesalahan yang tidak terduga. Silakan periksa file log untuk detailnya.');
    app.quit();
});


let mainWindow;

function createWindow() {
    // ... (Fungsi createWindow tetap sama) ...
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, '../../public/preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, '../../public/favicon.ico'),
        show: false
    });

    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../../build/index.html')}`;

    mainWindow.loadURL(startUrl);

    mainWindow.once('ready-to-show', () => {
        mainWindow.maximize();
        mainWindow.show();
        if (!isDev) {
            autoUpdater.checkForUpdatesAndNotify();
        }
    });

    if (isDev) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
}

Menu.setApplicationMenu(null);

log.info('Aplikasi dimulai...');

app.whenReady().then(async () => {
    // ... (Isi app.whenReady tetap sama) ...
    try {
        await initializeDatabase();
        const db = getDbInstance();
        
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

        registerIpcHandlers(db);
        
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

// ... (Handler autoUpdater tetap sama) ...
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


app.on('window-all-closed', () => {
    // HAPUS: closeDatabase() dipindahkan dari sini.
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// --- PERBAIKAN KRITIS: Menangani penutupan DB di event 'will-quit' ---
app.on('will-quit', async (event) => {
    log.info('Aplikasi akan ditutup. Menutup koneksi database...');
    // Mencegah aplikasi langsung keluar
    event.preventDefault(); 
    try {
        await closeDatabase();
        log.info('Database ditutup, aplikasi akan keluar sekarang.');
        // Keluar dari aplikasi setelah database berhasil ditutup
        app.exit();
    } catch (err) {
        log.error('Error saat menutup database sebelum keluar:', err);
        // Tetap keluar meskipun ada error
        app.exit();
    }
});
