// Lokasi file: src/hooks/useDebounce.js
// Deskripsi: Custom hook untuk menunda eksekusi fungsi atau pembaruan nilai.
//            Ini digunakan untuk meningkatkan performa pada fitur pencarian.

import { useState, useEffect } from 'react';

/**
 * Custom hook untuk men-debounce sebuah nilai.
 * @param {*} value Nilai yang ingin di-debounce.
 * @param {number} delay Waktu tunda dalam milidetik.
 * @returns {*} Nilai yang sudah di-debounce.
 */
export function useDebounce(value, delay) {
  // State untuk menyimpan nilai yang sudah di-debounce
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Atur timer untuk memperbarui nilai debounced setelah delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Bersihkan timer jika nilai atau delay berubah sebelum timer selesai.
    // Ini mencegah nilai diperbarui jika pengguna terus mengetik.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Hanya jalankan kembali efek jika nilai atau delay berubah

  return debouncedValue;
}
