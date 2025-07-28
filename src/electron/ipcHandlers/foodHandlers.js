// Lokasi file: src/electron/ipcHandlers/foodHandlers.js
// Deskripsi: Diperbarui untuk menggunakan konfigurasi AI terpusat.

const log = require('electron-log');
const { foodSchema } = require('../schemas.cjs');
const axios = require('axios');
const https = require('https');
const { getAiApiUrl } = require('../aiConfig'); // --- BARU: Impor dari file konfigurasi ---

// Agen HTTPS khusus yang memaksa penggunaan koneksi IPv4.
const httpsAgent = new https.Agent({
    family: 4, // 4 = IPv4
});

function registerFoodHandlers(ipcMain, db) {
    // Handler CRUD dasar tidak berubah
    ipcMain.handle('db:get-foods', async () => {
        return db.allAsync("SELECT * FROM foods ORDER BY usage_count DESC, name ASC");
    });

    ipcMain.handle('db:add-food', async (event, food) => {
        try {
            const validatedFood = foodSchema.parse(food);
            const sql = `INSERT INTO foods 
                (name, serving_size_g, calories_kcal, carbs_g, protein_g, fat_g, fiber_g, price_per_100g, category, unit_conversions, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const params = [
                validatedFood.name, validatedFood.serving_size_g, validatedFood.calories_kcal, 
                validatedFood.carbs_g, validatedFood.protein_g, validatedFood.fat_g, validatedFood.fiber_g,
                validatedFood.price_per_100g, validatedFood.category, validatedFood.unit_conversions,
                new Date().toISOString()
            ];
            const result = await db.runAsync(sql, params);
            return { id: result.lastID, ...validatedFood };
        } catch (err) {
            log.error('Failed to add food:', err);
            throw err;
        }
    });

    ipcMain.handle('db:update-food', async (event, food) => {
        try {
            const validatedFood = foodSchema.parse(food);
            const sql = `UPDATE foods SET 
                name = ?, serving_size_g = ?, calories_kcal = ?, carbs_g = ?, 
                protein_g = ?, fat_g = ?, fiber_g = ?, price_per_100g = ?, category = ?, unit_conversions = ?
                WHERE id = ?`;
            const params = [
                validatedFood.name, validatedFood.serving_size_g, validatedFood.calories_kcal, 
                validatedFood.carbs_g, validatedFood.protein_g, validatedFood.fat_g, validatedFood.fiber_g,
                validatedFood.price_per_100g, validatedFood.category, validatedFood.unit_conversions,
                validatedFood.id
            ];
            await db.runAsync(sql, params);
            return { success: true };
        } catch (err) {
            log.error('Failed to update food:', err);
            throw err;
        }
    });

    ipcMain.handle('db:delete-food', async (event, id) => {
        await db.runAsync("DELETE FROM foods WHERE id = ?", [id]);
        return { success: true };
    });

    ipcMain.handle('ai:get-grounded-food-data', async (event, foodName) => {
        log.info(`Price & Nutrition AI request for: ${foodName}`);
        const apiKeyRow = await db.getAsync("SELECT value FROM settings WHERE key = 'googleApiKey'");
        const apiKey = apiKeyRow?.value;

        if (!apiKey) {
            throw new Error("Kunci API Google AI belum diatur di Pengaturan.");
        }

        // --- PERUBAHAN: Menggunakan fungsi terpusat untuk mendapatkan URL ---
        const url = getAiApiUrl(apiKey);
        
        const prompt = `
            Analyze the food item: "${foodName}". Your task is to provide its nutritional information, an estimated price, and its category.

            Follow these rules strictly:
            1.  **Handle Ambiguity:** For nutritional data, if the food name is ambiguous (e.g., "chicken thigh", "beef"), assume the most common, **raw** state. For meats, assume **skinless** unless specified.
            2.  **Find Estimated Price:**
                - Search for the price of "${foodName}" on popular Indonesian e-commerce sites (like Tokopedia, Blibli) or supermarket sites (like KlikIndomaret).
                - Find a common selling unit (e.g., per kg, per 500g, per pack).
                - **Calculate and normalize this price to a value per 100 grams in IDR (Rupiah).**
                - The final price must be a number, without currency symbols or commas.
                - If you cannot find a reliable price, use a value of 0. This is a fallback, always try to find a price first.
            3.  **Determine Category:** Based on the food item, determine its most appropriate category in Bahasa Indonesia. Examples: "Daging", "Sayuran", "Buah", "Produk Susu", "Bumbu", "Kacang & Biji-bijian".
            4.  **Output Format:** You MUST return the data in a strict JSON format. Do not wrap the JSON in markdown backticks.

            The JSON object must have these exact top-level keys: 'nutrition', 'category', 'price_per_100g', and 'sources'.

            JSON Structure Details:
            -   'nutrition': An object with keys "calories_kcal", "protein_g", "fat_g", "carbs_g", and "fiber_g". All values are numbers for a 100g serving.
            -   'category': A single string with the determined category.
            -   'price_per_100g': A single number representing the estimated price in IDR for 100 grams.
            -   'sources': An array of URL strings you used as a source for the nutritional information.

            If you absolutely cannot find reliable information for nutrition, return a JSON object with a key "error" and a value describing the reason.
        `;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
        };

        try {
            const response = await axios.post(url, payload, {
                headers: { 'Content-Type': 'application/json' },
                httpsAgent: httpsAgent
            });

            const text = response.data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
            const data = JSON.parse(text);
            
            log.info('Price & Nutrition AI response successfully parsed:', data);
            return data;
        } catch (error) {
            log.error('Error calling Price & Nutrition AI:', error.message);
            throw new Error("Gagal mengambil data dari AI. Periksa koneksi atau format respons dari AI.");
        }
    });
    
    ipcMain.handle('ai:test-connection', async (event) => {
        const apiKeyRow = await db.getAsync("SELECT value FROM settings WHERE key = 'googleApiKey'");
        const apiKey = apiKeyRow?.value;
        if (!apiKey) throw new Error("Kunci API belum diatur.");

        // --- PERUBAHAN: Menggunakan fungsi terpusat untuk mendapatkan URL ---
        const url = getAiApiUrl(apiKey);
        const payload = { contents: [{ parts: [{ text: "test" }] }] };

        try {
            await axios.post(url, payload, {
                headers: { 'Content-Type': 'application/json' },
                httpsAgent: httpsAgent
            });
            return { success: true };
        } catch (error) {
            log.error('Connection test failed:', error.message);
            throw new Error("Koneksi gagal.");
        }
    });
}

module.exports = { registerFoodHandlers };
