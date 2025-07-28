// Lokasi file: src/electron/ipcHandlers/index.js
// Deskripsi: Titik pusat untuk mendaftarkan semua IPC handler.

const { ipcMain } = require('electron');
const { registerFoodHandlers } = require('./foodHandlers');
const { registerRecipeHandlers } = require('./recipeHandlers');
const { registerSettingsHandlers } = require('./settingsHandlers');

function registerIpcHandlers(db) {
    registerFoodHandlers(ipcMain, db);
    registerRecipeHandlers(ipcMain, db);
    registerSettingsHandlers(ipcMain, db);
}

module.exports = { registerIpcHandlers };
