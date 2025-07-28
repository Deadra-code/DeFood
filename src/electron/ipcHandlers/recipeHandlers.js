// Lokasi file: src/electron/ipcHandlers/recipeHandlers.js
// Deskripsi: Memperbaiki prompt AI untuk generate-instructions agar hasilnya lebih natural.

const log = require('electron-log');
const { ingredientBulkSchema, updateIngredientSchema, updateIngredientOrderSchema, foodSchema } = require('../schemas.cjs');
const axios = require('axios');
const https = require('https');
const { getAiApiUrl } = require('../aiConfig');

const httpsAgent = new https.Agent({ family: 4 });

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
        log.error('Error calling Google AI:', error.message);
        if (error.response) log.error('AI Response Data:', error.response.data);
        throw new Error("Gagal berkomunikasi dengan AI.");
    }
}

async function getGroundedFoodData(apiKey, foodName) {
    const prompt = `
        Analyze the food item: "${foodName}". Provide its nutritional information, a reliable estimated price, and its category.

        Follow these rules strictly:
        1.  **Find Estimated Price (PRIORITY):**
            - Your primary goal is to find a price. Be persistent.
            - Search using multiple queries like "harga ${foodName} per kg", "jual ${foodName} 1kg", or check Indonesian e-commerce sites (Tokopedia, HappyFresh, etc.).
            - Find a price for a common unit (e.g., per kg, per 500g).
            - **You MUST calculate and normalize this price to a value per 100 grams in IDR (Rupiah).** The final value must be a number.
            - **Only use 0 as the absolute last resort** if no reliable price can be found after multiple search attempts.
        2.  **Complete Nutritional Data:**
            - Assume the food is in its **raw** state and **skinless** for meats, unless specified.
            - You MUST return all five nutritional keys: "calories_kcal", "protein_g", "fat_g", "carbs_g", and "fiber_g".
            - If a value is not applicable or cannot be found, you MUST use the number 0. Do not omit any keys.
        3.  **Determine Category:** Determine the most appropriate category in Bahasa Indonesia.
        4.  **Output Format:** Return a strict JSON object with keys: 'nutrition' (object), 'category' (string), 'price_per_100g' (number), and 'sources' (array).
    `;
    return callGoogleAI(apiKey, prompt);
}

async function addFood(db, foodData) {
    const validatedFood = foodSchema.parse(foodData);
    const sql = `INSERT INTO foods (name, serving_size_g, calories_kcal, carbs_g, protein_g, fat_g, fiber_g, price_per_100g, category, unit_conversions, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        validatedFood.name, validatedFood.serving_size_g || 100, validatedFood.calories_kcal,
        validatedFood.carbs_g, validatedFood.protein_g, validatedFood.fat_g, validatedFood.fiber_g,
        validatedFood.price_per_100g, validatedFood.category, validatedFood.unit_conversions || '{}',
        new Date().toISOString()
    ];
    const result = await db.runAsync(sql, params);
    return db.getAsync("SELECT * FROM foods WHERE id = ?", [result.lastID]);
}

function registerRecipeHandlers(ipcMain, db) {
    // ... (Handler lain tetap sama)
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
            log.error('Invalid payload for add-ingredients-bulk:', err.flatten().fieldErrors);
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
            log.error('Invalid payload for update-ingredient-order:', err.flatten().fieldErrors);
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
            log.error(`Failed to update ingredient with payload ${JSON.stringify(payload)}:`, err);
            throw err;
        }
    });
    const getApiKey = async () => {
        const row = await db.getAsync("SELECT value FROM settings WHERE key = 'googleApiKey'");
        const apiKey = row?.value;
        if (!apiKey) throw new Error("Kunci API Google AI belum diatur.");
        return apiKey;
    };
    ipcMain.handle('ai:suggest-recipe-names', async (event, ingredients) => {
        const apiKey = await getApiKey();
        const ingredientNames = ingredients.map(ing => ing.food.name).join(', ');
        const prompt = `Based on: ${ingredientNames}, suggest 5 creative recipe names in Bahasa Indonesia. Return a JSON object with a key "names" which is an array of strings.`;
        const result = await callGoogleAI(apiKey, prompt);
        return result.names || [];
    });
    ipcMain.handle('ai:generate-description', async (event, { recipeName, ingredients }) => {
        const apiKey = await getApiKey();
        const ingredientNames = ingredients.map(ing => ing.food.name).join(', ');
        const prompt = `Write a short, appealing description in Bahasa Indonesia for a recipe called "${recipeName}" with ingredients: ${ingredientNames}. Return a JSON object with a key "description" containing the text.`;
        const result = await callGoogleAI(apiKey, prompt);
        return result.description || "";
    });
    ipcMain.handle('ai:refine-description', async (event, existingDescription) => {
        const apiKey = await getApiKey();
        const prompt = `Refine this recipe description in Bahasa Indonesia: "${existingDescription}". Return a JSON object with a key "description" containing the improved text.`;
        const result = await callGoogleAI(apiKey, prompt);
        return result.description || "";
    });
    ipcMain.handle('ai:draft-ingredients', async (event, recipeName) => {
        const apiKey = await getApiKey();
        const prompt = `List common ingredients for "${recipeName}". Provide a default unit for each in Bahasa Indonesia (e.g., "siung", "sdm", "gram"). Return a JSON object with a key "ingredients" which is an array of objects, each with "name" and "unit" keys.`;
        const result = await callGoogleAI(apiKey, prompt);
        return result.ingredients || [];
    });

    // --- PERBAIKAN: Prompt untuk instruksi disempurnakan ---
    ipcMain.handle('ai:generate-instructions', async (event, { recipeName, ingredients }) => {
        const apiKey = await getApiKey();
        const ingredientNames = ingredients.map(ing => `${ing.food.name} (${ing.quantity} ${ing.unit})`).join(', ');
        const prompt = `
            Anda adalah seorang penulis resep profesional.
            Tuliskan langkah-langkah memasak yang jelas, mudah diikuti, dan naratif untuk resep bernama "${recipeName}" dengan bahan-bahan berikut: ${ingredientNames}.

            Aturan Ketat:
            1.  Gunakan gaya bahasa yang natural dan mengalir, bukan format kaku.
            2.  Mulai setiap langkah dengan nomor diikuti titik (contoh: "1. ...", "2. ...").
            3.  Pastikan setiap langkah ada di baris baru.
            4.  JANGAN gunakan format aneh seperti bold (**), asterisk (*), atau judul tambahan.
            5.  Hanya berikan teks instruksinya saja.

            Anda HARUS mengembalikan respons dalam format JSON yang ketat dengan satu kunci "instructions" yang berisi seluruh teks instruksi sebagai satu string tunggal.

            Contoh output yang baik untuk resep "Nasi Goreng":
            {
                "instructions": "1. Panaskan sedikit minyak di wajan dengan api sedang. Tumis bawang putih dan bawang merah hingga harum.\\n2. Masukkan telur dan buat orak-arik hingga matang. Sisihkan di pinggir wajan.\\n3. Tambahkan nasi putih, kecap manis, garam, dan merica. Aduk cepat hingga semua bumbu tercampur rata dan nasi sedikit kering.\\n4. Koreksi rasa, tambahkan bumbu jika perlu. Sajikan segera selagi hangat."
            }
        `;
        const result = await callGoogleAI(apiKey, prompt);
        return result.instructions || "";
    });

    ipcMain.handle('ai:process-unknown-ingredients', async (event, ingredientNames) => {
        const apiKey = await getApiKey();
        const mainWindow = event.sender;

        const allFoods = await db.allAsync("SELECT * FROM foods");
        const knownFoodsMap = new Map(allFoods.map(f => [f.name.toLowerCase(), f]));
        
        const processedFoods = [];
        const failed = [];

        for (const name of ingredientNames) {
            const lowerCaseName = name.toLowerCase();
            if (knownFoodsMap.has(lowerCaseName)) {
                processedFoods.push(knownFoodsMap.get(lowerCaseName));
                continue;
            }

            try {
                mainWindow.send('ai-process-status', { message: `Mencari data untuk "${name}"...` });
                
                const aiData = await getGroundedFoodData(apiKey, name);
                if (aiData.error) throw new Error(aiData.error);

                const nutrition = aiData.nutrition || {};
                const newFoodPayload = {
                    name: name,
                    calories_kcal: Number(nutrition.calories_kcal) || 0,
                    protein_g: Number(nutrition.protein_g) || 0,
                    fat_g: Number(nutrition.fat_g) || 0,
                    carbs_g: Number(nutrition.carbs_g) || 0,
                    fiber_g: Number(nutrition.fiber_g) || 0,
                    price_per_100g: Number(aiData.price_per_100g) || 0,
                    category: aiData.category || 'Lainnya',
                };

                mainWindow.send('ai-process-status', { message: `Menyimpan "${name}" ke database...` });
                const addedFood = await addFood(db, newFoodPayload);
                processedFoods.push(addedFood);

            } catch (err) {
                log.error(`Failed to process ingredient "${name}":`, err);
                failed.push({ name, reason: err.message });
            }
        }
        
        return { processedFoods, failed };
    });
}

module.exports = { registerRecipeHandlers };
