// Lokasi file: public/preload.js
// Deskripsi: API yang diekspos untuk impor teks telah dihapus.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    minimize: () => ipcRenderer.send('app:minimize'),
    maximize: () => ipcRenderer.send('app:maximize'),
    close: () => ipcRenderer.send('app:close'),
    quit: () => ipcRenderer.send('app:quit'),
    getAppVersion: () => ipcRenderer.invoke('app:get-version'),
    openLogs: () => ipcRenderer.invoke('app:open-logs'),
    checkForUpdates: () => ipcRenderer.invoke('app:check-for-updates'),
    onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_event, value) => callback(value)),
    logError: (error) => ipcRenderer.send('log-error-to-main', error),
    getSettings: () => ipcRenderer.invoke('db:get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('db:save-settings', settings),
    getFoods: () => ipcRenderer.invoke('db:get-foods'),
    addFood: (food) => ipcRenderer.invoke('db:add-food', food),
    updateFood: (food) => ipcRenderer.invoke('db:update-food', food),
    deleteFood: (id) => ipcRenderer.invoke('db:delete-food', id),
    deleteFoodsBulk: (ids) => ipcRenderer.invoke('db:delete-foods-bulk', ids),
    getRecipes: () => ipcRenderer.invoke('db:get-recipes'),
    addRecipe: (recipe) => ipcRenderer.invoke('db:add-recipe', recipe),
    updateRecipeDetails: (recipe) => ipcRenderer.invoke('db:update-recipe-details', recipe),
    deleteRecipe: (id) => ipcRenderer.invoke('db:delete-recipe', id),
    duplicateRecipe: (id) => ipcRenderer.invoke('db:duplicate-recipe', id),
    getIngredientsForRecipe: (recipeId) => ipcRenderer.invoke('db:get-ingredients-for-recipe', recipeId),
    addIngredientsBulk: (data) => ipcRenderer.invoke('db:add-ingredients-bulk', data),
    deleteIngredientFromRecipe: (id) => ipcRenderer.invoke('db:delete-ingredient-from-recipe', id),
    deleteIngredientsBulk: (ids) => ipcRenderer.invoke('db:delete-ingredients-bulk', ids),
    updateIngredientOrder: (orderedIngredients) => ipcRenderer.invoke('db:update-ingredient-order', orderedIngredients),
    updateIngredient: (data) => ipcRenderer.invoke('db:update-ingredient', data),
    getGroundedFoodData: (foodName) => ipcRenderer.invoke('ai:get-grounded-food-data', foodName),
    testAIConnection: () => ipcRenderer.invoke('ai:test-connection'),
    suggestRecipeNames: (ingredients) => ipcRenderer.invoke('ai:suggest-recipe-names', ingredients),
    generateDescription: (data) => ipcRenderer.invoke('ai:generate-description', data),
    refineDescription: (description) => ipcRenderer.invoke('ai:refine-description', description),
    generateInstructions: (data) => ipcRenderer.invoke('ai:generate-instructions', data),
    
    // --- DIHAPUS: Fungsionalitas yang terkait dengan impor teks ---
    // analyzeIngredientsText: (ingredientLines) => ipcRenderer.invoke('ai:analyze-ingredients-text', ingredientLines),
    // processUnknownIngredients: (ingredientNames) => ipcRenderer.invoke('ai:process-unknown-ingredients', ingredientNames),
    // onAiProcessStatus: (callback) => ipcRenderer.on('ai-process-status', (_event, value) => callback(value)),
    // removeAiProcessStatusListener: () => ipcRenderer.removeAllListeners('ai-process-status'),
    // draftIngredients: (data) => ipcRenderer.invoke('ai:draft-ingredients', data),
});
