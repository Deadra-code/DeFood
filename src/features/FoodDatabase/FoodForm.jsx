// Lokasi file: src/features/FoodDatabase/FoodForm.jsx
// Deskripsi: (DIPERBARUI) Menghapus deklarasi duplikat UnitCombobox untuk memperbaiki error.

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Loader2, PlusCircle, X, Sparkles } from 'lucide-react';
import { foodSchema } from '../../lib/schemas';
import * as api from '../../api/electronAPI';
import { useNotifier } from '../../hooks/useNotifier';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Info } from 'lucide-react';
import { UnitCombobox } from '../../components/ui/UnitCombobox'; // Impor sudah benar

const PREDEFINED_UNITS = ['gram', 'kg', 'ons', 'ml', 'l', 'sdm', 'sdt', 'butir', 'pcs', 'siung', 'buah', 'lembar', 'batang'];

// Fungsi ini memproses nilai dari AI untuk memastikan formatnya benar
const processAiValue = (value) => {
    if (typeof value === 'string') {
        return value.replace(',', '.');
    }
    if (typeof value === 'number') {
        return String(value);
    }
    return value;
};

const FoodForm = ({ food, onSave, onCancel, isSaving }) => {
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const { notify } = useNotifier();
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isConversionAiLoading, setIsConversionAiLoading] = useState(false);
    const [conversions, setConversions] = useState([]);
    const [baseInfo, setBaseInfo] = useState({ quantity: 100, unit: 'gram' });

    useEffect(() => {
        if (food) {
            const isNew = !food.id;
            const initialFormData = isNew ? {
                name: '', category: '', price_per_100g: '', calories_kcal: '',
                protein_g: '', fat_g: '', carbs_g: '', fiber_g: '', ...food
            } : { ...food };

            const initialBase = {
                quantity: initialFormData.base_quantity || 100,
                unit: initialFormData.base_unit || 'gram',
            };
            setBaseInfo(initialBase);

            const gramEquivalent = JSON.parse(initialFormData.unit_conversions || '{}')[initialBase.unit] || (initialBase.unit === 'gram' ? initialBase.quantity : 0);
            const conversionFactor = gramEquivalent > 0 ? gramEquivalent / 100 : 0;

            let displayData = { ...initialFormData };
            if (!isNew && initialBase.unit !== 'gram' && conversionFactor > 0) {
                displayData.price_per_100g = (initialFormData.price_per_100g || 0) * conversionFactor;
                displayData.calories_kcal = (initialFormData.calories_kcal || 0) * conversionFactor;
                displayData.protein_g = (initialFormData.protein_g || 0) * conversionFactor;
                displayData.fat_g = (initialFormData.fat_g || 0) * conversionFactor;
                displayData.carbs_g = (initialFormData.carbs_g || 0) * conversionFactor;
                displayData.fiber_g = (initialFormData.fiber_g || 0) * conversionFactor;
            }
            
            setFormData(displayData);
            try {
                const savedConversions = initialFormData.unit_conversions ? JSON.parse(initialFormData.unit_conversions) : {};
                setConversions(Object.entries(savedConversions).map(([unit, grams]) => ({ unit, grams })));
            } catch (e) {
                setConversions([]);
            }
        }
        setErrors({});
    }, [food]);

    const handleBaseInfoChange = (field, value) => {
        const newBaseInfo = { ...baseInfo, [field]: value };
        if (field === 'unit' && value === 'gram') {
            newBaseInfo.quantity = 100;
        }
        setBaseInfo(newBaseInfo);
    };

    const handleChange = (field, value) => {
        if (Number(value) < 0) return;
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleConversionChange = (index, field, value) => {
        const newConversions = [...conversions];
        if (field === 'grams' && Number(value) < 0) {
            return;
        }
        newConversions[index][field] = value;
        setConversions(newConversions);
    };

    const addConversion = () => setConversions([...conversions, { unit: 'pcs', grams: '' }]);
    const removeConversion = (index) => setConversions(conversions.filter((_, i) => i !== index));

    const handleAiFetch = async () => {
        if (!formData.name) {
            notify.error("Masukkan nama bahan terlebih dahulu.");
            return;
        }
        setIsAiLoading(true);
        try {
            const payload = { name: formData.name, base_quantity: baseInfo.quantity, base_unit: baseInfo.unit };
            const result = await api.getGroundedFoodData(payload);
            
            setFormData(prev => ({
                ...prev,
                calories_kcal: processAiValue(result.nutrition?.calories_kcal ?? prev.calories_kcal),
                protein_g: processAiValue(result.nutrition?.protein_g ?? prev.protein_g),
                carbs_g: processAiValue(result.nutrition?.carbs_g ?? prev.carbs_g),
                fat_g: processAiValue(result.nutrition?.fat_g ?? prev.fat_g),
                fiber_g: processAiValue(result.nutrition?.fiber_g ?? prev.fiber_g),
                category: result.category ?? prev.category,
                price_per_100g: processAiValue(result.price ?? prev.price_per_100g),
            }));
            notify.success("Data dari AI berhasil diterapkan.");

        } catch (error) {
            notify.error(`Gagal mendapatkan data AI: ${error.message}`);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleAiFetchConversions = async () => {
        if (!formData.name) {
            notify.error("Masukkan nama bahan terlebih dahulu.");
            return;
        }
        setIsConversionAiLoading(true);
        try {
            const result = await api.generateUnitConversions(formData.name);
            const newConversions = Object.entries(result).map(([unit, grams]) => ({ unit, grams }));
            
            if (newConversions.length > 0) {
                const existingUnits = new Set(conversions.map(c => c.unit));
                const combined = [...conversions];
                newConversions.forEach(nc => {
                    if (!existingUnits.has(nc.unit)) {
                        combined.push(nc);
                    }
                });
                setConversions(combined);
                notify.success(`${newConversions.length} konversi satuan berhasil ditemukan & ditambahkan.`);
            } else {
                notify.info("Tidak ada konversi satuan umum yang ditemukan untuk bahan ini.");
            }
        } catch (error) {
            notify.error(`Gagal mendapatkan konversi AI: ${error.message}`);
        } finally {
            setIsConversionAiLoading(false);
        }
    };

    const handleSubmit = () => {
        const conversionsObject = conversions.reduce((acc, conv) => {
            if (conv.unit && conv.grams) acc[conv.unit] = parseFloat(conv.grams);
            return acc;
        }, {});

        const gramEquivalent = baseInfo.unit === 'gram' ? baseInfo.quantity : conversionsObject[baseInfo.unit];
        if (baseInfo.unit !== 'gram' && (!gramEquivalent || gramEquivalent <= 0)) {
            notify.error(`Harap tentukan padanan gram untuk satuan "${baseInfo.unit}" di bagian Konversi Satuan.`);
            return;
        }

        let normalizedData = { ...formData };
        const conversionFactor = 100 / gramEquivalent;

        if (baseInfo.unit !== 'gram') {
            normalizedData.price_per_100g = (formData.price_per_100g || 0) * conversionFactor;
            normalizedData.calories_kcal = (formData.calories_kcal || 0) * conversionFactor;
            normalizedData.protein_g = (formData.protein_g || 0) * conversionFactor;
            normalizedData.fat_g = (formData.fat_g || 0) * conversionFactor;
            normalizedData.carbs_g = (formData.carbs_g || 0) * conversionFactor;
            normalizedData.fiber_g = (formData.fiber_g || 0) * conversionFactor;
        }

        const dataToSave = {
            ...normalizedData,
            base_quantity: parseFloat(baseInfo.quantity),
            base_unit: baseInfo.unit,
            unit_conversions: JSON.stringify(conversionsObject),
        };

        const result = foodSchema.safeParse(dataToSave);
        if (!result.success) {
            setErrors(result.error.flatten().fieldErrors);
            return;
        }
        onSave(result.data);
    };

    const ErrorMessage = ({ field }) => errors[field] ? <p className="text-red-500 text-xs mt-1">{errors[field][0]}</p> : null;
    const dynamicLabel = `per ${baseInfo.quantity} ${baseInfo.unit}`;
    const dynamicUnitOptions = useMemo(() => [...new Set([...PREDEFINED_UNITS, ...conversions.map(c => c.unit).filter(Boolean)])], [conversions]);

    return (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <DialogHeader className="text-center">
                <DialogTitle>{food?.id ? 'Edit Bahan Makanan' : 'Tambah Bahan Makanan Baru'}</DialogTitle>
                <DialogDescription>
                    Tentukan satuan dasar, lalu isi detail di bawah atau gunakan Asisten AI.
                </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 max-h-[70vh] overflow-y-auto pr-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Bahan</Label>
                        <Input id="name" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} />
                        <ErrorMessage field="name" />
                    </div>
                    <div className="space-y-2">
                        <Label>Kategori</Label>
                        <Input id="category" value={formData.category || ''} onChange={e => handleChange('category', e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                        <Label>Satuan Dasar (untuk Harga & Nutrisi)</Label>
                        <div className="flex items-center gap-2">
                            <Input type="number" min="1" value={baseInfo.quantity} onChange={e => handleBaseInfoChange('quantity', e.target.value)} className="w-24" />
                            <div className="flex-1">
                                <UnitCombobox value={baseInfo.unit} onChange={(value) => handleBaseInfoChange('unit', value)} options={PREDEFINED_UNITS} />
                            </div>
                        </div>
                    </div>
                    <Button type="button" className="w-full" onClick={handleAiFetch} disabled={isAiLoading || !formData.name}>
                        {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                        Dapatkan Data Otomatis
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                        <Label htmlFor="price_per_100g">Harga (Rp) <span className="text-muted-foreground font-normal">{dynamicLabel}</span></Label>
                        <Input id="price_per_100g" type="number" min="0" step="any" value={formData.price_per_100g || ''} onChange={e => handleChange('price_per_100g', e.target.value)} />
                        <ErrorMessage field="price_per_100g" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="calories_kcal">Kalori (kkal) <span className="text-muted-foreground font-normal">{dynamicLabel}</span></Label>
                        <Input id="calories_kcal" type="number" min="0" step="any" value={formData.calories_kcal || ''} onChange={e => handleChange('calories_kcal', e.target.value)} />
                        <ErrorMessage field="calories_kcal" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="protein_g">Protein (g) <span className="text-muted-foreground font-normal">{dynamicLabel}</span></Label>
                        <Input id="protein_g" type="number" min="0" step="any" value={formData.protein_g || ''} onChange={e => handleChange('protein_g', e.target.value)} />
                        <ErrorMessage field="protein_g" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fat_g">Lemak (g) <span className="text-muted-foreground font-normal">{dynamicLabel}</span></Label>
                        <Input id="fat_g" type="number" min="0" step="any" value={formData.fat_g || ''} onChange={e => handleChange('fat_g', e.target.value)} />
                        <ErrorMessage field="fat_g" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="carbs_g">Karbohidrat (g) <span className="text-muted-foreground font-normal">{dynamicLabel}</span></Label>
                        <Input id="carbs_g" type="number" min="0" step="any" value={formData.carbs_g || ''} onChange={e => handleChange('carbs_g', e.target.value)} />
                        <ErrorMessage field="carbs_g" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fiber_g">Serat (g) <span className="text-muted-foreground font-normal">{dynamicLabel}</span></Label>
                        <Input id="fiber_g" type="number" min="0" step="any" value={formData.fiber_g || ''} onChange={e => handleChange('fiber_g', e.target.value)} />
                        <ErrorMessage field="fiber_g" />
                    </div>
                </div>
                
                <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <Label className="font-semibold">Konversi Satuan ke Gram</Label>
                        <Button type="button" variant="ghost" size="sm" onClick={handleAiFetchConversions} disabled={isConversionAiLoading || !formData.name}>
                            {isConversionAiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                            Cari Otomatis
                        </Button>
                    </div>
                    {baseInfo.unit !== 'gram' && (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Karena satuan dasar Anda adalah "{baseInfo.unit}", Anda harus mendefinisikan padanan beratnya dalam gram di bawah ini agar kalkulasi resep akurat.
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        {conversions.map((conv, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input type="number" value="1" readOnly className="w-12 bg-muted" />
                                <div className="flex-1">
                                    <UnitCombobox
                                        value={conv.unit}
                                        onChange={(value) => handleConversionChange(index, 'unit', value)}
                                        options={dynamicUnitOptions}
                                    />
                                </div>
                                <span>=</span>
                                <Input type="number" min="0" placeholder="gram" value={conv.grams} onChange={(e) => handleConversionChange(index, 'grams', e.target.value)} className="flex-1" />
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
