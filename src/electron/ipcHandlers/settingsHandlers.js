// Lokasi file: src/electron/ipcHandlers/settingsHandlers.js
// Deskripsi: Handler untuk menyimpan dan mengambil pengaturan, sekarang dengan validasi.

const log = require('electron-log');
// --- PERBAIKAN (Isu #1.2): Impor skema pengaturan ---
const { settingsSchema } = require('../schemas.cjs');

// Nilai default sekarang adalah angka
const defaultSettings = {
    margin: 70,
    operationalCost: 0,
    laborCost: 0,
    googleApiKey: ''
};

function registerSettingsHandlers(ipcMain, db) {
    ipcMain.handle('db:get-settings', async () => {
        try {
            const rows = await db.allAsync("SELECT key, value FROM settings");
            if (rows.length === 0) {
                return defaultSettings;
            }
            const settings = rows.reduce((acc, row) => {
                // Konversi kembali ke tipe yang benar saat mengambil dari DB
                const isNumeric = ['margin', 'operationalCost', 'laborCost'].includes(row.key);
                acc[row.key] = isNumeric ? Number(row.value) : row.value;
                return acc;
            }, {});
            return { ...defaultSettings, ...settings };
        } catch (err) {
            log.error('Failed to get settings:', err);
            return defaultSettings;
        }
    });

    // --- PERBAIKAN (Isu #1.2): Menyimpan pengaturan dengan validasi Zod ---
    ipcMain.handle('db:save-settings', async (event, settings) => {
        try {
            // Validasi payload sebelum menyimpan
            const validatedSettings = settingsSchema.parse(settings);

            const sql = "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)";
            await db.runAsync('BEGIN TRANSACTION');
            for (const key in validatedSettings) {
                if (Object.hasOwnProperty.call(validatedSettings, key)) {
                    // Simpan semua sebagai string, konversi terjadi saat get/set
                    await db.runAsync(sql, [key, String(validatedSettings[key])]);
                }
            }
            await db.runAsync('COMMIT');
            log.info('Business settings saved successfully.');
            return { success: true };
        } catch (err) {
            await db.runAsync('ROLLBACK');
            log.error('Failed to save settings:', err);
            throw err;
        }
    });
}

module.exports = { registerSettingsHandlers };
