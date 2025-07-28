// Lokasi file: src/electron/schemas.cjs
// Deskripsi: Skema validasi data untuk backend menggunakan Zod.

const { z } = require('zod');

// Skema untuk data bahan makanan
const foodSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, { message: "Nama bahan minimal 2 karakter." }),
  serving_size_g: z.preprocess((val) => Number(val) || 100, z.number().positive()).default(100),
  calories_kcal: z.preprocess((val) => Number(val), z.number({ required_error: "Kalori wajib diisi."}).min(0)),
  protein_g: z.preprocess((val) => Number(val), z.number({ required_error: "Protein wajib diisi."}).min(0)),
  fat_g: z.preprocess((val) => Number(val), z.number({ required_error: "Lemak wajib diisi."}).min(0)),
  carbs_g: z.preprocess((val) => Number(val), z.number({ required_error: "Karbohidrat wajib diisi."}).min(0)),
  fiber_g: z.preprocess((val) => Number(val) || 0, z.number().min(0)).default(0),
  price_per_100g: z.preprocess((val) => Number(val), z.number({ required_error: "Harga wajib diisi."}).min(0)),
  category: z.string().optional().nullable(),
  unit_conversions: z.string().optional().nullable(),
  isNew: z.boolean().optional()
});

// Skema untuk menambahkan bahan secara massal ke resep
const ingredientBulkSchema = z.object({
  recipe_id: z.number(),
  ingredients: z.array(z.object({
    food_id: z.number(),
    quantity: z.number().positive({ message: "Jumlah harus lebih dari 0." }),
    unit: z.string().min(1, { message: "Satuan tidak boleh kosong." })
  })).min(1, { message: "Harus ada setidaknya satu bahan untuk ditambahkan." })
});

// Skema untuk memperbarui satu bahan dalam resep
const updateIngredientSchema = z.object({
  id: z.number(),
  quantity: z.number().positive({ message: "Jumlah harus lebih dari 0." }),
  unit: z.string().min(1, { message: "Satuan tidak boleh kosong." })
});

// Skema untuk memperbarui urutan bahan
const updateIngredientOrderSchema = z.array(z.object({
    id: z.number(),
})).min(1);

// Skema baru untuk validasi pengaturan
const settingsSchema = z.object({
    margin: z.preprocess(val => Number(val), z.number().min(0)),
    operationalCost: z.preprocess(val => Number(val), z.number().min(0)),
    laborCost: z.preprocess(val => Number(val), z.number().min(0)),
    googleApiKey: z.string().optional().nullable(),
});


module.exports = {
    foodSchema,
    ingredientBulkSchema,
    updateIngredientSchema,
    updateIngredientOrderSchema,
    settingsSchema,
};
