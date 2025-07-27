// Lokasi file: src/electron/main.js
// Deskripsi: Ditambahkan workaround untuk mengabaikan error validasi SSL/TLS dan memprioritaskan IPv4.

const { app, dialog, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');
const isDev = require('electron-is-dev');
const { initializeDatabase, getDbInstance, closeDatabase } = require('./database');
const { registerIpcHandlers } = require('./ipcHandlers');
const dns = require('dns'); // --- PERBAIKAN: Impor modul DNS ---

// --- PERBAIKAN: Prioritaskan DNS lookup ke IPv4 untuk mengatasi masalah ETIMEDOUT ---
dns.setDefaultResultOrder('ipv4first');
// ---------------------------------------------------------------------------------


// --- PERBAIKAN FINAL: Mengabaikan error validasi sertifikat SSL ---
// Ini akan memaksa Node.js untuk menerima koneksi bahkan jika ada
// Antivirus/Firewall yang melakukan inspeksi SSL/TLS.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// ---------------------------------------------------------------------------------

// Konfigurasi logging
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs/main.log');
log.transports.file.level = 'info';
Object.assign(console, log.functions);

// Logger terpisah untuk error dari proses renderer
const rendererLogger = log.create({ logId: 'rendererLogger' });
rendererLogger.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs/renderer.log');
rendererLogger.transports.file.level = 'error';

// Menangani error yang tidak tertangkap
process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception:', error);
    dialog.showErrorBox('Kesalahan Fatal', 'Aplikasi mengalami kesalahan yang tidak terduga. Silakan periksa file log untuk detailnya.');
    app.quit();
});

function createWindow() {
    const mainWindow = new BrowserWindow({
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
    });

    if (isDev) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
}

log.info('App starting...');

app.whenReady().then(async () => {
    try {
        await initializeDatabase();
        const db = getDbInstance();
        registerIpcHandlers(db);
        
        ipcMain.on('log-error-to-main', (event, error) => {
            rendererLogger.error('Error from renderer:', error);
        });

        createWindow();
    } catch (error) {
        log.error('Fatal: Could not initialize the application.', error);
        dialog.showErrorBox('Application Error', 'Could not initialize the application. See logs for details.');
        app.quit();
    }
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
    log.info('App is quitting.');
});
