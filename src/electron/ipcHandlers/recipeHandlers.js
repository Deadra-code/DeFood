// Lokasi file: src/electron/ipcHandlers/recipeHandlers.js
// Deskripsi: (LENGKAP & TERBARU) Handler IPC untuk semua operasi terkait resep,
//            termasuk penambahan, pembaruan, penghapusan, duplikasi,
//            manajemen bahan, dan integrasi AI, serta margin keuntungan per resep.

const log = require('electron-log');
const { ingredientBulkSchema, updateIngredientSchema, updateIngredientOrderSchema } = require('../schemas.cjs');
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

        if (!response.data.candidates || response.data.candidates.length === 0) {
            log.warn('AI response did not contain candidates.', response.data);
            throw new Error("AI tidak memberikan respons yang valid.");
        }

        const text = response.data.candidates[0].content.parts[0].text;
        if (isJsonOutput) {
            return JSON.parse(text.replace(/```json|```/g, '').trim());
        }
        return text;
    } catch (error) {
        log.error('Error saat memanggil Google AI:', error.message);
        if (error.response) {
            log.error('Respons Data AI:', error.response.data);
            if (error.response.status === 400) {
                throw new Error("Permintaan ke AI tidak valid. Periksa prompt atau format data.");
            } else if (error.response.status === 429) {
                throw new Error("Terlalu banyak permintaan ke AI. Coba lagi nanti.");
            } else if (error.response.status === 403) {
                 throw new Error("Kunci API tidak valid atau tidak memiliki izin.");
            }
        } else if (error.request) {
            throw new Error("Tidak ada respons dari server AI. Periksa koneksi internet Anda.");
        }
        throw new Error("Gagal berkomunikasi dengan AI karena kesalahan tidak diketahui.");
    }
}

function registerRecipeHandlers(ipcMain, db) {
    const getApiKey = async () => {
        const row = await db.getAsync("SELECT value FROM settings WHERE key = 'googleApiKey'");
        const apiKey = row?.value;
        if (!apiKey) throw new Error("Kunci API Google AI belum diatur.");
        return apiKey;
    };

    ipcMain.handle('db:get-recipes', async () => db.allAsync("SELECT * FROM recipes ORDER BY name ASC"));
    
    ipcMain.handle('db:add-recipe', async (event, recipe) => {
        const sql = "INSERT INTO recipes (name, description, instructions, servings, cost_operational_recipe, cost_labor_recipe, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const params = [recipe.name, recipe.description || '', recipe.instructions || '', recipe.servings || 1, 0, 0, new Date().toISOString()];
        const result = await db.runAsync(sql, params);
        return { id: result.lastID, ...recipe, cost_operational_recipe: 0, cost_labor_recipe: 0, margin_percent: 50 };
    });

    ipcMain.handle('db:update-recipe-details', async (event, recipe) => {
        const { id, name, description, instructions, servings, ingredients, cost_operational_recipe, cost_labor_recipe, margin_percent } = recipe;
        await db.runAsync('BEGIN TRANSACTION');
        try {
            const sql = `UPDATE recipes SET 
                name = ?, description = ?, instructions = ?, servings = ?, 
                cost_operational_recipe = ?, cost_labor_recipe = ?, margin_percent = ? 
                WHERE id = ?`;
            await db.runAsync(sql, [name, description, instructions, servings || 1, cost_operational_recipe || 0, cost_labor_recipe || 0, margin_percent === undefined ? 50 : margin_percent, id]);
            
            await db.runAsync("DELETE FROM recipe_ingredients WHERE recipe_id = ?", [id]);
            if (ingredients && ingredients.length > 0) {
                const insertSql = "INSERT INTO recipe_ingredients (recipe_id, food_id, quantity, unit, display_order) VALUES (?, ?, ?, ?, ?)";
                for (let i = 0; i < ingredients.length; i++) {
                    const ing = ingredients[i];
                    const foodId = ing.food ? ing.food.id : ing.food_id;
                    if (!foodId) {
                        log.warn(`Melewati bahan '${ing.food.name}' karena tidak memiliki ID yang valid.`);
                        continue;
                    }
                    await db.runAsync(insertSql, [id, foodId, ing.quantity, ing.unit, i]);
                }
            }
            await db.runAsync('COMMIT');
            return { success: true };
        } catch (err) {
            await db.runAsync('ROLLBACK');
            log.error(`Gagal memperbarui resep ${id}:`, err);
            throw err;
        }
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
            
            const sql = `INSERT INTO recipes (name, description, instructions, servings, cost_operational_recipe, cost_labor_recipe, margin_percent, created_at) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            const params = [
                newName, originalRecipe.description, originalRecipe.instructions, 
                originalRecipe.servings || 1, originalRecipe.cost_operational_recipe || 0, 
                originalRecipe.cost_labor_recipe || 0, originalRecipe.margin_percent || 50, 
                new Date().toISOString()
            ];
            const newRecipeResult = await db.runAsync(sql, params);
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
            return finalNewRecipe;
        } catch (err) {
            await db.runAsync('ROLLBACK');
            log.error(`Gagal menduplikasi resep ${recipeId}:`, err);
            throw err;
        }
    });

    ipcMain.handle('db:get-ingredients-for-recipe', async (event, recipeId) => {
        const sql = `SELECT ri.id as recipe_ingredient_id, ri.quantity, ri.unit, ri.display_order, f.*, f.unit_conversions as food_unit_conversions FROM recipe_ingredients ri JOIN foods f ON ri.food_id = f.id WHERE ri.recipe_id = ? ORDER BY ri.display_order ASC`;
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
                return { success: true };
            } catch (err) {
                await db.runAsync('ROLLBACK');
                throw err;
            }
        } catch (err) {
            throw new Error("Data yang dikirim tidak valid.");
        }
    });

    ipcMain.handle('db:delete-ingredient-from-recipe', async (event, id) => {
        await db.runAsync("DELETE FROM recipe_ingredients WHERE id = ?", [id]);
        return { success: true };
    });

    ipcMain.handle('db:delete-ingredients-bulk', async (event, ids) => {
        if (!Array.isArray(ids) || ids.length === 0) throw new Error("Payload tidak valid.");
        const placeholders = ids.map(() => '?').join(',');
        await db.runAsync(`DELETE FROM recipe_ingredients WHERE id IN (${placeholders})`, ids);
        return { success: true, count: ids.length };
    });

    ipcMain.handle('db:update-ingredient-order', async (event, payload) => {
        const orderedIngredients = updateIngredientOrderSchema.parse(payload);
        await Promise.all(orderedIngredients.map((ing, i) => db.runAsync("UPDATE recipe_ingredients SET display_order = ? WHERE id = ?", [i, ing.id])));
        return { success: true };
    });

    ipcMain.handle('db:update-ingredient', async (event, payload) => {
        const { id, quantity, unit } = updateIngredientSchema.parse(payload);
        await db.runAsync("UPDATE recipe_ingredients SET quantity = ?, unit = ? WHERE id = ?", [quantity, unit, id]);
        return { success: true };
    });

    ipcMain.handle('ai:suggest-recipe-names', async (event, ingredients) => {
        const apiKey = await getApiKey();
        const ingredientNames = ingredients.map(ing => ing.food.name).join(', ');
        const prompt = `Berdasarkan bahan: ${ingredientNames}, sarankan 5 nama resep kreatif dalam Bahasa Indonesia. Kembalikan objek JSON dengan kunci "names" yang merupakan array string.`;
        return (await callGoogleAI(apiKey, prompt)).names || [];
    });

    ipcMain.handle('ai:generate-description', async (event, { recipeName, ingredients }) => {
        const apiKey = await getApiKey();
        const ingredientNames = ingredients.map(ing => ing.food.name).join(', ');
        const prompt = `Tulis deskripsi singkat yang menarik dalam Bahasa Indonesia untuk resep bernama "${recipeName}" dengan bahan: ${ingredientNames}. Kembalikan objek JSON dengan kunci "description" yang berisi teks.`;
        return (await callGoogleAI(apiKey, prompt)).description || "";
    });

    ipcMain.handle('ai:refine-description', async (event, existingDescription) => {
        const apiKey = await getApiKey();
        const prompt = `Sempurnakan deskripsi resep ini dalam Bahasa Indonesia: "${existingDescription}". Kembalikan objek JSON dengan kunci "description" yang berisi teks yang telah disempurnakan.`;
        return (await callGoogleAI(apiKey, prompt)).description || "";
    });

    ipcMain.handle('ai:generate-instructions', async (event, { recipeName, ingredients }) => {
        const apiKey = await getApiKey();
        const ingredientNames = ingredients.map(ing => `${ing.food.name} (${ing.quantity} ${ing.unit})`).join(', ');
        const prompt = `Sebagai penulis resep, buat langkah-langkah memasak yang jelas dengan gaya naratif untuk resep "${recipeName}" menggunakan bahan: ${ingredientNames}. ATURAN: Seluruh teks HARUS dalam Bahasa Indonesia. Gunakan format bernomor (1., 2., dst.). JANGAN gunakan format lain. Kembalikan objek JSON dengan satu kunci "instructions" yang berisi seluruh teks sebagai satu string.`;
        return (await callGoogleAI(apiKey, prompt)).instructions || "";
    });
}

module.exports = { registerRecipeHandlers };
