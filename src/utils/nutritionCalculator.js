// Lokasi file: src/utils/nutritionCalculator.js
// Deskripsi: (DIPERBARUI) Menambahkan pemeriksaan `Array.isArray` untuk memastikan
//            fungsi hanya berjalan jika inputnya adalah array, mencegah error.

/**
 * Mengkonversi jumlah bahan ke gram. Melempar error jika konversi tidak ditemukan.
 * @param {object} food - Objek bahan makanan.
 * @param {number} quantity - Jumlah.
 * @param {string} unit - Satuan.
 * @returns {number} Jumlah dalam gram.
 * @throws {Error} jika konversi untuk unit tidak ditemukan.
 */
function convertToGrams(food, quantity, unit) {
    if (!food || typeof quantity !== 'number' || !unit) {
        return 0;
    }
    const lowerCaseUnit = unit.toLowerCase();
    if (lowerCaseUnit === 'g' || lowerCaseUnit === 'gram') {
        return quantity;
    }

    try {
        const conversions = JSON.parse(food.unit_conversions || '{}');
        const conversionRate = conversions[unit];

        if (typeof conversionRate === 'number') {
            return quantity * conversionRate;
        }
    } catch (e) {
        console.error("Error parsing unit conversions:", e);
        throw new Error(`Format konversi unit untuk "${food.name}" salah.`);
    }
    
    throw new Error(`Konversi untuk satuan "${unit}" tidak ditemukan di bahan "${food.name}".`);
}

/**
 * Memvalidasi semua bahan sebelum kalkulasi.
 * @param {Array} ingredients - Daftar bahan dalam resep.
 * @returns {Array} Daftar pesan error. Kosong jika semua valid.
 */
export function validateIngredientsForCalculation(ingredients = []) {
    const errors = [];
    // PERBAIKAN: Pemeriksaan yang lebih kuat untuk memastikan input adalah array.
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
        return errors;
    }

    ingredients.forEach(item => {
        if (!item.food) {
            errors.push("Data bahan tidak lengkap pada salah satu item.");
            return;
        }
        try {
            convertToGrams(item.food, item.quantity, item.unit);
        } catch (error) {
            errors.push(error.message);
        }
    });

    return errors;
}


/**
 * Menghitung total nutrisi dan harga dari daftar bahan.
 * @param {Array} ingredients - Daftar bahan.
 * @returns {Object} Objek berisi total nutrisi dan harga.
 */
export function calculateRecipeTotals(ingredients = []) {
    const totals = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, price: 0 };

    // PERBAIKAN: Pemeriksaan yang lebih kuat untuk memastikan input adalah array.
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
        return totals;
    }

    ingredients.forEach(item => {
        if (!item.food) return;

        try {
            const quantityInGrams = convertToGrams(item.food, item.quantity, item.unit);
            if (quantityInGrams === 0) return;

            const multiplier = quantityInGrams / 100;

            totals.calories += (item.food.calories_kcal || 0) * multiplier;
            totals.protein += (item.food.protein_g || 0) * multiplier;
            totals.fat += (item.food.fat_g || 0) * multiplier;
            totals.carbs += (item.food.carbs_g || 0) * multiplier;
            totals.fiber += (item.food.fiber_g || 0) * multiplier;
            totals.price += (item.food.price_per_100g || 0) * multiplier;
        } catch (e) {
            console.error(`Skipping calculation for ${item.food.name} due to error: ${e.message}`);
        }
    });

    return totals;
}
