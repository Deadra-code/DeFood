// Lokasi file: src/lib/schemas.js
// Deskripsi: (DIPERBARUI) Skema validasi frontend sekarang disinkronkan dengan
//            backend, dengan menambahkan 'base_quantity' dan 'base_unit'.

import { z } from 'zod';

export const foodSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, { message: "Nama bahan minimal 2 karakter." }),
  
  // --- BARU: Validasi untuk kolom satuan dasar ---
  base_quantity: z.preprocess(
    (val) => Number(val), 
    z.number({ invalid_type_error: "Jumlah satuan dasar harus berupa angka." }).positive()
  ),
  base_unit: z.string().min(1, { message: "Satuan dasar tidak boleh kosong." }),

  // Kolom-kolom ini sekarang berisi data yang sudah dinormalisasi per 100g
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
  fiber_g: z.preprocess(
    (val) => Number(val) || 0, 
    z.number().min(0)
  ).default(0),
  
  price_per_100g: z.preprocess(
    (val) => Number(val),
    z.number({ required_error: "Harga wajib diisi.", invalid_type_error: "Harga harus berupa angka."}).min(0)
  ),
  
  category: z.string().optional().nullable(),
  unit_conversions: z.string().optional().nullable(),
  isNew: z.boolean().optional()
});
