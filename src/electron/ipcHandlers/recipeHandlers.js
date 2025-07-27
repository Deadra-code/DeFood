// Lokasi file: src/electron/ipcHandlers/recipeHandlers.js
// Deskripsi: Ditambahkan handler untuk duplikasi resep dan penambahan bahan massal.

const log = require('electron-log');

function registerRecipeHandlers(ipcMain, db) {
    /**
     * Mengambil semua resep dari database, diurutkan berdasarkan nama.
     */
    ipcMain.handle('db:get-recipes', async () => db.allAsync("SELECT * FROM recipes ORDER BY name"));
    
    /**
     * Menambahkan resep baru ke database.
     */
    ipcMain.handle('db:add-recipe', async (event, recipe) => {
        const sql = "INSERT INTO recipes (name, description, instructions, created_at) VALUES (?, ?, ?, ?)";
        const params = [recipe.name, recipe.description || '', recipe.instructions || '', new Date().toISOString()];
        const result = await db.runAsync(sql, params);
        return { id: result.lastID, ...recipe };
    });

    /**
     * Memperbarui detail dari resep yang sudah ada.
     */
    ipcMain.handle('db:update-recipe-details', async (event, recipe) => {
        const sql = "UPDATE recipes SET name = ?, description = ?, instructions = ? WHERE id = ?";
        const params = [recipe.name, recipe.description, recipe.instructions, recipe.id];
        await db.runAsync(sql, params);
        return { success: true };
    });

    /**
     * Menghapus resep dari database.
     */
    ipcMain.handle('db:delete-recipe', async (event, recipeId) => {
        await db.runAsync("DELETE FROM recipes WHERE id = ?", [recipeId]);
        return { success: true };
    });

    /**
     * (BARU) Menduplikasi resep yang ada beserta semua bahannya.
     */
    ipcMain.handle('db:duplicate-recipe', async (event, recipeId) => {
        await db.runAsync('BEGIN TRANSACTION');
        try {
            // 1. Ambil data resep asli
            const originalRecipe = await db.getAsync("SELECT * FROM recipes WHERE id = ?", [recipeId]);
            if (!originalRecipe) {
                throw new Error("Resep tidak ditemukan.");
            }

            // 2. Buat resep baru
            const newName = `Salinan dari ${originalRecipe.name}`;
            const newRecipeSql = "INSERT INTO recipes (name, description, instructions, created_at) VALUES (?, ?, ?, ?)";
            const newRecipeParams = [newName, originalRecipe.description, originalRecipe.instructions, new Date().toISOString()];
            const newRecipeResult = await db.runAsync(newRecipeSql, newRecipeParams);
            const newRecipeId = newRecipeResult.lastID;

            // 3. Ambil semua bahan dari resep asli
            const originalIngredients = await db.allAsync("SELECT food_id, quantity_g, display_order FROM recipe_ingredients WHERE recipe_id = ?", [recipeId]);

            // 4. Salin semua bahan ke resep baru
            if (originalIngredients.length > 0) {
                const insertIngredientSql = "INSERT INTO recipe_ingredients (recipe_id, food_id, quantity_g, display_order) VALUES (?, ?, ?, ?)";
                for (const ing of originalIngredients) {
                    await db.runAsync(insertIngredientSql, [newRecipeId, ing.food_id, ing.quantity_g, ing.display_order]);
                }
            }

            await db.runAsync('COMMIT');
            
            // 5. Kembalikan objek resep baru yang lengkap
            const finalNewRecipe = await db.getAsync("SELECT * FROM recipes WHERE id = ?", [newRecipeId]);
            log.info(`Resep ${recipeId} berhasil diduplikasi menjadi resep ${newRecipeId}`);
            return finalNewRecipe;
        } catch (err) {
            await db.runAsync('ROLLBACK');
            log.error(`Gagal menduplikasi resep ${recipeId}:`, err);
            throw err;
        }
    });

    /**
     * Mengambil semua bahan yang terkait dengan satu resep.
     */
    ipcMain.handle('db:get-ingredients-for-recipe', async (event, recipeId) => {
        const sql = `
            SELECT ri.id, ri.quantity_g, ri.display_order, f.*
            FROM recipe_ingredients ri
            JOIN foods f ON ri.food_id = f.id
            WHERE ri.recipe_id = ?
            ORDER BY ri.display_order ASC`;
        const rows = await db.allAsync(sql, [recipeId]);
        return rows.map(row => {
            const { id, quantity_g, display_order, ...foodData } = row;
            return { id, quantity_g, display_order, food: foodData };
        });
    });

    /**
     * Menambahkan satu bahan ke resep dan menaikkan `usage_count` bahan tersebut.
     */
    ipcMain.handle('db:add-ingredient-to-recipe', async (event, { recipe_id, food_id, quantity_g }) => {
        await db.runAsync('BEGIN TRANSACTION');
        try {
            const orderResult = await db.getAsync("SELECT COUNT(*) as count FROM recipe_ingredients WHERE recipe_id = ?", [recipe_id]);
            const display_order = orderResult.count;
            const sql = "INSERT INTO recipe_ingredients (recipe_id, food_id, quantity_g, display_order) VALUES (?, ?, ?, ?)";
            const result = await db.runAsync(sql, [recipe_id, food_id, quantity_g, display_order]);
            
            const updateSql = "UPDATE foods SET usage_count = usage_count + 1 WHERE id = ?";
            await db.runAsync(updateSql, [food_id]);

            await db.runAsync('COMMIT');
            return { id: result.lastID };
        } catch (err) {
            await db.runAsync('ROLLBACK');
            log.error('Failed to add ingredient and update usage count:', err);
            throw err;
        }
    });

    /**
     * (BARU) Menambahkan beberapa bahan ke resep secara massal.
     */
    ipcMain.handle('db:add-ingredients-bulk', async (event, { recipe_id, ingredients }) => {
        if (!ingredients || ingredients.length === 0) {
            return { success: true };
        }
        await db.runAsync('BEGIN TRANSACTION');
        try {
            const orderResult = await db.getAsync("SELECT COUNT(*) as count FROM recipe_ingredients WHERE recipe_id = ?", [recipe_id]);
            let currentOrder = orderResult.count;
            
            const insertSql = "INSERT INTO recipe_ingredients (recipe_id, food_id, quantity_g, display_order) VALUES (?, ?, ?, ?)";
            const updateUsageSql = "UPDATE foods SET usage_count = usage_count + 1 WHERE id = ?";

            for (const ing of ingredients) {
                await db.runAsync(insertSql, [recipe_id, ing.food_id, ing.quantity_g, currentOrder]);
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
    });

    /**
     * Menghapus satu bahan dari resep.
     */
    ipcMain.handle('db:delete-ingredient-from-recipe', async (event, ingredientId) => {
        await db.runAsync("DELETE FROM recipe_ingredients WHERE id = ?", [ingredientId]);
        return { success: true };
    });
    
    /**
     * Memperbarui urutan bahan dalam sebuah resep.
     */
    ipcMain.handle('db:update-ingredient-order', async (event, orderedIngredients) => {
        if (!orderedIngredients || orderedIngredients.length === 0) {
            return { success: true };
        }
        const promises = orderedIngredients.map((ing, index) => 
            db.runAsync("UPDATE recipe_ingredients SET display_order = ? WHERE id = ?", [index, ing.id])
        );
        await Promise.all(promises);
        return { success: true };
    });

    /**
     * Memperbarui detail dari satu bahan dalam resep (misalnya jumlah).
     */
    ipcMain.handle('db:update-ingredient', async (event, { id, quantity_g }) => {
        try {
            const sql = "UPDATE recipe_ingredients SET quantity_g = ? WHERE id = ?";
            await db.runAsync(sql, [quantity_g, id]);
            return { success: true };
        } catch (err) {
            log.error(`Failed to update ingredient with id ${id}:`, err);
            throw err;
        }
    });
}

module.exports = { registerRecipeHandlers };
