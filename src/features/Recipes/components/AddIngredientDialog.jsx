// Lokasi file: src/features/Recipes/components/AddIngredientDialog.jsx
// Deskripsi: Desain ulang dengan tata letak dua panel untuk pencarian dan daftar pilihan.

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { PlusCircle, ArrowRight, Check, Search, X } from 'lucide-react';
import { useNotifier } from '../../../hooks/useNotifier';
import { useFoodContext } from '../../../context/FoodContext';
import * as api from '../../../api/electronAPI';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Checkbox } from '../../../components/ui/checkbox';
import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../lib/utils';

const AddIngredientDialog = ({ recipeId, onIngredientAdded }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFoods, setSelectedFoods] = useState({});
    const [quantities, setQuantities] = useState({});

    const { foods } = useFoodContext();
    const { notify } = useNotifier();

    const filteredFoods = useMemo(() => {
        return foods ? (searchTerm ? foods.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())) : foods) : [];
    }, [foods, searchTerm]);
    
    const foodsToQuantify = useMemo(() => {
        return foods.filter(f => selectedFoods[f.id]).sort((a, b) => a.name.localeCompare(b.name));
    }, [selectedFoods, foods]);

    const handleToggleFood = (foodId) => {
        setSelectedFoods(prev => {
            const newSelection = { ...prev };
            if (newSelection[foodId]) {
                delete newSelection[foodId];
            } else {
                newSelection[foodId] = true;
            }
            return newSelection;
        });
    };

    const handleQuantityChange = (foodId, value) => {
        setQuantities(prev => ({ ...prev, [foodId]: value }));
    };

    const handleNextStep = () => {
        if (foodsToQuantify.length === 0) {
            notify.error("Pilih setidaknya satu bahan.");
            return;
        }
        setStep(2);
    };

    const handleAddIngredients = async () => {
        const ingredientsToAdd = foodsToQuantify.map(food => ({
            food_id: food.id,
            quantity_g: parseFloat(quantities[food.id] || 0)
        })).filter(ing => ing.quantity_g > 0);

        if (ingredientsToAdd.length === 0) {
            notify.error("Masukkan jumlah setidaknya untuk satu bahan.");
            return;
        }

        try {
            await api.addIngredientsBulk({ recipe_id: recipeId, ingredients: ingredientsToAdd });
            notify.success(`${ingredientsToAdd.length} bahan berhasil ditambahkan.`);
            onIngredientAdded();
            setIsOpen(false);
        } catch (err) {
            notify.error("Gagal menambahkan bahan.");
            console.error(err);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep(1);
                setSearchTerm('');
                setSelectedFoods({});
                setQuantities({});
            }, 200);
        }
    }, [isOpen]);

    const selectedCount = foodsToQuantify.length;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Tambah Bahan</Button>
            </DialogTrigger>
            {/* PERUBAHAN: Ukuran modal diperlebar untuk tata letak dua panel */}
            <DialogContent className="sm:max-w-3xl">
                {step === 1 && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Pilih Bahan untuk Ditambahkan</DialogTitle>
                            <DialogDescription>
                                Cari bahan di panel kiri dan lihat pilihan Anda di panel kanan.
                            </DialogDescription>
                        </DialogHeader>
                        {/* PERUBAHAN: Tata letak grid dua panel */}
                        <div className="grid grid-cols-2 gap-6 py-4">
                            {/* Panel Kiri: Pencarian */}
                            <div className="flex flex-col gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Cari bahan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                                </div>
                                <ScrollArea className="h-72 border rounded-md">
                                    <div className="p-2">
                                        {filteredFoods.length > 0 ? filteredFoods.map((food, index) => (
                                            <div 
                                                key={food.id} 
                                                className="flex items-center space-x-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-accent"
                                                onClick={() => handleToggleFood(food.id)}
                                            >
                                                <Checkbox
                                                    id={`food-search-${food.id}`}
                                                    checked={!!selectedFoods[food.id]}
                                                    onCheckedChange={() => handleToggleFood(food.id)}
                                                />
                                                <div className="flex-1">
                                                    <label htmlFor={`food-search-${food.id}`} className="font-medium leading-none cursor-pointer">{food.name}</label>
                                                    <div className="text-xs text-muted-foreground mt-1">{food.calories_kcal} kkal / 100g</div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center text-sm text-muted-foreground py-16">
                                                <p>Tidak ada bahan yang cocok.</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Panel Kanan: Bahan Dipilih */}
                            <div className="flex flex-col gap-4">
                                <h4 className="font-medium text-lg">Bahan Dipilih ({selectedCount})</h4>
                                <ScrollArea className="h-72 border rounded-md bg-muted/30">
                                    <div className="p-2">
                                        {selectedCount > 0 ? foodsToQuantify.map(food => (
                                            <div key={`selected-${food.id}`} className="flex items-center justify-between p-2 rounded-md hover:bg-background">
                                                <span className="text-sm font-medium">{food.name}</span>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleFood(food.id)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )) : (
                                            <div className="text-center text-sm text-muted-foreground py-16">
                                                <p>Belum ada bahan yang dipilih.</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
                            <Button onClick={handleNextStep} disabled={selectedCount === 0}>
                                Lanjut ({selectedCount}) <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </DialogFooter>
                    </>
                )}
                {step === 2 && (
                    // Step 2 tidak berubah
                    <>
                        <DialogHeader>
                            <DialogTitle>Masukkan Jumlah Bahan</DialogTitle>
                            <DialogDescription>
                                Tentukan jumlah untuk setiap bahan yang Anda pilih dalam satuan gram.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <ScrollArea className="h-72">
                                <div className="space-y-4 p-1">
                                    {foodsToQuantify.map(food => (
                                        <div key={food.id} className="grid grid-cols-3 items-center gap-4">
                                            <Label htmlFor={`quantity-${food.id}`} className="col-span-2">{food.name}</Label>
                                            <Input
                                                id={`quantity-${food.id}`}
                                                type="number"
                                                placeholder="gram"
                                                value={quantities[food.id] || ''}
                                                onChange={(e) => handleQuantityChange(food.id, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setStep(1)}>Kembali</Button>
                            <Button onClick={handleAddIngredients}>
                                <Check className="mr-2 h-4 w-4" /> Tambahkan {selectedCount} Bahan
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default AddIngredientDialog;
