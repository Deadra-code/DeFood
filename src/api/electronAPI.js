// Lokasi file: src/api/electronAPI.js
// Deskripsi: Menambahkan fungsi helper untuk fitur baru.

const isApiReady = () => {
    if (window.api) return true;
    console.warn("Electron API (window.api) belum siap.");
    return false;
};

// --- FUNGSI BARU ---
export const getAppVersion = () => isApiReady() ? window.api.getAppVersion() : Promise.resolve('N/A');
export const onOpenAboutDialog = (callback) => isApiReady() ? window.api.onOpenAboutDialog(callback) : () => {};


// ... (semua fungsi lama tetap sama)
export const getSettings = () => isApiReady() ? window.api.getSettings() : Promise.reject(new Error("API belum siap"));
export const saveSettings = (settings) => isApiReady() ? window.api.saveSettings(settings) : Promise.reject(new Error("API belum siap"));
export const getGroundedFoodData = (foodName) => isApiReady() ? window.api.getGroundedFoodData(foodName) : Promise.reject(new Error("API belum siap"));
export const testAIConnection = () => isApiReady() ? window.api.testAIConnection() : Promise.reject(new Error("API belum siap"));
export const suggestRecipeNames = (ingredients) => isApiReady() ? window.api.suggestRecipeNames(ingredients) : Promise.reject(new Error("API belum siap"));
export const generateDescription = (data) => isApiReady() ? window.api.generateDescription(data) : Promise.reject(new Error("API belum siap"));
export const refineDescription = (description) => isApiReady() ? window.api.refineDescription(description) : Promise.reject(new Error("API belum siap"));
export const draftIngredients = (data) => isApiReady() ? window.api.draftIngredients(data) : Promise.reject(new Error("API belum siap"));
export const generateInstructions = (data) => isApiReady() ? window.api.generateInstructions(data) : Promise.reject(new Error("API belum siap"));
export const getFoods = () => isApiReady() ? window.api.getFoods() : Promise.resolve([]);
export const addFood = (food) => isApiReady() ? window.api.addFood(food) : Promise.reject(new Error("API belum siap"));
export const updateFood = (food) => isApiReady() ? window.api.updateFood(food) : Promise.reject(new Error("API belum siap"));
export const deleteFood = (id) => isApiReady() ? window.api.deleteFood(id) : Promise.reject(new Error("API belum siap"));
export const getRecipes = () => isApiReady() ? window.api.getRecipes() : Promise.resolve([]);
export const addRecipe = (recipe) => isApiReady() ? window.api.addRecipe(recipe) : Promise.reject(new Error("API belum siap"));
export const updateRecipeDetails = (recipe) => isApiReady() ? window.api.updateRecipeDetails(recipe) : Promise.reject(new Error("API belum siap"));
export const deleteRecipe = (id) => isApiReady() ? window.api.deleteRecipe(id) : Promise.reject(new Error("API belum siap"));
export const duplicateRecipe = (id) => isApiReady() ? window.api.duplicateRecipe(id) : Promise.reject(new Error("API belum siap"));
export const getIngredientsForRecipe = (recipeId) => isApiReady() ? window.api.getIngredientsForRecipe(recipeId) : Promise.resolve([]);
export const addIngredientsBulk = (data) => isApiReady() ? window.api.addIngredientsBulk(data) : Promise.reject(new Error("API belum siap"));
export const deleteIngredientFromRecipe = (id) => isApiReady() ? window.api.deleteIngredientFromRecipe(id) : Promise.reject(new Error("API belum siap"));
export const deleteIngredientsBulk = (ids) => isApiReady() ? window.api.deleteIngredientsBulk(ids) : Promise.reject(new Error("API belum siap"));
export const updateIngredientOrder = (orderedIngredients) => isApiReady() ? window.api.updateIngredientOrder(orderedIngredients) : Promise.reject(new Error("API belum siap"));
export const updateIngredient = (data) => isApiReady() ? window.api.updateIngredient(data) : Promise.reject(new Error("API belum siap"));
export const processUnknownIngredients = (ingredientNames) => isApiReady() ? window.api.processUnknownIngredients(ingredientNames) : Promise.reject(new Error("API belum siap"));
export const onAiProcessStatus = (callback) => isApiReady() ? window.api.onAiProcessStatus(callback) : () => {};
export const removeAiProcessStatusListener = () => isApiReady() ? window.api.removeAiProcessStatusListener() : () => {};
