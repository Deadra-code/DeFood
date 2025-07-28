// Lokasi file: src/electron/ipcHandlers/recipeHandlers.js
// Deskripsi: Handler untuk semua operasi terkait resep, dengan prompt AI yang sudah diterjemahkan.

const log = require('electron-log');
const { ingredientBulkSchema, updateIngredientSchema, updateIngredientOrderSchema, foodSchema } = require('../schemas.cjs');
const axios = require('axios');
const https = require('https');
const { getAiApiUrl } = require('../aiConfig');
const { getGroundedFoodDataWithConversions, updateFoodInDb } = require('./foodHandlers');

const httpsAgent = new https.Agent({ family: 4 });

// --- PERUBAHAN: Prompt AI telah diterjemahkan ke Bahasa Indonesia ---
async function callGoogleAI(apiKey, prompt, isJsonOutput = true) {
    const url = getAiApiUrl(apiKey);
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    try {
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' },
            httpsAgent: httpsAgent,
        });
        const text = response.data.candidates[0].content.parts[0].text;
        if (isJsonOutput) {
            return JSON.parse(text.replace(/```json|```/g, '').trim());
        }
        return text;
    } catch (error) {
        log.error('Error saat memanggil Google AI:', error.message);
        if (error.response) log.error('Respons Data AI:', error.response.data);
        throw new Error("Gagal berkomunikasi dengan AI.");
    }
}

// --- PERUBAHAN: Prompt AI telah diterjemahkan ke Bahasa Indonesia ---
async function getSpecificConversion(apiKey, foodName, unit) {
    const prompt = `
        Berapa berat tipikal dalam gram untuk 1 "${unit}" dari "${foodName}"?
        Aturan:
        - Berikan estimasi umum yang masuk akal.
        - Anda HARUS mengembalikan satu objek JSON bersih dengan satu kunci: "grams".
        - Nilai dari "grams" harus berupa angka.
        Contoh untuk "Bawang Putih" dan satuan "siung": { "grams": 5 }
    `;
    const result = await callGoogleAI(apiKey, prompt);
    return result.grams;
}

async function addFood(db, foodData) {
    const validatedFood = foodSchema.parse(foodData);
    const sql = `INSERT INTO foods (name, serving_size_g, calories_kcal, carbs_g, protein_g, fat_g, fiber_g, price_per_100g, category, unit_conversions, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        validatedFood.name, validatedFood.serving_size_g || 100, validatedFood.calories_kcal,
        validatedFood.carbs_g, validatedFood.protein_g, validatedFood.fat_g, validatedFood.fiber_g,
        validatedFood.price_per_100g, validatedFood.category,
        typeof validatedFood.unit_conversions === 'object' ? JSON.stringify(validatedFood.unit_conversions) : validatedFood.unit_conversions || '{}',
        new Date().toISOString()
    ];
    const result = await db.runAsync(sql, params);
    return db.getAsync("SELECT * FROM foods WHERE id = ?", [result.lastID]);
}

function registerRecipeHandlers(ipcMain, db) {
    const getApiKey = async () => {
        const row = await db.getAsync("SELECT value FROM settings WHERE key = 'googleApiKey'");
        const apiKey = row?.value;
        if (!apiKey) throw new Error("Kunci API Google AI belum diatur.");
        return apiKey;
    };

    ipcMain.handle('db:get-recipes', async () => db.allAsync("SELECT * FROM recipes ORDER BY name"));
    
    ipcMain.handle('db:add-recipe', async (event, recipe) => {
        const sql = "INSERT INTO recipes (name, description, instructions, created_at) VALUES (?, ?, ?, ?)";
        const params = [recipe.name, recipe.description || '', recipe.instructions || '', new Date().toISOString()];
        const result = await db.runAsync(sql, params);
        return { id: result.lastID, ...recipe };
    });

    ipcMain.handle('db:update-recipe-details', async (event, recipe) => {
        const sql = "UPDATE recipes SET name = ?, description = ?, instructions = ? WHERE id = ?";
        const params = [recipe.name, recipe.description, recipe.instructions, recipe.id];
        await db.runAsync(sql, params);
        return { success: true };
    });

    ipcMain.handle('db:delete-recipe', async (event, recipeId) => {
        await db.runAsync("DELETE FROM recipes WHERE id = ?", [recipeId]);
        return { success: true };
    });

    ipcMain.handle('db:duplicate-recipe', async (event, recipeId) => {
        await db.runAsync('BEGIN TRANSACTION');
        try {
            const originalRecipe = await db.getAsync("SELECT * FROM recipes WHERE id = ?", [recipeId]);
            if (!originalRecipe) throw new Error("Resep tidak ditemukan.");
            const newName = `Salinan dari ${originalRecipe.name}`;
            const newRecipeSql = "INSERT INTO recipes (name, description, instructions, created_at) VALUES (?, ?, ?, ?)";
            const newRecipeParams = [newName, originalRecipe.description, originalRecipe.instructions, new Date().toISOString()];
            const newRecipeResult = await db.runAsync(newRecipeSql, newRecipeParams);
            const newRecipeId = newRecipeResult.lastID;
            const originalIngredients = await db.allAsync("SELECT food_id, quantity, unit, display_order FROM recipe_ingredients WHERE recipe_id = ?", [recipeId]);
            if (originalIngredients.length > 0) {
                const insertIngredientSql = "INSERT INTO recipe_ingredients (recipe_id, food_id, quantity, unit, display_order) VALUES (?, ?, ?, ?, ?)";
                for (const ing of originalIngredients) {
                    await db.runAsync(insertIngredientSql, [newRecipeId, ing.food_id, ing.quantity, ing.unit, ing.display_order]);
                }
            }
            await db.runAsync('COMMIT');
            const finalNewRecipe = await db.getAsync("SELECT * FROM recipes WHERE id = ?", [newRecipeId]);
            log.info(`Resep ${recipeId} berhasil diduplikasi menjadi resep ${newRecipeId}`);
            return finalNewRecipe;
        } catch (err) {
            await db.runAsync('ROLLBACK');
            log.error(`Gagal menduplikasi resep ${recipeId}:`, err);
            throw err;
        }
    });

    ipcMain.handle('db:get-ingredients-for-recipe', async (event, recipeId) => {
        const sql = `
            SELECT 
                ri.id as recipe_ingredient_id, 
                ri.quantity, 
                ri.unit, 
                ri.display_order, 
                f.*, 
                f.unit_conversions as food_unit_conversions
            FROM recipe_ingredients ri
            JOIN foods f ON ri.food_id = f.id
            WHERE ri.recipe_id = ?
            ORDER BY ri.display_order ASC`;
        const rows = await db.allAsync(sql, [recipeId]);
        return rows.map(row => {
            const { recipe_ingredient_id, quantity, unit, display_order, food_unit_conversions, ...foodData } = row;
            return { id: recipe_ingredient_id, quantity, unit, display_order, food: { ...foodData, unit_conversions: food_unit_conversions } };
        });
    });

    ipcMain.handle('db:add-ingredients-bulk', async (event, payload) => {
        try {
            const { recipe_id, ingredients } = ingredientBulkSchema.parse(payload);
            await db.runAsync('BEGIN TRANSACTION');
            try {
                const orderResult = await db.getAsync("SELECT COUNT(*) as count FROM recipe_ingredients WHERE recipe_id = ?", [recipe_id]);
                let currentOrder = orderResult.count;
                const insertSql = "INSERT INTO recipe_ingredients (recipe_id, food_id, quantity, unit, display_order) VALUES (?, ?, ?, ?, ?)";
                const updateUsageSql = "UPDATE foods SET usage_count = usage_count + 1 WHERE id = ?";
                for (const ing of ingredients) {
                    await db.runAsync(insertSql, [recipe_id, ing.food_id, ing.quantity, ing.unit, currentOrder]);
                    await db.runAsync(updateUsageSql, [ing.food_id]);
                    currentOrder++;
                }
                await db.runAsync('COMMIT');
                log.info(`${ingredients.length} bahan berhasil ditambahkan ke resep ${recipe_id}`);
                return { success: true };
            } catch (err) {
                await db.runAsync('ROLLBACK');
                log.error(`Gagal menambahkan bahan massal ke resep ${recipe_id}:`, err);
                throw err;
            }
        } catch (err) {
            log.error('Payload tidak valid untuk add-ingredients-bulk:', err.flatten().fieldErrors);
            throw new Error("Data yang dikirim tidak valid.");
        }
    });

    ipcMain.handle('db:delete-ingredient-from-recipe', async (event, ingredientId) => {
        await db.runAsync("DELETE FROM recipe_ingredients WHERE id = ?", [ingredientId]);
        return { success: true };
    });

    ipcMain.handle('db:delete-ingredients-bulk', async (event, ingredientIds) => {
        if (!Array.isArray(ingredientIds) || ingredientIds.length === 0) {
            throw new Error("Payload tidak valid: harus berupa array ID.");
        }
        const placeholders = ingredientIds.map(() => '?').join(',');
        const sql = `DELETE FROM recipe_ingredients WHERE id IN (${placeholders})`;
        await db.runAsync(sql, ingredientIds);
        log.info(`${ingredientIds.length} bahan berhasil dihapus.`);
        return { success: true, count: ingredientIds.length };
    });

    ipcMain.handle('db:update-ingredient-order', async (event, payload) => {
        try {
            const orderedIngredients = updateIngredientOrderSchema.parse(payload);
            const promises = orderedIngredients.map((ing, index) =>
                db.runAsync("UPDATE recipe_ingredients SET display_order = ? WHERE id = ?", [index, ing.id])
            );
            await Promise.all(promises);
            return { success: true };
        } catch (err) {
            log.error('Payload tidak valid untuk update-ingredient-order:', err.flatten().fieldErrors);
            throw new Error("Data yang dikirim tidak valid.");
        }
    });

    ipcMain.handle('db:update-ingredient', async (event, payload) => {
        try {
            const { id, quantity, unit } = updateIngredientSchema.parse(payload);
            const sql = "UPDATE recipe_ingredients SET quantity = ?, unit = ? WHERE id = ?";
            await db.runAsync(sql, [quantity, unit, id]);
            return { success: true };
        } catch (err) {
            log.error(`Gagal memperbarui bahan dengan payload ${JSON.stringify(payload)}:`, err);
            throw err;
        }
    });

    // --- PERUBAHAN: Prompt AI telah diterjemahkan ke Bahasa Indonesia ---
    ipcMain.handle('ai:suggest-recipe-names', async (event, ingredients) => {
        const apiKey = await getApiKey();
        const ingredientNames = ingredients.map(ing => ing.food.name).join(', ');
        const prompt = `Berdasarkan bahan: ${ingredientNames}, sarankan 5 nama resep kreatif dalam Bahasa Indonesia. Kembalikan objek JSON dengan kunci "names" yang merupakan array string.`;
        const result = await callGoogleAI(apiKey, prompt);
        return result.names || [];
    });

    // --- PERUBAHAN: Prompt AI telah diterjemahkan ke Bahasa Indonesia ---
    ipcMain.handle('ai:generate-description', async (event, { recipeName, ingredients }) => {
        const apiKey = await getApiKey();
        const ingredientNames = ingredients.map(ing => ing.food.name).join(', ');
        const prompt = `Tulis deskripsi singkat yang menarik dalam Bahasa Indonesia untuk resep bernama "${recipeName}" dengan bahan: ${ingredientNames}. Kembalikan objek JSON dengan kunci "description" yang berisi teks.`;
        const result = await callGoogleAI(apiKey, prompt);
        return result.description || "";
    });

    // --- PERUBAHAN: Prompt AI telah diterjemahkan ke Bahasa Indonesia ---
    ipcMain.handle('ai:refine-description', async (event, existingDescription) => {
        const apiKey = await getApiKey();
        const prompt = `Sempurnakan deskripsi resep ini dalam Bahasa Indonesia: "${existingDescription}". Kembalikan objek JSON dengan kunci "description" yang berisi teks yang telah disempurnakan.`;
        const result = await callGoogleAI(apiKey, prompt);
        return result.description || "";
    });
    
    // --- PERUBAHAN: Prompt AI telah diterjemahkan ke Bahasa Indonesia ---
    ipcMain.handle('ai:draft-ingredients', async (event, { recipeName, servings }) => {
        const apiKey = await getApiKey();
        const safeServings = servings > 0 ? servings : 1;
        const prompt = `
            Buatkan daftar bahan-bahan umum untuk resep bernama "${recipeName}".
            Resep ini untuk ${safeServings} porsi. Sesuaikan jumlahnya.

            Untuk setiap bahan, berikan:
            1.  'name': Nama bahan dalam Bahasa Indonesia.
            2.  'quantity': Estimasi jumlah yang realistis (sebagai angka) untuk ${safeServings} porsi.
            3.  'unit': Satuan yang umum untuk jumlah tersebut dalam Bahasa Indonesia. Prioritaskan dari daftar ini jika sesuai: ['g', 'kg', 'ons', 'ml', 'l', 'sdm', 'sdt', 'butir', 'pcs', 'siung', 'buah', 'lembar', 'batang'].

            Anda HARUS mengembalikan objek JSON dengan kunci "ingredients" yang merupakan array objek. Setiap objek harus memiliki kunci "name", "quantity", dan "unit".
        `;
        const result = await callGoogleAI(apiKey, prompt);
        return result.ingredients || [];
    });

    // --- PERUBAHAN: Prompt AI telah diterjemahkan ke Bahasa Indonesia ---
    ipcMain.handle('ai:generate-instructions', async (event, { recipeName, ingredients }) => {
        const apiKey = await getApiKey();
        const ingredientNames = ingredients.map(ing => `${ing.food.name} (${ing.quantity} ${ing.unit})`).join(', ');
        const prompt = `
            Sebagai penulis resep profesional, buat langkah-langkah memasak yang jelas dengan gaya naratif untuk resep bernama "${recipeName}" menggunakan bahan-bahan ini: ${ingredientNames}.

            **ATURAN KRITIKAL:**
            1.  **Seluruh teks respons HARUS dalam Bahasa Indonesia.**
            2.  Gunakan bahasa yang alami dan mengalir, bukan format yang kaku.
            3.  Mulai setiap langkah dengan nomor diikuti titik (contoh: "1. ...").
            4.  Setiap langkah harus berada di baris baru.
            5.  JANGAN gunakan format khusus seperti tebal, miring, atau judul tambahan.
            6.  Anda HARUS mengembalikan objek JSON dengan satu kunci "instructions" yang berisi seluruh teks sebagai satu string.
        `;
        const result = await callGoogleAI(apiKey, prompt);
        return result.instructions || "";
    });

    ipcMain.handle('ai:process-unknown-ingredients', async (event, ingredientSuggestions) => {
        const apiKey = await getApiKey();
        const mainWindow = event.sender;

        const allFoods = await db.allAsync("SELECT * FROM foods");
        const knownFoodsMap = new Map(allFoods.map(f => [f.name.toLowerCase(), f]));
        
        const processedFoods = [];
        const failed = [];

        for (const ingredient of ingredientSuggestions) {
            const lowerCaseName = ingredient.name.toLowerCase();
            
            try {
                if (knownFoodsMap.has(lowerCaseName)) {
                    const existingFood = knownFoodsMap.get(lowerCaseName);
                    let conversions = {};
                    try {
                        conversions = JSON.parse(existingFood.unit_conversions || '{}');
                    } catch(e) { log.error("Tidak dapat mem-parse konversi yang ada:", e); }

                    const unitToFind = ingredient.unit;
                    if (unitToFind && unitToFind.toLowerCase() !== 'g' && unitToFind.toLowerCase() !== 'gram' && !conversions[unitToFind]) {
                        log.info(`Memperkaya data bahan "${ingredient.name}" dengan satuan "${unitToFind}" yang hilang`);
                        mainWindow.send('ai-process-status', { message: `Memperbarui konversi ${unitToFind} untuk "${ingredient.name}"...` });
                        const grams = await getSpecificConversion(apiKey, ingredient.name, unitToFind);
                        if (grams && typeof grams === 'number') {
                            conversions[unitToFind] = grams;
                            existingFood.unit_conversions = JSON.stringify(conversions);
                            
                            await updateFoodInDb(db, existingFood);
                            log.info(`Berhasil memperbarui "${ingredient.name}" dengan konversi baru.`);
                        }
                    }
                    processedFoods.push({ ...existingFood, quantity: ingredient.quantity, unit: ingredient.unit });
                } else {
                    mainWindow.send('ai-process-status', { message: `Mencari data untuk "${ingredient.name}"...` });
                    
                    const aiData = await getGroundedFoodDataWithConversions(apiKey, ingredient.name);
                    if (aiData.error) throw new Error(aiData.error);

                    let conversions = {};
                    try {
                        if (aiData.unit_conversions) {
                            conversions = JSON.parse(aiData.unit_conversions);
                        }
                    } catch (e) { log.error(`Gagal mem-parse konversi awal untuk ${ingredient.name}:`, aiData.unit_conversions); }

                    const unitToFind = ingredient.unit;
                    if (unitToFind && unitToFind.toLowerCase() !== 'g' && unitToFind.toLowerCase() !== 'gram' && !conversions[unitToFind]) {
                        log.info(`Konversi untuk "${unitToFind}" tidak ditemukan pada bahan baru "${ingredient.name}". Mengambil secara spesifik.`);
                        mainWindow.send('ai-process-status', { message: `Mencari konversi ${unitToFind} untuk "${ingredient.name}"...` });
                        const grams = await getSpecificConversion(apiKey, ingredient.name, unitToFind);
                        if (grams && typeof grams === 'number') {
                            conversions[unitToFind] = grams;
                        }
                    }
                    
                    const nutrition = aiData.nutrition || {};
                    const newFoodPayload = {
                        name: ingredient.name,
                        calories_kcal: Number(nutrition.calories_kcal || nutrition.calories || 0),
                        protein_g: Number(nutrition.protein_g || nutrition.protein || 0),
                        fat_g: Number(nutrition.fat_g || nutrition.fat || 0),
                        carbs_g: Number(nutrition.carbs_g || nutrition.carbohydrates_g || nutrition.carbohydrates || 0),
                        fiber_g: Number(nutrition.fiber_g || nutrition.fiber || 0),
                        price_per_100g: Number(aiData.price_per_100g || aiData.estimated_price_per_100g || aiData.estimated_price_idr_per_100g || 0),
                        category: aiData.category || 'Lainnya',
                        unit_conversions: JSON.stringify(conversions),
                    };

                    mainWindow.send('ai-process-status', { message: `Menyimpan "${ingredient.name}" ke database...` });
                    const addedFood = await addFood(db, newFoodPayload);
                    processedFoods.push({ ...addedFood, quantity: ingredient.quantity, unit: ingredient.unit });
                }
            } catch (err) {
                log.error(`Gagal memproses bahan "${ingredient.name}":`, err);
                failed.push({ name: ingredient.name, reason: err.message });
            }
        }
        
        return { processedFoods, failed };
    });
}

module.exports = { registerRecipeHandlers };
