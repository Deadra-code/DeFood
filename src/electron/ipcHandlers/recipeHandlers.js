// Lokasi file: src/electron/ipcHandlers/recipeHandlers.js
// Deskripsi: Ditingkatkan dengan validasi Zod yang ketat pada semua data masuk.

const log = require('electron-log');
// --- PERBAIKAN (Isu #1): Impor skema validasi baru ---
const { ingredientBulkSchema, updateIngredientSchema, updateIngredientOrderSchema } = require('../schemas.cjs');

function registerRecipeHandlers(ipcMain, db) {
    // Handler ini tidak berubah
    ipcMain.handle('db:get-recipes', async () => db.allAsync("SELECT * FROM recipes ORDER BY name"));
    
    // Handler ini tidak berubah (payload sederhana)
    ipcMain.handle('db:add-recipe', async (event, recipe) => {
        const sql = "INSERT INTO recipes (name, description, instructions, created_at) VALUES (?, ?, ?, ?)";
        const params = [recipe.name, recipe.description || '', recipe.instructions || '', new Date().toISOString()];
        const result = await db.runAsync(sql, params);
        return { id: result.lastID, ...recipe };
    });

    // Handler ini tidak berubah (payload sederhana)
    ipcMain.handle('db:update-recipe-details', async (event, recipe) => {
        const sql = "UPDATE recipes SET name = ?, description = ?, instructions = ? WHERE id = ?";
        const params = [recipe.name, recipe.description, recipe.instructions, recipe.id];
        await db.runAsync(sql, params);
        return { success: true };
    });

    // Handler ini tidak berubah
    ipcMain.handle('db:delete-recipe', async (event, recipeId) => {
        await db.runAsync("DELETE FROM recipes WHERE id = ?", [recipeId]);
        return { success: true };
    });

    // Handler ini tidak berubah
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

    // Handler ini tidak berubah
    ipcMain.handle('db:get-ingredients-for-recipe', async (event, recipeId) => {
        const sql = `
            SELECT ri.id, ri.quantity, ri.unit, ri.display_order, f.*, f.unit_conversions as food_unit_conversions
            FROM recipe_ingredients ri
            JOIN foods f ON ri.food_id = f.id
            WHERE ri.recipe_id = ?
            ORDER BY ri.display_order ASC`;
        const rows = await db.allAsync(sql, [recipeId]);
        return rows.map(row => {
            const { id, quantity, unit, display_order, food_unit_conversions, ...foodData } = row;
            return { id, quantity, unit, display_order, food: { ...foodData, unit_conversions: food_unit_conversions } };
        });
    });

    // --- PERBAIKAN (Isu #1): Menambahkan validasi Zod pada payload ---
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

    // Handler ini tidak berubah
    ipcMain.handle('db:delete-ingredient-from-recipe', async (event, ingredientId) => {
        await db.runAsync("DELETE FROM recipe_ingredients WHERE id = ?", [ingredientId]);
        return { success: true };
    });
    
    // --- PERBAIKAN (Isu #1): Menambahkan validasi Zod pada payload ---
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

    // --- PERBAIKAN (Isu #1): Menambahkan validasi Zod pada payload ---
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
}

module.exports = { registerRecipeHandlers };
