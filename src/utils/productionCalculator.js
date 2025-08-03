// Lokasi file: src/utils/productionCalculator.js
// Deskripsi: (DIPERBARUI) Logika inti sekarang juga menghitung rata-rata margin,
//            total profit, dan rekomendasi harga jual gabungan.

import { calculateRecipeTotals } from './nutritionCalculator';

/**
 * Menggabungkan daftar bahan, menjumlahkan kuantitas untuk bahan dan satuan yang sama.
 * @param {Array} allIngredients - Array dari semua objek bahan yang sudah diskalakan.
 * @returns {Array} Daftar belanja yang sudah digabungkan.
 */
function aggregateShoppingList(allIngredients) {
    const ingredientMap = new Map();

    allIngredients.forEach(ing => {
        const key = `${ing.food.id}-${ing.unit}`; // Kunci unik berdasarkan ID bahan dan satuan
        if (ingredientMap.has(key)) {
            ingredientMap.get(key).quantity += ing.quantity;
        } else {
            ingredientMap.set(key, { ...ing });
        }
    });

    return Array.from(ingredientMap.values()).sort((a, b) => a.food.name.localeCompare(b.food.name));
}

/**
 * Fungsi utama untuk menghitung seluruh rencana produksi.
 * @param {Object} plan - State rencana, format: { recipeId: { recipe, servings } }
 * @param {Object} ingredientsData - Data bahan untuk setiap resep, format: { recipeId: [ingredients] }
 * @returns {Object} Hasil kalkulasi yang lengkap.
 */
export function calculateProductionPlan(plan, ingredientsData) {
    const allScaledIngredients = [];
    let totalOperationalCost = 0;
    let totalLaborCost = 0;
    
    // --- BARU: Variabel untuk menghitung rata-rata margin ---
    let totalMarginSum = 0;
    let recipeCountWithMargin = 0;

    const initialResult = {
        shoppingList: [],
        totalCost: { hpp: 0, operational: 0, labor: 0, totalModal: 0, averageMargin: 0, profit: 0, sellingPrice: 0 },
        totalNutrition: { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
    };

    if (Object.keys(plan).length === 0) {
        return initialResult;
    }

    for (const recipeId in plan) {
        const { recipe, servings } = plan[recipeId];
        const ingredients = ingredientsData[recipeId];

        if (!recipe || !ingredients || ingredients.length === 0) {
            continue;
        }

        const originalServings = recipe.servings > 0 ? recipe.servings : 1;
        const scalingFactor = servings / originalServings;

        ingredients.forEach(ing => {
            allScaledIngredients.push({
                ...ing,
                quantity: ing.quantity * scalingFactor,
            });
        });

        totalOperationalCost += (recipe.cost_operational_recipe || 0) * scalingFactor;
        totalLaborCost += (recipe.cost_labor_recipe || 0) * scalingFactor;

        // --- BARU: Akumulasi margin dari setiap resep ---
        totalMarginSum += recipe.margin_percent === undefined ? 50 : parseFloat(recipe.margin_percent);
        recipeCountWithMargin++;
    }

    const shoppingList = aggregateShoppingList(allScaledIngredients);
    const nutritionAndHpp = calculateRecipeTotals(shoppingList);
    
    const totalModal = nutritionAndHpp.price + totalOperationalCost + totalLaborCost;
    
    // --- BARU: Kalkulasi profit dan harga jual ---
    const averageMargin = recipeCountWithMargin > 0 ? totalMarginSum / recipeCountWithMargin : 0;
    const profit = totalModal * (averageMargin / 100);
    const sellingPrice = totalModal + profit;
    const roundedSellingPrice = Math.ceil(sellingPrice / 500) * 500;

    return {
        shoppingList,
        totalCost: {
            hpp: nutritionAndHpp.price,
            operational: totalOperationalCost,
            labor: totalLaborCost,
            totalModal: totalModal,
            averageMargin: averageMargin,
            profit: profit,
            sellingPrice: roundedSellingPrice,
        },
        totalNutrition: {
            calories: nutritionAndHpp.calories,
            protein: nutritionAndHpp.protein,
            fat: nutritionAndHpp.fat,
            carbs: nutritionAndHpp.carbs,
            fiber: nutritionAndHpp.fiber,
        },
    };
}
