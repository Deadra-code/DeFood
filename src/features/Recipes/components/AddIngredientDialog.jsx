// Lokasi file: src/features/Recipes/components/AddIngredientDialog.jsx
// Deskripsi: (PERBAIKAN) Memformat tampilan kalori untuk menampilkan satu angka desimal.

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { PlusCircle, Check, Search, X, Plus } from 'lucide-react';
import { useNotifier } from '../../../hooks/useNotifier';
import { useFoodContext } from '../../../context/FoodContext';
import { useUIStateContext } from '../../../context/UIStateContext';
import * as api from '../../../api/electronAPI';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Checkbox } from '../../../components/ui/checkbox';
import { useDebounce } from '../../../hooks/useDebounce';

const AddIngredientDialog = ({ recipeId, onIngredientAdded }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    
    const [selectedIngredients, setSelectedIngredients] = useState(new Map());

    const { foods } = useFoodContext();
    const { setFoodToEdit } = useUIStateContext();
    const { notify } = useNotifier();

    const filteredFoods = useMemo(() => {
        if (!foods) return [];
        if (!debouncedSearchTerm) return foods;
        return foods.filter(f => f.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
    }, [foods, debouncedSearchTerm]);
    
    const selectedIngredientsArray = useMemo(() => {
        return Array.from(selectedIngredients.values());
    }, [selectedIngredients]);

    const handleToggleFood = (food) => {
        setSelectedIngredients(prev => {
            const newSelection = new Map(prev);
            if (newSelection.has(food.id)) {
                newSelection.delete(food.id);
            } else {
                newSelection.set(food.id, { 
                    food, 
                    quantity: '', 
                    unit: 'gr' 
                });
            }
            return newSelection;
        });
    };

    const handleQuantityChange = (foodId, field, value) => {
        if (field === 'quantity' && Number(value) < 0) return;

        setSelectedIngredients(prev => {
            const newSelection = new Map(prev);
            const ingredient = newSelection.get(foodId);
            if (ingredient) {
                newSelection.set(foodId, { ...ingredient, [field]: value });
            }
            return newSelection;
        });
    };

    const handleAddIngredients = async () => {
        const ingredientsToAdd = selectedIngredientsArray
            .map(({ food, quantity, unit }) => ({
                food_id: food.id,
                quantity: parseFloat(quantity || 0),
                unit: unit || 'gr'
            }))
            .filter(ing => ing.quantity > 0);

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
            notify.error(`Gagal menambahkan bahan: ${err.message}`);
            console.error(err);
        }
    };

    const handleCreateNewFood = () => {
        const initialData = searchTerm ? { name: searchTerm, isNew: true } : { isNew: true };
        setFoodToEdit(initialData);
    };

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setSearchTerm('');
                setSelectedIngredients(new Map());
            }, 200);
        }
    }, [isOpen]);

    const selectedCount = selectedIngredients.size;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Tambah Bahan</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Tambah Bahan ke Resep</DialogTitle>
                    <DialogDescription>
                        Cari bahan, pilih, lalu tentukan jumlahnya di panel kanan.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid flex-grow grid-cols-1 md:grid-cols-2 gap-6 py-4 overflow-hidden">
                    <div className="flex flex-col gap-4 border rounded-lg overflow-hidden">
                        <div className="relative p-4 border-b">
                            <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Cari bahan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" autoFocus />
                        </div>
                        <ScrollArea className="flex-grow px-4">
                            {filteredFoods.length > 0 ? filteredFoods.map((food) => (
                                <div 
                                    key={food.id} 
                                    className="flex items-center space-x-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-accent"
                                    onClick={() => handleToggleFood(food)}
                                >
                                    <Checkbox
                                        id={`food-search-${food.id}`}
                                        checked={selectedIngredients.has(food.id)}
                                        onCheckedChange={() => handleToggleFood(food)}
                                    />
                                    <div className="flex-1">
                                        <label htmlFor={`food-search-${food.id}`} className="font-medium leading-none cursor-pointer">{food.name}</label>
                                        {/* --- PERBAIKAN: Memformat angka kalori menjadi satu desimal --- */}
                                        <div className="text-xs text-muted-foreground mt-1">{Number(food.calories_kcal || 0).toFixed(1)} kkal / 100gr</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-sm text-muted-foreground py-10">
                                    <p>Bahan tidak ditemukan.</p>
                                </div>
                            )}
                        </ScrollArea>
                        <div className="p-4 border-t">
                            <Button variant="outline" className="w-full" onClick={handleCreateNewFood}>
                                <Plus className="mr-2 h-4 w-4" /> Buat Bahan Baru
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h4 className="font-medium text-lg">Bahan Dipilih ({selectedCount})</h4>
                        <ScrollArea className="h-full border rounded-md bg-muted/30">
                            <div className="p-2 space-y-2">
                                {selectedCount > 0 ? selectedIngredientsArray.map(({ food, quantity, unit }) => {
                                    let availableUnits = ['gr'];
                                    try {
                                        const conversions = JSON.parse(food.unit_conversions || '{}');
                                        availableUnits = ['gr', ...Object.keys(conversions)];
                                    } catch (e) { /* Biarkan default */ }

                                    return (
                                        <div key={`selected-${food.id}`} className="grid grid-cols-[1fr,auto,auto] items-center gap-2 p-2 rounded-md bg-background">
                                            <Label htmlFor={`quantity-${food.id}`} className="truncate font-medium">{food.name}</Label>
                                            <Input
                                                id={`quantity-${food.id}`}
                                                type="number"
                                                min="0"
                                                placeholder="Jumlah"
                                                value={quantity}
                                                onChange={(e) => handleQuantityChange(food.id, 'quantity', e.target.value)}
                                                className="w-24 h-9"
                                            />
                                            <Select
                                                value={unit}
                                                onValueChange={(value) => handleQuantityChange(food.id, 'unit', value)}
                                            >
                                                <SelectTrigger className="w-[100px] h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center min-h-[200px]">
                                        <p>Pilih bahan dari panel kiri.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
                    <Button onClick={handleAddIngredients} disabled={selectedCount === 0}>
                        <Check className="mr-2 h-4 w-4" /> Tambahkan {selectedCount || ''} Bahan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AddIngredientDialog;
