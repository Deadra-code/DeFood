// Lokasi file: src/electron/main.js
// Deskripsi: Menambahkan auto-updater, menu kustom, dan IPC untuk info aplikasi.

const { app, dialog, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const log = require('electron-log');
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater'); // BARU: Impor autoUpdater
const { initializeDatabase, getDbInstance, closeDatabase } = require('./database');
const { registerIpcHandlers } = require('./ipcHandlers');
const dns = require('dns');

// Konfigurasi Jaringan & Keamanan
dns.setDefaultResultOrder('ipv4first');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Konfigurasi Logging
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs/main.log');
log.transports.file.level = 'info';
Object.assign(console, log.functions);
autoUpdater.logger = log; // BARU: Arahkan log updater ke file

const rendererLogger = log.create({ logId: 'rendererLogger' });
rendererLogger.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs/renderer.log');
rendererLogger.transports.file.level = 'error';

process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception:', error);
    dialog.showErrorBox('Kesalahan Fatal', 'Aplikasi mengalami kesalahan yang tidak terduga. Silakan periksa file log untuk detailnya.');
    app.quit();
});

let mainWindow; // BARU: Deklarasikan mainWindow di scope yang lebih luas

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
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
        mainWindow.show();
        // BARU: Periksa pembaruan setelah jendela siap ditampilkan
        if (!isDev) {
            autoUpdater.checkForUpdatesAndNotify();
        }
    });

    if (isDev) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
}

// --- FUNGSI BARU: Membuat menu aplikasi kustom ---
function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                { role: 'quit', label: 'Keluar' }
            ]
        },
        {
            label: 'Bantuan',
            submenu: [
                {
                    label: 'Tentang DeFood',
                    click: () => {
                        // Kirim event ke renderer untuk membuka dialog "Tentang"
                        mainWindow.webContents.send('open-about-dialog');
                    }
                },
                {
                    label: 'Periksa Pembaruan...',
                    click: () => {
                        autoUpdater.checkForUpdates();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Pelajari Lebih Lanjut',
                    click: async () => {
                        // Membuka link di browser default pengguna
                        await shell.openExternal('https://github.com');
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}


log.info('Aplikasi dimulai...');

app.whenReady().then(async () => {
    try {
        await initializeDatabase();
        const db = getDbInstance();
        
        // --- IPC HANDLER BARU ---
        // IPC untuk mendapatkan versi aplikasi
        ipcMain.handle('app:get-version', () => {
            return app.getVersion();
        });
        
        // Daftarkan semua handler lainnya
        registerIpcHandlers(db);
        
        ipcMain.on('log-error-to-main', (event, error) => {
            rendererLogger.error('Error dari renderer:', error);
        });

        createWindow();
        createMenu(); // BARU: Panggil fungsi untuk membuat menu
    } catch (error) {
        log.error('Fatal: Gagal menginisialisasi aplikasi.', error);
        dialog.showErrorBox('Error Aplikasi', 'Gagal menginisialisasi aplikasi. Lihat log untuk detail.');
        app.quit();
    }
});

// --- LISTENER AUTO-UPDATER BARU ---
autoUpdater.on('update-available', () => {
    log.info('Pembaruan tersedia.');
    // Bisa mengirim notifikasi ke renderer jika mau
});

autoUpdater.on('update-downloaded', () => {
    log.info('Pembaruan diunduh.');
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
});


app.on('window-all-closed', () => {
    closeDatabase();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('will-quit', () => {
    log.info('Aplikasi akan ditutup.');
});
