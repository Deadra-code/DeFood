import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
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
