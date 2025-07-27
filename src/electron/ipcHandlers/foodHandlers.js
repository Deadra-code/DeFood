// Lokasi file: src/electron/ipcHandlers/foodHandlers.js
// Deskripsi: Versi lengkap dan terbaru untuk menangani CRUD bahan makanan,
//            termasuk kolom 'category'.

const log = require('electron-log');
const { z } = require('zod');
const { foodSchema } = require('../schemas.cjs');

function registerFoodHandlers(ipcMain, db) {
    /**
     * Mengambil semua bahan makanan dari database.
     * Diurutkan berdasarkan bahan yang paling sering digunakan, lalu berdasarkan nama.
     */
    ipcMain.handle('db:get-foods', async () => {
        return db.allAsync("SELECT * FROM foods ORDER BY usage_count DESC, name ASC");
    });

    /**
     * Menambahkan bahan makanan baru ke database.
     */
    ipcMain.handle('db:add-food', async (event, food) => {
        try {
            const validatedFood = foodSchema.parse(food);
            const sql = `INSERT INTO foods 
                (name, serving_size_g, calories_kcal, carbs_g, protein_g, fat_g, price_per_100g, category, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const params = [
                validatedFood.name, 
                validatedFood.serving_size_g, 
                validatedFood.calories_kcal, 
                validatedFood.carbs_g, 
                validatedFood.protein_g, 
                validatedFood.fat_g, 
                validatedFood.price_per_100g, 
                validatedFood.category, 
                new Date().toISOString()
            ];
            const result = await db.runAsync(sql, params);
            return { id: result.lastID, ...validatedFood };
        } catch (err) {
            if (err instanceof z.ZodError) {
                log.error('Food validation failed:', err.flatten());
                throw new Error('Data bahan tidak valid.');
            }
            if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE constraint failed: foods.name')) {
                log.warn(`Attempted to add duplicate food name: ${food.name}`);
                throw new Error(`Bahan dengan nama "${food.name}" sudah ada.`);
            }
            log.error('Failed to add food:', err);
            throw err;
        }
    });

    /**
     * Memperbarui bahan makanan yang ada di database.
     */
    ipcMain.handle('db:update-food', async (event, food) => {
        try {
            const validatedFood = foodSchema.parse(food);
            const sql = `UPDATE foods SET 
                name = ?, serving_size_g = ?, calories_kcal = ?, carbs_g = ?, 
                protein_g = ?, fat_g = ?, price_per_100g = ?, category = ?
                WHERE id = ?`;
            const params = [
                validatedFood.name, 
                validatedFood.serving_size_g, 
                validatedFood.calories_kcal, 
                validatedFood.carbs_g, 
                validatedFood.protein_g, 
                validatedFood.fat_g, 
                validatedFood.price_per_100g, 
                validatedFood.category, 
                validatedFood.id
            ];
            await db.runAsync(sql, params);
            return { success: true };
        } catch (err) {
            if (err instanceof z.ZodError) {
                log.error('Food validation failed:', err.flatten());
                throw new Error('Data bahan tidak valid.');
            }
            if (err.code === 'SQLITE_CONSTRAINT') {
                log.warn(`Attempted to update to a duplicate food name: ${food.name}`);
                throw new Error(`Nama bahan "${food.name}" sudah digunakan oleh bahan lain.`);
            }
            log.error('Failed to update food:', err);
            throw err;
        }
    });

    /**
     * Menghapus bahan makanan dari database.
     */
    ipcMain.handle('db:delete-food', async (event, id) => {
        await db.runAsync("DELETE FROM foods WHERE id = ?", [id]);
        return { success: true };
    });
}

module.exports = { registerFoodHandlers };
