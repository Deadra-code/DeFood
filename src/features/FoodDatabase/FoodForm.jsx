// Lokasi file: src/features/FoodDatabase/FoodForm.jsx
// Deskripsi: Menyederhanakan form dengan menghapus tombol dan logika AI.

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Loader2, PlusCircle, X } from 'lucide-react';
import { foodSchema } from '../../lib/schemas';
// --- DIHAPUS: Impor *api* tidak lagi diperlukan di sini ---
import { useNotifier } from '../../hooks/useNotifier';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const unitOptions = ['g', 'kg', 'ons', 'ml', 'l', 'sdm', 'sdt', 'butir', 'pcs', 'siung', 'buah', 'lembar', 'batang'];

const FoodForm = ({ food, onSave, onCancel, isSaving }) => {
    const [formData, setFormData] = useState({});
    const [conversions, setConversions] = useState([]);
    const [errors, setErrors] = useState({});
    // --- DIHAPUS: State isAiLoading ---
    const { notify } = useNotifier();

    useEffect(() => {
        const initialFormData = food || { name: '', serving_size_g: 100, calories_kcal: '', carbs_g: '', protein_g: '', fat_g: '', fiber_g: '', price_per_100g: '', category: '' };
        setFormData(initialFormData);
        
        try {
            const savedConversions = food?.unit_conversions ? JSON.parse(food.unit_conversions) : {};
            setConversions(Object.entries(savedConversions).map(([unit, grams]) => ({ unit, grams })));
        } catch (e) {
            setConversions([]);
        }
        
        setErrors({});
    }, [food]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleConversionChange = (index, field, value) => {
        const newConversions = [...conversions];
        newConversions[index][field] = value;
        setConversions(newConversions);
    };

    const addConversion = () => {
        setConversions([...conversions, { unit: 'pcs', grams: '' }]);
    };

    const removeConversion = (index) => {
        setConversions(conversions.filter((_, i) => i !== index));
    };

    // --- DIHAPUS: Fungsi handleAiFetch ---

    const handleSubmit = () => {
        const conversionsObject = conversions.reduce((acc, conv) => {
            if (conv.unit && conv.grams) {
                acc[conv.unit] = parseFloat(conv.grams);
            }
            return acc;
        }, {});
        
        const dataToValidate = {
            ...formData,
            unit_conversions: JSON.stringify(conversionsObject)
        };

        const result = foodSchema.safeParse(dataToValidate);
        if (!result.success) {
            setErrors(result.error.flatten().fieldErrors);
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
                    Lengkapi detail nutrisi dan harga. Tambahkan konversi satuan jika perlu.
                </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="name">Nama Bahan</Label>
                    {/* --- PERBAIKAN: Menghapus div dan tombol AI --- */}
                    <Input id="name" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} />
                    <ErrorMessage field="name" />
                </div>
                <div className="col-span-2"><Label htmlFor="category">Kategori</Label><Input id="category" value={formData.category || ''} onChange={e => handleChange('category', e.target.value)} /></div>
                <div><Label htmlFor="calories_kcal">Kalori (kkal)</Label><Input id="calories_kcal" type="number" value={formData.calories_kcal || ''} onChange={e => handleChange('calories_kcal', e.target.value)} /></div>
                <div><Label htmlFor="price_per_100g">Harga (Rp)</Label><Input id="price_per_100g" type="number" value={formData.price_per_100g || ''} onChange={e => handleChange('price_per_100g', e.target.value)} /></div>
                <div><Label htmlFor="protein_g">Protein (g)</Label><Input id="protein_g" type="number" value={formData.protein_g || ''} onChange={e => handleChange('protein_g', e.target.value)} /></div>
                <div><Label htmlFor="fat_g">Lemak (g)</Label><Input id="fat_g" type="number" value={formData.fat_g || ''} onChange={e => handleChange('fat_g', e.target.value)} /></div>
                <div><Label htmlFor="carbs_g">Karbohidrat (g)</Label><Input id="carbs_g" type="number" value={formData.carbs_g || ''} onChange={e => handleChange('carbs_g', e.target.value)} /></div>
                <div><Label htmlFor="fiber_g">Serat (g)</Label><Input id="fiber_g" type="number" value={formData.fiber_g || ''} onChange={e => handleChange('fiber_g', e.target.value)} /></div>

                <div className="col-span-2 space-y-3 pt-4 border-t">
                    <Label>Konversi Satuan (Opsional)</Label>
                    <div className="space-y-2">
                        {conversions.map((conv, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input type="number" value="1" readOnly className="w-12 bg-muted" />
                                <Select value={conv.unit} onValueChange={(value) => handleConversionChange(index, 'unit', value)}>
                                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <span>=</span>
                                <Input type="number" placeholder="gram" value={conv.grams} onChange={(e) => handleConversionChange(index, 'grams', e.target.value)} className="flex-1" />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeConversion(index)}><X className="h-4 w-4" /></Button>
                            </div>
                        ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addConversion}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Tambah Konversi
                    </Button>
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Batal</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan Bahan
                </Button>
            </DialogFooter>
        </form>
    );
};

export default FoodForm;
