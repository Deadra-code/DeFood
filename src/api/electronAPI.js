// Lokasi file: src/api/electronAPI.js
// Deskripsi: Menghapus fungsi helper untuk API AI.

const isApiReady = () => {
    if (window.api) return true;
    console.warn("Electron API (window.api) is not ready yet.");
    return false;
};

// --- Settings ---
export const getSettings = () => isApiReady() ? window.api.getSettings() : Promise.reject(new Error("API not ready"));
export const saveSettings = (settings) => isApiReady() ? window.api.saveSettings(settings) : Promise.reject(new Error("API not ready"));

// --- DIHAPUS: getAIFoodData ---

// --- Foods ---
export const getFoods = () => isApiReady() ? window.api.getFoods() : Promise.resolve([]);
export const addFood = (food) => isApiReady() ? window.api.addFood(food) : Promise.reject(new Error("API not ready"));
export const updateFood = (food) => isApiReady() ? window.api.updateFood(food) : Promise.reject(new Error("API not ready"));
export const deleteFood = (id) => isApiReady() ? window.api.deleteFood(id) : Promise.reject(new Error("API not ready"));

// --- Recipes ---
export const getRecipes = () => isApiReady() ? window.api.getRecipes() : Promise.resolve([]);
export const addRecipe = (recipe) => isApiReady() ? window.api.addRecipe(recipe) : Promise.reject(new Error("API not ready"));
export const updateRecipeDetails = (recipe) => isApiReady() ? window.api.updateRecipeDetails(recipe) : Promise.reject(new Error("API not ready"));
export const deleteRecipe = (id) => isApiReady() ? window.api.deleteRecipe(id) : Promise.reject(new Error("API not ready"));
export const duplicateRecipe = (id) => isApiReady() ? window.api.duplicateRecipe(id) : Promise.reject(new Error("API not ready"));

// --- Recipe Ingredients ---
export const getIngredientsForRecipe = (recipeId) => isApiReady() ? window.api.getIngredientsForRecipe(recipeId) : Promise.resolve([]);
export const addIngredientsBulk = (data) => isApiReady() ? window.api.addIngredientsBulk(data) : Promise.reject(new Error("API not ready"));
export const deleteIngredientFromRecipe = (id) => isApiReady() ? window.api.deleteIngredientFromRecipe(id) : Promise.reject(new Error("API not ready"));
export const updateIngredientOrder = (orderedIngredients) => isApiReady() ? window.api.updateIngredientOrder(orderedIngredients) : Promise.reject(new Error("API not ready"));
export const updateIngredient = (data) => isApiReady() ? window.api.updateIngredient(data) : Promise.reject(new Error("API not ready"));
