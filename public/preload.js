// Lokasi file: public/preload.js
// Deskripsi: Mengekspos handler "AI Agent" dan listener status.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // ... (semua handler lama tetap sama)
    logError: (error) => ipcRenderer.send('log-error-to-main', error),
    getSettings: () => ipcRenderer.invoke('db:get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('db:save-settings', settings),
    getGroundedFoodData: (foodName) => ipcRenderer.invoke('ai:get-grounded-food-data', foodName),
    testAIConnection: () => ipcRenderer.invoke('ai:test-connection'),
    suggestRecipeNames: (ingredients) => ipcRenderer.invoke('ai:suggest-recipe-names', ingredients),
    generateDescription: (data) => ipcRenderer.invoke('ai:generate-description', data),
    refineDescription: (description) => ipcRenderer.invoke('ai:refine-description', description),
    draftIngredients: (recipeName) => ipcRenderer.invoke('ai:draft-ingredients', recipeName),
    generateInstructions: (data) => ipcRenderer.invoke('ai:generate-instructions', data),
    getFoods: () => ipcRenderer.invoke('db:get-foods'),
    addFood: (food) => ipcRenderer.invoke('db:add-food', food),
    updateFood: (food) => ipcRenderer.invoke('db:update-food', food),
    deleteFood: (id) => ipcRenderer.invoke('db:delete-food', id),
    getRecipes: () => ipcRenderer.invoke('db:get-recipes'),
    addRecipe: (recipe) => ipcRenderer.invoke('db:add-recipe', recipe),
    updateRecipeDetails: (recipe) => ipcRenderer.invoke('db:update-recipe-details', recipe),
    deleteRecipe: (id) => ipcRenderer.invoke('db:delete-recipe', id),
    duplicateRecipe: (id) => ipcRenderer.invoke('db:duplicate-recipe', id),
    getIngredientsForRecipe: (recipeId) => ipcRenderer.invoke('db:get-ingredients-for-recipe', recipeId),
    addIngredientsBulk: (data) => ipcRenderer.invoke('db:add-ingredients-bulk', data),
    deleteIngredientFromRecipe: (id) => ipcRenderer.invoke('db:delete-ingredient-from-recipe', id),
    updateIngredientOrder: (orderedIngredients) => ipcRenderer.invoke('db:update-ingredient-order', orderedIngredients),
    updateIngredient: (data) => ipcRenderer.invoke('db:update-ingredient', data),

    // --- API BARU UNTUK AI AGENT ---
    processUnknownIngredients: (ingredientNames) => ipcRenderer.invoke('ai:process-unknown-ingredients', ingredientNames),
    
    // --- LISTENER BARU UNTUK STATUS PROGRES ---
    onAiProcessStatus: (callback) => ipcRenderer.on('ai-process-status', (_event, value) => callback(value)),
    
    // --- PENTING: Hapus listener saat tidak diperlukan untuk mencegah memory leak ---
    removeAiProcessStatusListener: () => ipcRenderer.removeAllListeners('ai-process-status'),
});
