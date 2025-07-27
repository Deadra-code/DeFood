// Lokasi file: src/features/FoodDatabase/FoodForm.jsx
// Deskripsi: Menambahkan input untuk Kategori bahan.

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { foodSchema } from '../../lib/schemas';

const FoodForm = ({ food, onSave, onCancel, isSaving }) => {
    const [formData, setFormData] = useState(food || {});
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setFormData(food || {
            name: '',
            serving_size_g: 100,
            calories_kcal: '',
            carbs_g: '',
            protein_g: '',
            fat_g: '',
            price_per_100g: '',
            category: '' // Inisialisasi kategori
        });
        setErrors({});
    }, [food]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSubmit = () => {
        const result = foodSchema.safeParse(formData);
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            setErrors(fieldErrors);
            return;
        }
        onSave(result.data);
    };

    const ErrorMessage = ({ field }) => errors[field] ? <p className="text-red-500 text-xs mt-1">{errors[field][0]}</p> : null;

    return (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <DialogHeader>
                <DialogTitle>{food?.id ? 'Edit Bahan Makanan' : 'Tambah Bahan Makanan Baru'}</DialogTitle>
                <DialogDescription>
                    Lengkapi semua detail nutrisi dan harga untuk bahan ini.
                </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2">
                    <Label htmlFor="name">Nama Bahan</Label>
                    <Input id="name" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} placeholder="Contoh: Dada Ayam Fillet" />
                    <ErrorMessage field="name" />
                </div>

                {/* PENAMBAHAN: Input Kategori */}
                <div className="col-span-2">
                    <Label htmlFor="category">Kategori (Opsional)</Label>
                    <Input id="category" value={formData.category || ''} onChange={e => handleChange('category', e.target.value)} placeholder="Contoh: Daging, Sayuran, Bumbu" />
                    <ErrorMessage field="category" />
                </div>
                
                <div>
                    <Label htmlFor="calories_kcal">Kalori (kkal)</Label>
                    <Input id="calories_kcal" type="number" value={formData.calories_kcal || ''} onChange={e => handleChange('calories_kcal', e.target.value)} placeholder="per 100g"/>
                    <ErrorMessage field="calories_kcal" />
                </div>
                <div>
                    <Label htmlFor="price_per_100g">Harga (Rp)</Label>
                    <Input id="price_per_100g" type="number" value={formData.price_per_100g || ''} onChange={e => handleChange('price_per_100g', e.target.value)} placeholder="per 100g"/>
                    <ErrorMessage field="price_per_100g" />
                </div>

                <div>
                    <Label htmlFor="protein_g">Protein (g)</Label>
                    <Input id="protein_g" type="number" value={formData.protein_g || ''} onChange={e => handleChange('protein_g', e.target.value)} placeholder="per 100g"/>
                    <ErrorMessage field="protein_g" />
                </div>
                <div>
                    <Label htmlFor="fat_g">Lemak (g)</Label>
                    <Input id="fat_g" type="number" value={formData.fat_g || ''} onChange={e => handleChange('fat_g', e.target.value)} placeholder="per 100g"/>
                    <ErrorMessage field="fat_g" />
                </div>
                <div className="col-span-2">
                    <Label htmlFor="carbs_g">Karbohidrat (g)</Label>
                    <Input id="carbs_g" type="number" value={formData.carbs_g || ''} onChange={e => handleChange('carbs_g', e.target.value)} placeholder="per 100g"/>
                    <ErrorMessage field="carbs_g" />
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Batal</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSaving ? 'Menyimpan...' : 'Simpan Bahan'}
                </Button>
            </DialogFooter>
        </form>
    );
};

export default FoodForm;
