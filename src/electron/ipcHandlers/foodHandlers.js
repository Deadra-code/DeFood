// Lokasi file: src/electron/ipcHandlers/foodHandlers.js
// Deskripsi: Handler untuk semua operasi terkait bahan makanan, dengan prompt AI yang sudah diterjemahkan.

const log = require('electron-log');
const { foodSchema } = require('../schemas.cjs');
const axios = require('axios');
const https = require('https');
const { getAiApiUrl } = require('../aiConfig');

const httpsAgent = new https.Agent({ family: 4 });

// --- PERUBAHAN: Prompt AI telah diterjemahkan ke Bahasa Indonesia ---
async function getGroundedFoodDataWithConversions(apiKey, foodName) {
    log.info(`Permintaan data AI lengkap untuk: ${foodName}`);
    const url = getAiApiUrl(apiKey);
    const prompt = `
        Analisis bahan makanan: "${foodName}". Tugas Anda adalah memberikan informasi nutrisi, estimasi harga, kategori, DAN konversi satuan umum.
        Patuhi aturan ini dengan ketat:
        1.  Data Nutrisi: Berikan data untuk 100g porsi dalam keadaan mentah. Kunci JSON HARUS "calories_kcal", "protein_g", "fat_g", "carbs_g", "fiber_g".
        2.  Estimasi Harga: Temukan harga dalam Rupiah (IDR) dan normalisasikan ke nilai per 100 gram. Kunci JSON HARUS "price_per_100g". Nilainya harus berupa angka.
        3.  Kategori: Tentukan kategori yang paling sesuai dalam Bahasa Indonesia.
        4.  Konversi Satuan (KRITIKAL):
            -   Temukan konversi takaran masak yang umum untuk "${foodName}" ke dalam gram.
            -   Contoh: Untuk "Bawang Putih", temukan berapa gram dalam 1 "siung". Untuk "Kecap Manis", temukan gram per "sdm" (sendok makan). Untuk "Telur", temukan gram per "butir".
            -   Anda HARUS mengembalikan ini sebagai objek JSON di mana kuncinya adalah nama satuan (string) dan nilainya adalah padanannya dalam gram (angka).
            -   Jika tidak ada konversi yang umum digunakan (misalnya, untuk "Dada Ayam"), kembalikan objek JSON kosong {}.
        5.  Format Output: Anda HARUS mengembalikan satu objek JSON yang bersih. Jangan bungkus dengan markdown atau teks tambahan.
        Contoh untuk "Bawang Putih": { "nutrition": { "calories_kcal": 149, "protein_g": 6.4, "fat_g": 0.5, "carbs_g": 33.1, "fiber_g": 2.1 }, "category": "Bumbu", "price_per_100g": 4000, "unit_conversions": { "siung": 5 } }
    `;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    try {
        const response = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' }, httpsAgent });
        const text = response.data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(text);
        if (data.unit_conversions && typeof data.unit_conversions !== 'string') {
            data.unit_conversions = JSON.stringify(data.unit_conversions);
        }
        log.info('Respons data AI lengkap berhasil di-parse:', data);
        return data;
    } catch (error) {
        log.error('Error saat memanggil data AI lengkap:', error.message);
        throw new Error("Gagal mengambil data dari AI. Periksa koneksi atau format respons dari AI.");
    }
}

async function updateFoodInDb(db, foodData) {
    try {
        const validatedFood = foodSchema.parse(foodData);
        const sql = `UPDATE foods SET 
            name = ?, serving_size_g = ?, calories_kcal = ?, carbs_g = ?, 
            protein_g = ?, fat_g = ?, fiber_g = ?, price_per_100g = ?, category = ?, unit_conversions = ?
            WHERE id = ?`;
        const params = [
            validatedFood.name, validatedFood.serving_size_g, validatedFood.calories_kcal,
            validatedFood.carbs_g, validatedFood.protein_g, validatedFood.fat_g, validatedFood.fiber_g,
            validatedFood.price_per_100g, validatedFood.category,
            typeof validatedFood.unit_conversions === 'object' ? JSON.stringify(validatedFood.unit_conversions) : validatedFood.unit_conversions,
            validatedFood.id
        ];
        await db.runAsync(sql, params);
        return { success: true };
    } catch (err) {
        log.error('Gagal memperbarui bahan di DB:', err);
        throw err;
    }
}


function registerFoodHandlers(ipcMain, db) {
    ipcMain.handle('db:get-foods', async () => db.allAsync("SELECT * FROM foods ORDER BY usage_count DESC, name ASC"));

    ipcMain.handle('db:add-food', async (event, food) => {
        try {
            const validatedFood = foodSchema.parse(food);
            const sql = `INSERT INTO foods (name, serving_size_g, calories_kcal, carbs_g, protein_g, fat_g, fiber_g, price_per_100g, category, unit_conversions, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const params = [
                validatedFood.name, validatedFood.serving_size_g, validatedFood.calories_kcal,
                validatedFood.carbs_g, validatedFood.protein_g, validatedFood.fat_g, validatedFood.fiber_g,
                validatedFood.price_per_100g, validatedFood.category,
                validatedFood.unit_conversions, new Date().toISOString()
            ];
            const result = await db.runAsync(sql, params);
            return { id: result.lastID, ...validatedFood };
        } catch (err) {
            log.error('Gagal menambahkan bahan:', err);
            throw err;
        }
    });

    ipcMain.handle('db:update-food', async (event, food) => updateFoodInDb(db, food));

    ipcMain.handle('db:delete-food', async (event, id) => {
        await db.runAsync("DELETE FROM foods WHERE id = ?", [id]);
        return { success: true };
    });

    ipcMain.handle('ai:get-grounded-food-data', async (event, foodName) => {
        const apiKeyRow = await db.getAsync("SELECT value FROM settings WHERE key = 'googleApiKey'");
        const apiKey = apiKeyRow?.value;
        if (!apiKey) throw new Error("Kunci API Google AI belum diatur.");
        return getGroundedFoodDataWithConversions(apiKey, foodName);
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
