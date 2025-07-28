// Lokasi file: src/api/electronAPI.js
// Deskripsi: Menambahkan fungsi helper untuk bulk delete.

const isApiReady = () => {
    if (window.api) return true;
    console.warn("Electron API (window.api) is not ready yet.");
    return false;
};

// ... (semua fungsi lama tetap sama)
export const getSettings = () => isApiReady() ? window.api.getSettings() : Promise.reject(new Error("API not ready"));
export const saveSettings = (settings) => isApiReady() ? window.api.saveSettings(settings) : Promise.reject(new Error("API not ready"));
export const getGroundedFoodData = (foodName) => isApiReady() ? window.api.getGroundedFoodData(foodName) : Promise.reject(new Error("API not ready"));
export const testAIConnection = () => isApiReady() ? window.api.testAIConnection() : Promise.reject(new Error("API not ready"));
export const suggestRecipeNames = (ingredients) => isApiReady() ? window.api.suggestRecipeNames(ingredients) : Promise.reject(new Error("API not ready"));
export const generateDescription = (data) => isApiReady() ? window.api.generateDescription(data) : Promise.reject(new Error("API not ready"));
export const refineDescription = (description) => isApiReady() ? window.api.refineDescription(description) : Promise.reject(new Error("API not ready"));
export const draftIngredients = (recipeName) => isApiReady() ? window.api.draftIngredients(recipeName) : Promise.reject(new Error("API not ready"));
export const generateInstructions = (data) => isApiReady() ? window.api.generateInstructions(data) : Promise.reject(new Error("API not ready"));
export const getFoods = () => isApiReady() ? window.api.getFoods() : Promise.resolve([]);
export const addFood = (food) => isApiReady() ? window.api.addFood(food) : Promise.reject(new Error("API not ready"));
export const updateFood = (food) => isApiReady() ? window.api.updateFood(food) : Promise.reject(new Error("API not ready"));
export const deleteFood = (id) => isApiReady() ? window.api.deleteFood(id) : Promise.reject(new Error("API not ready"));
export const getRecipes = () => isApiReady() ? window.api.getRecipes() : Promise.resolve([]);
export const addRecipe = (recipe) => isApiReady() ? window.api.addRecipe(recipe) : Promise.reject(new Error("API not ready"));
export const updateRecipeDetails = (recipe) => isApiReady() ? window.api.updateRecipeDetails(recipe) : Promise.reject(new Error("API not ready"));
export const deleteRecipe = (id) => isApiReady() ? window.api.deleteRecipe(id) : Promise.reject(new Error("API not ready"));
export const duplicateRecipe = (id) => isApiReady() ? window.api.duplicateRecipe(id) : Promise.reject(new Error("API not ready"));
export const getIngredientsForRecipe = (recipeId) => isApiReady() ? window.api.getIngredientsForRecipe(recipeId) : Promise.resolve([]);
export const addIngredientsBulk = (data) => isApiReady() ? window.api.addIngredientsBulk(data) : Promise.reject(new Error("API not ready"));
export const deleteIngredientFromRecipe = (id) => isApiReady() ? window.api.deleteIngredientFromRecipe(id) : Promise.reject(new Error("API not ready"));
// --- FUNGSI BARU ---
export const deleteIngredientsBulk = (ids) => isApiReady() ? window.api.deleteIngredientsBulk(ids) : Promise.reject(new Error("API not ready"));
export const updateIngredientOrder = (orderedIngredients) => isApiReady() ? window.api.updateIngredientOrder(orderedIngredients) : Promise.reject(new Error("API not ready"));
export const updateIngredient = (data) => isApiReady() ? window.api.updateIngredient(data) : Promise.reject(new Error("API not ready"));


// --- FUNGSI UNTUK AI AGENT ---
export const processUnknownIngredients = (ingredientNames) => isApiReady() ? window.api.processUnknownIngredients(ingredientNames) : Promise.reject(new Error("API not ready"));
export const onAiProcessStatus = (callback) => isApiReady() ? window.api.onAiProcessStatus(callback) : () => {};
export const removeAiProcessStatusListener = () => isApiReady() ? window.api.removeAiProcessStatusListener() : () => {};
