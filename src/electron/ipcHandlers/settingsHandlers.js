// Lokasi file: src/electron/ipcHandlers/settingsHandlers.js
// Deskripsi: Handler untuk menyimpan dan mengambil pengaturan, dengan validasi dan penanganan error yang lebih baik.

const log = require('electron-log');
const { settingsSchema } = require('../schemas.cjs');

// Nilai default
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
                const isNumeric = ['margin', 'operationalCost', 'laborCost'].includes(row.key);
                acc[row.key] = isNumeric ? Number(row.value) : row.value;
                return acc;
            }, {});
            return { ...defaultSettings, ...settings };
        } catch (err) {
            log.error('Gagal mengambil pengaturan:', err);
            return defaultSettings;
        }
    });

    ipcMain.handle('db:save-settings', async (event, settings) => {
        try {
            // 1. Validasi data terlebih dahulu. Jika gagal, akan langsung melempar error.
            const validatedSettings = settingsSchema.parse(settings);

            // 2. Jika validasi berhasil, baru mulai transaksi.
            await db.runAsync('BEGIN TRANSACTION');
            try {
                const sql = "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)";
                for (const key in validatedSettings) {
                    if (Object.hasOwnProperty.call(validatedSettings, key)) {
                        await db.runAsync(sql, [key, String(validatedSettings[key])]);
                    }
                }
                await db.runAsync('COMMIT');
                log.info('Pengaturan bisnis berhasil disimpan.');
                return { success: true };
            } catch (transactionError) {
                // 3. Blok catch ini HANYA untuk error yang terjadi DI DALAM transaksi.
                log.error('Gagal saat transaksi penyimpanan pengaturan, melakukan rollback:', transactionError);
                await db.runAsync('ROLLBACK');
                throw transactionError; // Lempar kembali error asli setelah rollback.
            }
        } catch (err) {
            // 4. Blok catch ini akan menangkap error validasi (sebelum transaksi)
            //    atau error dari blok catch transaksi di atas.
            log.error('Gagal menyimpan pengaturan:', err.message);
            // Tidak ada rollback di sini karena transaksi mungkin belum dimulai.
            throw err; // Lempar error agar frontend tahu ada masalah.
        }
    });
}

module.exports = { registerSettingsHandlers };
