// Lokasi file: public/preload.js
// Deskripsi: Menambahkan API baru untuk info aplikasi dan pembaruan.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // --- API BARU ---
    getAppVersion: () => ipcRenderer.invoke('app:get-version'),
    onOpenAboutDialog: (callback) => ipcRenderer.on('open-about-dialog', callback),
    
    // Fungsi logging
    logError: (error) => ipcRenderer.send('log-error-to-main', error),

    // Pengaturan
    getSettings: () => ipcRenderer.invoke('db:get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('db:save-settings', settings),

    // Bahan Makanan (Foods)
    getFoods: () => ipcRenderer.invoke('db:get-foods'),
    addFood: (food) => ipcRenderer.invoke('db:add-food', food),
    updateFood: (food) => ipcRenderer.invoke('db:update-food', food),
    deleteFood: (id) => ipcRenderer.invoke('db:delete-food', id),

    // Resep (Recipes)
    getRecipes: () => ipcRenderer.invoke('db:get-recipes'),
    addRecipe: (recipe) => ipcRenderer.invoke('db:add-recipe', recipe),
    updateRecipeDetails: (recipe) => ipcRenderer.invoke('db:update-recipe-details', recipe),
    deleteRecipe: (id) => ipcRenderer.invoke('db:delete-recipe', id),
    duplicateRecipe: (id) => ipcRenderer.invoke('db:duplicate-recipe', id),

    // Bahan dalam Resep (Recipe Ingredients)
    getIngredientsForRecipe: (recipeId) => ipcRenderer.invoke('db:get-ingredients-for-recipe', recipeId),
    addIngredientsBulk: (data) => ipcRenderer.invoke('db:add-ingredients-bulk', data),
    deleteIngredientFromRecipe: (id) => ipcRenderer.invoke('db:delete-ingredient-from-recipe', id),
    deleteIngredientsBulk: (ids) => ipcRenderer.invoke('db:delete-ingredients-bulk', ids),
    updateIngredientOrder: (orderedIngredients) => ipcRenderer.invoke('db:update-ingredient-order', orderedIngredients),
    updateIngredient: (data) => ipcRenderer.invoke('db:update-ingredient', data),

    // Fungsi AI
    getGroundedFoodData: (foodName) => ipcRenderer.invoke('ai:get-grounded-food-data', foodName),
    testAIConnection: () => ipcRenderer.invoke('ai:test-connection'),
    suggestRecipeNames: (ingredients) => ipcRenderer.invoke('ai:suggest-recipe-names', ingredients),
    generateDescription: (data) => ipcRenderer.invoke('ai:generate-description', data),
    refineDescription: (description) => ipcRenderer.invoke('ai:refine-description', description),
    draftIngredients: (data) => ipcRenderer.invoke('ai:draft-ingredients', data),
    generateInstructions: (data) => ipcRenderer.invoke('ai:generate-instructions', data),
    
    // AI Agent untuk memproses bahan tidak dikenal
    processUnknownIngredients: (ingredientNames) => ipcRenderer.invoke('ai:process-unknown-ingredients', ingredientNames),
    
    // Listener untuk status progres AI
    onAiProcessStatus: (callback) => ipcRenderer.on('ai-process-status', (_event, value) => callback(value)),
    removeAiProcessStatusListener: () => ipcRenderer.removeAllListeners('ai-process-status'),
});
