// Lokasi file: src/electron/schemas.cjs
// Deskripsi: Skema validasi 'foodSchema' sekarang mencakup 'base_quantity' dan 'base_unit'.

const { z } = require('zod');

const foodSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, { message: "Nama bahan minimal 2 karakter." }),
  
  base_quantity: z.preprocess((val) => Number(val), z.number().positive()),
  base_unit: z.string().min(1),

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

const ingredientBulkSchema = z.object({
  recipe_id: z.number(),
  ingredients: z.array(z.object({
    food_id: z.number(),
    quantity: z.number().positive({ message: "Jumlah harus lebih dari 0." }),
    unit: z.string().min(1, { message: "Satuan tidak boleh kosong." })
  })).min(1, { message: "Harus ada setidaknya satu bahan untuk ditambahkan." })
});

const updateIngredientSchema = z.object({
  id: z.number(),
  quantity: z.number().positive({ message: "Jumlah harus lebih dari 0." }),
  unit: z.string().min(1, { message: "Satuan tidak boleh kosong." })
});

const updateIngredientOrderSchema = z.array(z.object({
    id: z.number(),
})).min(1);

const settingsSchema = z.object({
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
