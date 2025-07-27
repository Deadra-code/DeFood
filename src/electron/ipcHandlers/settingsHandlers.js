// Lokasi file: src/electron/ipcHandlers/settingsHandlers.js
// Deskripsi: Handler untuk menyimpan dan mengambil pengaturan bisnis.

const log = require('electron-log');

const defaultSettings = {
    margin: '70',
    operationalCost: '0',
    laborCost: '0'
};

function registerSettingsHandlers(ipcMain, db) {
    /**
     * Mengambil semua pengaturan. Jika tidak ada, kembalikan nilai default.
     */
    ipcMain.handle('db:get-settings', async () => {
        try {
            const rows = await db.allAsync("SELECT key, value FROM settings");
            if (rows.length === 0) {
                return defaultSettings;
            }
            const settings = rows.reduce((acc, row) => {
                acc[row.key] = row.value;
                return acc;
            }, {});
            return { ...defaultSettings, ...settings };
        } catch (err) {
            log.error('Failed to get settings:', err);
            return defaultSettings;
        }
    });

    /**
     * Menyimpan pengaturan.
     */
    ipcMain.handle('db:save-settings', async (event, settings) => {
        try {
            const sql = "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)";
            await db.runAsync('BEGIN TRANSACTION');
            for (const key in settings) {
                if (Object.hasOwnProperty.call(settings, key)) {
                    await db.runAsync(sql, [key, settings[key]]);
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
