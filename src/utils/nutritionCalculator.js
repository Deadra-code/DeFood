// Lokasi file: src/utils/nutritionCalculator.js
// Deskripsi: Fungsi kalkulator sekarang menerima faktor skala porsi.

/**
 * Menghitung total nutrisi dan harga dari daftar bahan, dengan memperhitungkan skala porsi.
 * @param {Array} ingredients - Daftar bahan.
 * @param {number} scalingFactor - Faktor pengali untuk porsi (misal: 2 untuk 2 porsi).
 * @returns {Object} Objek berisi total nutrisi dan harga.
 */
export function calculateRecipeTotals(ingredients = [], scalingFactor = 1) {
    const totals = {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        price: 0,
    };

    if (!ingredients || ingredients.length === 0) {
        return totals;
    }

    ingredients.forEach(item => {
        if (!item.food) return;

        const baseMultiplier = item.quantity_g / (item.food.serving_size_g || 100);
        const finalMultiplier = baseMultiplier * scalingFactor;

        totals.calories += (item.food.calories_kcal || 0) * finalMultiplier;
        totals.protein += (item.food.protein_g || 0) * finalMultiplier;
        totals.fat += (item.food.fat_g || 0) * finalMultiplier;
        totals.carbs += (item.food.carbs_g || 0) * finalMultiplier;
        totals.price += (item.food.price_per_100g || 0) * baseMultiplier * scalingFactor; // Harga juga diskalakan
    });

    return totals;
}
