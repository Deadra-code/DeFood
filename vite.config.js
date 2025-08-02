// Lokasi: vite.config.js
// Deskripsi: (DIPERBARUI) Menggunakan sintaks CommonJS untuk menghilangkan peringatan build.

const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

// https://vitejs.dev/config/
module.exports = defineConfig({
  plugins: [react()],
  
  // Konfigurasi path dasar.
  // Menggunakan path relatif ('./') sangat penting untuk build Electron
  // agar semua aset dapat ditemukan dengan benar saat di-load melalui protokol `file://`.
  base: './',

  // Konfigurasi server pengembangan
  server: {
    port: 5173,
  },
});
