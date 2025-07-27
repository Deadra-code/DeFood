// Lokasi file: public/preload.js
// Deskripsi: Menghapus eksposur API AI dari context bridge.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Logging & Settings
    logError: (error) => ipcRenderer.send('log-error-to-main', error),
    getSettings: () => ipcRenderer.invoke('db:get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('db:save-settings', settings),

    // --- DIHAPUS: getAIFoodData ---

    // Foods
    getFoods: () => ipcRenderer.invoke('db:get-foods'),
    addFood: (food) => ipcRenderer.invoke('db:add-food', food),
    updateFood: (food) => ipcRenderer.invoke('db:update-food', food),
    deleteFood: (id) => ipcRenderer.invoke('db:delete-food', id),

    // Recipes
    getRecipes: () => ipcRenderer.invoke('db:get-recipes'),
    addRecipe: (recipe) => ipcRenderer.invoke('db:add-recipe', recipe),
    updateRecipeDetails: (recipe) => ipcRenderer.invoke('db:update-recipe-details', recipe),
    deleteRecipe: (id) => ipcRenderer.invoke('db:delete-recipe', id),
    duplicateRecipe: (id) => ipcRenderer.invoke('db:duplicate-recipe', id),
    
    // Recipe Ingredients
    getIngredientsForRecipe: (recipeId) => ipcRenderer.invoke('db:get-ingredients-for-recipe', recipeId),
    addIngredientsBulk: (data) => ipcRenderer.invoke('db:add-ingredients-bulk', data),
    deleteIngredientFromRecipe: (id) => ipcRenderer.invoke('db:delete-ingredient-from-recipe', id),
    updateIngredientOrder: (orderedIngredients) => ipcRenderer.invoke('db:update-ingredient-order', orderedIngredients),
    updateIngredient: (data) => ipcRenderer.invoke('db:update-ingredient', data),
});
