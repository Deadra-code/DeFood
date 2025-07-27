// Lokasi file: src/electron/ipcHandlers/index.js
// Deskripsi: Mendaftarkan handler pengaturan yang baru.

const { ipcMain } = require('electron');
const { registerFoodHandlers } = require('./foodHandlers');
const { registerRecipeHandlers } = require('./recipeHandlers');
const { registerSettingsHandlers } = require('./settingsHandlers'); // BARU

function registerIpcHandlers(db) {
    registerFoodHandlers(ipcMain, db);
    registerRecipeHandlers(ipcMain, db);
    registerSettingsHandlers(ipcMain, db); // BARU
}

module.exports = { registerIpcHandlers };
