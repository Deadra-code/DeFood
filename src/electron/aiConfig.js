// Lokasi file: src/electron/aiConfig.js
// Deskripsi: File konfigurasi terpusat untuk semua pengaturan terkait AI.

// Model yang digunakan untuk semua tugas generatif (analisis, saran, dll.)
// Mengubah model di sini akan mengubahnya di seluruh aplikasi.
const AI_MODEL_NAME = "gemini-2.5-flash-lite";

// URL dasar untuk Google Generative Language API.
const GOOGLE_AI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

/**
 * Membuat URL lengkap untuk memanggil model AI tertentu.
 * @param {string} apiKey - Kunci API pengguna.
 * @returns {string} URL lengkap untuk endpoint generateContent.
 */
function getAiApiUrl(apiKey) {
    return `${GOOGLE_AI_BASE_URL}${AI_MODEL_NAME}:generateContent?key=${apiKey}`;
}

module.exports = {
    getAiApiUrl,
};
