// Lokasi file: src/electron/ipcHandlers/foodHandlers.js
// Deskripsi: Disederhanakan dengan menghapus semua logika dan dependensi AI.

const log = require('electron-log');
const { foodSchema } = require('../schemas.cjs');
// --- DIHAPUS: Impor pustaka Google AI SDK ---

function registerFoodHandlers(ipcMain, db) {
    // Handler untuk get, add, update, delete tidak berubah
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

    // --- DIHAPUS: Seluruh handler 'ai:get-food-data' telah dihapus. ---
}

module.exports = { registerFoodHandlers };
