// Lokasi file: src/features/FoodDatabase/FoodForm.jsx
// Deskripsi: Memperbaiki alignment konten di dalam modal agar terpusat.

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Loader2, PlusCircle, X, Sparkles, Link as LinkIcon } from 'lucide-react';
import { foodSchema } from '../../lib/schemas';
import * as api from '../../api/electronAPI';
import { useNotifier } from '../../hooks/useNotifier';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const unitOptions = ['g', 'kg', 'ons', 'ml', 'l', 'sdm', 'sdt', 'butir', 'pcs', 'siung', 'buah', 'lembar', 'batang'];

const FoodForm = ({ food, onSave, onCancel, isSaving }) => {
    const [formData, setFormData] = useState({});
    const [conversions, setConversions] = useState([]);
    const [errors, setErrors] = useState({});
    const { notify } = useNotifier();

    const [aiResult, setAiResult] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

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
        setAiResult(null);
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

    const addConversion = () => setConversions([...conversions, { unit: 'pcs', grams: '' }]);
    const removeConversion = (index) => setConversions(conversions.filter((_, i) => i !== index));

    const handleAiFetch = async () => {
        if (!formData.name) {
            notify.error("Masukkan nama bahan terlebih dahulu.");
            return;
        }
        setIsAiLoading(true);
        setAiResult(null);
        try {
            const result = await api.getGroundedFoodData(formData.name);
            setAiResult(result);
        } catch (error) {
            notify.error(`Gagal mendapatkan data AI: ${error.message}`);
            setAiResult({ error: error.message });
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleApplyAiData = () => {
        if (!aiResult || aiResult.error) return;
        const { nutrition, category, price_per_100g } = aiResult;
        setFormData(prev => ({
            ...prev,
            calories_kcal: nutrition?.calories_kcal ?? prev.calories_kcal,
            protein_g: nutrition?.protein_g ?? prev.protein_g,
            carbs_g: nutrition?.carbs_g ?? prev.carbs_g,
            fat_g: nutrition?.fat_g ?? prev.fat_g,
            fiber_g: nutrition?.fiber_g ?? prev.fiber_g,
            category: category ?? prev.category,
            price_per_100g: (typeof price_per_100g === 'number' && price_per_100g > 0) ? price_per_100g : prev.price_per_100g,
        }));
        notify.success("Data dari AI berhasil diterapkan.");
    };

    const handleSubmit = () => {
        const conversionsObject = conversions.reduce((acc, conv) => {
            if (conv.unit && conv.grams) acc[conv.unit] = parseFloat(conv.grams);
            return acc;
        }, {});
        
        const dataToValidate = { ...formData, unit_conversions: JSON.stringify(conversionsObject) };
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
            <DialogHeader className="text-center">
                <DialogTitle>{food?.id ? 'Edit Bahan Makanan' : 'Tambah Bahan Makanan Baru'}</DialogTitle>
                <DialogDescription>
                    Isi detail di bawah atau gunakan Asisten AI untuk mengisi data nutrisi, kategori, & estimasi harga.
                </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 max-h-[70vh] overflow-y-auto pr-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nama Bahan</Label>
                    <div className="flex gap-2">
                        <Input id="name" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} className="flex-1" />
                        <Button type="button" variant="outline" onClick={handleAiFetch} disabled={isAiLoading || !formData.name}>
                            {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        </Button>
                    </div>
                    <ErrorMessage field="name" />
                </div>

                {(isAiLoading || aiResult) && (
                    <div>
                        {isAiLoading && <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
                        {aiResult && !isAiLoading && (
                            <Card className="bg-muted/50">
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        {aiResult.error ? "Gagal Mendapatkan Data" : `Hasil untuk "${formData.name}"`}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {aiResult.error ? (
                                        <Alert variant="destructive"><AlertDescription>{aiResult.error}</AlertDescription></Alert>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                                                {aiResult.category && <p className="font-semibold">Kategori: <span className="font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">{aiResult.category}</span></p>}
                                                {(typeof aiResult.price_per_100g === 'number' && aiResult.price_per_100g > 0) &&
                                                    <p className="font-semibold">Estimasi Harga: <span className="font-normal bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                                        {`Rp ${aiResult.price_per_100g.toLocaleString('id-ID')} / 100g`}
                                                    </span></p>
                                                }
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-sm pt-2 border-t">
                                                <div><span className="font-semibold">Kalori:</span> {aiResult.nutrition?.calories_kcal ?? 'N/A'} kkal</div>
                                                <div><span className="font-semibold">Protein:</span> {aiResult.nutrition?.protein_g ?? 'N/A'} g</div>
                                                <div><span className="font-semibold">Lemak:</span> {aiResult.nutrition?.fat_g ?? 'N/A'} g</div>
                                                <div><span className="font-semibold">Karbo:</span> {aiResult.nutrition?.carbs_g ?? 'N/A'} g</div>
                                                <div><span className="font-semibold">Serat:</span> {aiResult.nutrition?.fiber_g ?? 'N/A'} g</div>
                                            </div>
                                            {aiResult.sources && aiResult.sources.length > 0 && (
                                                <div className="text-xs text-muted-foreground">
                                                    <p className="font-semibold mb-1">Sumber Data:</p>
                                                    {aiResult.sources.map((source, index) => (
                                                        <a key={index} href={source} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary truncate">
                                                            <LinkIcon className="h-3 w-3" /> {new URL(source).hostname}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                            <Button type="button" size="sm" className="w-full" onClick={handleApplyAiData}>Terapkan Data</Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Input id="category" value={formData.category || ''} onChange={e => handleChange('category', e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="calories_kcal">Kalori (kkal)</Label>
                        <Input id="calories_kcal" type="number" value={formData.calories_kcal || ''} onChange={e => handleChange('calories_kcal', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="price_per_100g">Harga (Rp)</Label>
                        <Input id="price_per_100g" type="number" value={formData.price_per_100g || ''} onChange={e => handleChange('price_per_100g', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="protein_g">Protein (g)</Label>
                        <Input id="protein_g" type="number" value={formData.protein_g || ''} onChange={e => handleChange('protein_g', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fat_g">Lemak (g)</Label>
                        <Input id="fat_g" type="number" value={formData.fat_g || ''} onChange={e => handleChange('fat_g', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="carbs_g">Karbohidrat (g)</Label>
                        <Input id="carbs_g" type="number" value={formData.carbs_g || ''} onChange={e => handleChange('carbs_g', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fiber_g">Serat (g)</Label>
                        <Input id="fiber_g" type="number" value={formData.fiber_g || ''} onChange={e => handleChange('fiber_g', e.target.value)} />
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
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
