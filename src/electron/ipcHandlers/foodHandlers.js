// Lokasi file: src/electron/ipcHandlers/foodHandlers.js
// Deskripsi: (DIPERBARUI) Prompt AI disempurnakan dengan aturan ketat untuk
//            selalu menggunakan titik (.) sebagai pemisah desimal.

const log = require('electron-log');
const { foodSchema } = require('../schemas.cjs');
const axios = require('axios');
const https = require('https');
const { getAiApiUrl } = require('../aiConfig');

const httpsAgent = new https.Agent({ family: 4 });

async function getGroundedFoodDataWithConversions(apiKey, { name, base_quantity, base_unit }) {
    const queryString = `${base_quantity} ${base_unit} ${name}`;
    log.info(`Permintaan data AI lengkap untuk: ${queryString}`);
    const url = getAiApiUrl(apiKey);

    // --- PERBAIKAN: Prompt AI sekarang memiliki aturan format angka yang ketat ---
    const prompt = `
        Analisis bahan makanan: "${queryString}". Tugas Anda adalah memberikan informasi nutrisi, estimasi harga, dan kategori.
        Patuhi aturan ini dengan ketat:
        1.  Data Nutrisi: Berikan data untuk porsi "${queryString}". Kunci JSON HARUS "calories_kcal", "protein_g", "fat_g", "carbs_g", "fiber_g".
        2.  Estimasi Harga: Temukan harga dalam Rupiah (IDR) untuk porsi "${queryString}". Kunci JSON HARUS "price". Nilainya harus berupa angka.
        3.  Kategori: Tentukan kategori yang paling sesuai dalam Bahasa Indonesia.
        4.  FORMAT ANGKA (SANGAT PENTING): Untuk semua nilai numerik yang mengandung desimal, HARUS menggunakan titik (.) sebagai pemisah desimal, BUKAN koma (,).
        5.  Format Output: Anda HARUS mengembalikan satu objek JSON yang bersih. Jangan bungkus dengan markdown atau teks tambahan.
        Contoh untuk "1 butir Telur Ayam": { "nutrition": { "calories_kcal": 77, "protein_g": 6.3, "fat_g": 5.3, "carbs_g": 0.6, "fiber_g": 0 }, "category": "Produk Hewani", "price": 2000 }
    `;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    try {
        const response = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' }, httpsAgent });
        const text = response.data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(text);
        log.info('Respons data AI lengkap berhasil di-parse:', data);
        return data;
    } catch (error) {
        log.error('Error saat memanggil data AI lengkap:', error.message);
        throw new Error("Gagal mengambil data dari AI. Periksa koneksi atau format respons dari AI.");
    }
}

// ... (Sisa kode di file ini tidak berubah)
// ... (Saya sertakan lengkap di bawah agar tidak ada kebingungan)

async function updateFoodInDb(db, foodData) {
    try {
        const validatedFood = foodSchema.parse(foodData);
        const sql = `UPDATE foods SET 
            name = ?, serving_size_g = ?, calories_kcal = ?, carbs_g = ?, 
            protein_g = ?, fat_g = ?, fiber_g = ?, price_per_100g = ?, category = ?, 
            unit_conversions = ?, base_quantity = ?, base_unit = ?
            WHERE id = ?`;
        const params = [
            validatedFood.name, validatedFood.serving_size_g, validatedFood.calories_kcal,
            validatedFood.carbs_g, validatedFood.protein_g, validatedFood.fat_g, validatedFood.fiber_g,
            validatedFood.price_per_100g, validatedFood.category,
            validatedFood.unit_conversions, 
            validatedFood.base_quantity, validatedFood.base_unit,
            validatedFood.id
        ];
        await db.runAsync(sql, params);
        return { success: true };
    } catch (err) {
        log.error('Gagal memperbarui bahan di DB:', err);
        if (err.message.includes('UNIQUE constraint')) {
            throw new Error(`DB_UNIQUE_CONSTRAINT: Nama bahan "${foodData.name}" sudah ada.`);
        }
        throw err;
    }
}


function registerFoodHandlers(ipcMain, db) {
    ipcMain.handle('db:get-foods', async () => db.allAsync("SELECT * FROM foods ORDER BY usage_count DESC, name ASC"));

    ipcMain.handle('db:add-food', async (event, food) => {
        try {
            const validatedFood = foodSchema.parse(food);
            const sql = `INSERT INTO foods (name, serving_size_g, calories_kcal, carbs_g, protein_g, fat_g, fiber_g, price_per_100g, category, unit_conversions, created_at, base_quantity, base_unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const params = [
                validatedFood.name, validatedFood.serving_size_g, validatedFood.calories_kcal,
                validatedFood.carbs_g, validatedFood.protein_g, validatedFood.fat_g, validatedFood.fiber_g,
                validatedFood.price_per_100g, validatedFood.category,
                validatedFood.unit_conversions, new Date().toISOString(),
                validatedFood.base_quantity, validatedFood.base_unit
            ];
            const result = await db.runAsync(sql, params);
            return { id: result.lastID, ...validatedFood };
        } catch (err) {
            log.error('Gagal menambahkan bahan:', err);
            if (err.message.includes('UNIQUE constraint')) {
                throw new Error(`DB_UNIQUE_CONSTRAINT: Nama bahan "${food.name}" sudah ada.`);
            }
            throw err;
        }
    });

    ipcMain.handle('db:update-food', async (event, food) => updateFoodInDb(db, food));
    
    ipcMain.handle('db:delete-food', async (event, id) => {
        await db.runAsync("DELETE FROM foods WHERE id = ?", [id]);
        return { success: true };
    });

    ipcMain.handle('db:delete-foods-bulk', async (event, ids) => {
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new Error("Payload tidak valid: harus berupa array ID.");
        }
        const placeholders = ids.map(() => '?').join(',');
        const sql = `DELETE FROM foods WHERE id IN (${placeholders})`;
        try {
            await db.runAsync(sql, ids);
            log.info(`${ids.length} bahan berhasil dihapus.`);
            return { success: true, count: ids.length };
        } catch (err) {
            log.error('Gagal menghapus bahan secara massal:', err);
            throw err;
        }
    });
    
    ipcMain.handle('ai:get-grounded-food-data', async (event, payload) => {
        const apiKeyRow = await db.getAsync("SELECT value FROM settings WHERE key = 'googleApiKey'");
        const apiKey = apiKeyRow?.value;
        if (!apiKey) throw new Error("Kunci API Google AI belum diatur.");
        return getGroundedFoodDataWithConversions(apiKey, payload);
    });

    ipcMain.handle('ai:generate-unit-conversions', async (event, foodName) => {
        const apiKeyRow = await db.getAsync("SELECT value FROM settings WHERE key = 'googleApiKey'");
        const apiKey = apiKeyRow?.value;
        if (!apiKey) throw new Error("Kunci API Google AI belum diatur.");

        log.info(`Meminta konversi satuan untuk: ${foodName}`);
        const url = getAiApiUrl(apiKey);
        const prompt = `
            Tugas Anda HANYA mengidentifikasi konversi satuan masak umum untuk bahan makanan "${foodName}" ke dalam gram.
            Patuhi aturan ini dengan ketat:
            1.  Cari padanan gram untuk satuan umum (contoh: "siung" untuk bawang, "sdm" untuk kecap, "butir" untuk telur).
            2.  Kembalikan sebagai OBJEK JSON. Kunci adalah nama satuan (string), nilai adalah padanannya dalam gram (angka).
            3.  Jika tidak ada konversi yang umum atau relevan, kembalikan objek JSON kosong {}.
            4.  JANGAN sertakan data lain (nutrisi, harga, dll). JANGAN bungkus output dalam markdown.

            Contoh untuk "Bawang Putih": {"siung": 5}
            Contoh untuk "Tepung Terigu": {"sdm": 10, "sdt": 3}
            Contoh untuk "Dada Ayam": {}
        `;
        const payload = { contents: [{ parts: [{ text: prompt }] }] };
        try {
            const response = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' }, httpsAgent });
            const text = response.data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
            const data = JSON.parse(text);
            log.info('Respons konversi satuan AI berhasil di-parse:', data);
            return data;
        } catch (error) {
            log.error('Error saat memanggil AI untuk konversi satuan:', error.message);
            throw new Error("Gagal mengambil data konversi dari AI.");
        }
    });
    
    ipcMain.handle('ai:test-connection', async (event) => {
        const apiKeyRow = await db.getAsync("SELECT value FROM settings WHERE key = 'googleApiKey'");
        const apiKey = apiKeyRow?.value;
        if (!apiKey) throw new Error("Kunci API belum diatur.");
        const url = getAiApiUrl(apiKey);
        const payload = { contents: [{ parts: [{ text: "test" }] }] };
        try {
            await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' }, httpsAgent });
            return { success: true };
        } catch (error) {
            log.error('Tes koneksi gagal:', error.message);
            throw new Error("Koneksi gagal.");
        }
    });
}

module.exports = { registerFoodHandlers, getGroundedFoodDataWithConversions, updateFoodInDb };
