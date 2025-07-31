// Lokasi file: jest.config.js
// Deskripsi: File konfigurasi dasar untuk framework pengujian Jest.

module.exports = {
  // Menunjukkan Jest untuk menggunakan environment berbasis JSDOM (browser-like)
  testEnvironment: 'jsdom',

  // Lokasi file setup yang akan dijalankan sebelum setiap tes
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],

  // Pola untuk mengabaikan folder saat menjalankan tes
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/dist/'],

  // Transformasi file: memberi tahu Jest cara memproses file selain .js
  // Di sini kita biarkan default create-react-app yang akan menanganinya
  // (biasanya melalui package.json atau konfigurasi internal)
  
  // Opsi untuk moduleNameMapper bisa ditambahkan di sini jika diperlukan
  // untuk menangani alias path atau aset statis.
};
