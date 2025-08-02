// Lokasi file: src/lib/schemas.js
// Deskripsi: Menambahkan validasi untuk kolom 'unit_conversions' di sisi frontend.

import { z } from 'zod';

export const foodSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, { message: "Nama bahan minimal 2 karakter." }),
  
  serving_size_g: z.preprocess(
    (val) => Number(val) || 100,
    z.number().positive()
  ).default(100),

  calories_kcal: z.preprocess(
    (val) => Number(val),
    z.number({ required_error: "Kalori wajib diisi.", invalid_type_error: "Kalori harus berupa angka."}).min(0)
  ),
  protein_g: z.preprocess(
    (val) => Number(val),
    z.number({ required_error: "Protein wajib diisi.", invalid_type_error: "Protein harus berupa angka."}).min(0)
  ),
  fat_g: z.preprocess(
    (val) => Number(val),
    z.number({ required_error: "Lemak wajib diisi.", invalid_type_error: "Lemak harus berupa angka."}).min(0)
  ),
  carbs_g: z.preprocess(
    (val) => Number(val),
    z.number({ required_error: "Karbohidrat wajib diisi.", invalid_type_error: "Karbohidrat harus berupa angka."}).min(0)
  ),
  price_per_100g: z.preprocess(
    (val) => Number(val),
    z.number({ required_error: "Harga wajib diisi.", invalid_type_error: "Harga harus berupa angka."}).min(0)
  ),
  
  category: z.string().optional().nullable(),

  // --- PERBAIKAN: Menambahkan field unit_conversions ke skema ---
  // Ini akan memastikan data konversi tidak dihapus saat validasi.
  unit_conversions: z.string().optional().nullable(),

  isNew: z.boolean().optional()
});
