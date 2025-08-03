// Lokasi file: src/features/Recipes/components/RecipeDetail/RecipeIngredientsTable.jsx
// Deskripsi: (REFAKTOR) Mengimplementasikan pengeditan kuantitas inline yang selalu aktif dengan debounce.

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { TableBody, TableCell, TableRow, TableHead, TableHeader } from '../../../../components/ui/table';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip';
import { GripVertical, Trash2, Edit } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Checkbox } from '../../../../components/ui/checkbox';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../../../../components/ui/alert-dialog';
import { useDebounce } from '../../../../hooks/useDebounce';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
};

// Komponen baru untuk input kuantitas dengan debounce
const DebouncedQuantityInput = ({ ingredient, onUpdate }) => {
    const [quantity, setQuantity] = useState(ingredient.quantity);
    const debouncedQuantity = useDebounce(quantity, 500); // Tunda 500ms

    // Update state lokal saat prop berubah (misalnya, saat undo)
    useEffect(() => {
        setQuantity(ingredient.quantity);
    }, [ingredient.quantity]);

    // Kirim pembaruan saat nilai debounced berubah & berbeda dari nilai asli
    useEffect(() => {
        const numericDebounced = parseFloat(debouncedQuantity);
        if (!isNaN(numericDebounced) && numericDebounced >= 0 && numericDebounced !== ingredient.quantity) {
            onUpdate(ingredient.id, numericDebounced, ingredient.unit);
        }
    }, [debouncedQuantity, ingredient, onUpdate]);

    const handleChange = (e) => {
        const value = e.target.value;
        // Izinkan input kosong atau angka positif
        if (value === '' || (Number(value) >= 0 && !isNaN(Number(value)))) {
            setQuantity(value);
        }
    };

    return (
        <Input
            type="number"
            value={quantity}
            onChange={handleChange}
            className="h-8 w-20"
        />
    );
};


export const RecipeIngredientsTable = ({
    ingredients,
    setIngredients,
    handleOnDragEnd,
    deleteIngredient,
    handleUpdateIngredient,
    handleEditIngredientFood,
    handleBulkDeleteIngredients
}) => {
    const [selectedIngredients, setSelectedIngredients] = useState(new Set());
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);

    useEffect(() => {
        setSelectedIngredients(new Set());
    }, [ingredients]);

    const handleSelect = (ingredientId) => {
        const newSelection = new Set(selectedIngredients);
        if (newSelection.has(ingredientId)) {
            newSelection.delete(ingredientId);
        } else {
            newSelection.add(ingredientId);
        }
        setSelectedIngredients(newSelection);
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            const allIds = new Set(ingredients.map(ing => ing.id));
            setSelectedIngredients(allIds);
        } else {
            setSelectedIngredients(new Set());
        }
    };

    const confirmBulkDelete = () => {
        handleBulkDeleteIngredients(Array.from(selectedIngredients));
        setIsConfirmDeleteDialogOpen(false);
    };

    const handleUnitChangeForIngredient = (ingredientId, newUnit) => {
        const ingredient = ingredients.find(ing => ing.id === ingredientId);
        if (ingredient) {
            handleUpdateIngredient(ingredientId, ingredient.quantity, newUnit);
        }
    };

    const isAllSelected = ingredients.length > 0 && selectedIngredients.size === ingredients.length;

    return (
        <TooltipProvider>
            <DragDropContext onDragEnd={handleOnDragEnd}>
                {selectedIngredients.size > 0 && (
                    <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{selectedIngredients.size} bahan terpilih</span>
                        <Button variant="destructive" size="sm" onClick={() => setIsConfirmDeleteDialogOpen(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus Terpilih
                        </Button>
                    </div>
                )}
                
                <div className="rounded-md border">
                    <div className="relative max-h-[480px] overflow-y-auto">
                        <table className="relative w-full caption-bottom text-sm">
                            <TableHeader className="sticky top-0 z-10 bg-card">
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={isAllSelected}
                                            onCheckedChange={handleSelectAll}
                                            aria-label="Pilih semua"
                                        />
                                    </TableHead>
                                    <TableHead className="w-8"></TableHead>
                                    <TableHead>Nama Bahan</TableHead>
                                    <TableHead>Jumlah</TableHead>
                                    <TableHead className="text-right w-32">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <Droppable droppableId="ingredients">
                                {(provided) => (
                                    <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                                        {ingredients.length > 0 ? ingredients.map((ing, index) => {
                                            let availableUnits = ['gr'];
                                            try {
                                                const conversions = JSON.parse(ing.food.unit_conversions || '{}');
                                                availableUnits = ['gr', ...Object.keys(conversions)];
                                            } catch (e) { /* Biarkan default */ }

                                            return (
                                                <Draggable key={ing.id} draggableId={String(ing.id)} index={index}>
                                                    {(provided, snapshot) => (
                                                        <TableRow ref={provided.innerRef} {...provided.draggableProps} className={cn("group", snapshot.isDragging && "bg-accent shadow-lg")}>
                                                            <TableCell>
                                                                <Checkbox
                                                                    checked={selectedIngredients.has(ing.id)}
                                                                    onCheckedChange={() => handleSelect(ing.id)}
                                                                    aria-label={`Pilih ${ing.food.name}`}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="pl-2" {...provided.dragHandleProps}>
                                                                <Tooltip><TooltipTrigger asChild><GripVertical className="h-5 w-5 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Ubah urutan</p></TooltipContent></Tooltip>
                                                            </TableCell>
                                                            <TableCell className="font-medium">
                                                                <div>{ing.food.name}</div>
                                                                <div className="text-xs text-muted-foreground"> {ing.food.calories_kcal} kkal &bull; {formatCurrency(ing.food.price_per_100g)} / 100gr </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    {/* --- PENINGKATAN: Input selalu aktif dengan debounce --- */}
                                                                    <DebouncedQuantityInput ingredient={ing} onUpdate={handleUpdateIngredient} />
                                                                    <Select value={ing.unit} onValueChange={(newUnit) => handleUnitChangeForIngredient(ing.id, newUnit)}>
                                                                        <SelectTrigger className="h-8 w-[100px]"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            {availableUnits.map(unit => (<SelectItem key={unit} value={unit}>{unit}</SelectItem>))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end items-center">
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="icon" onClick={() => handleEditIngredientFood(ing.food)}>
                                                                                <Edit className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Edit '{ing.food.name}' di Database</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="icon" onClick={() => deleteIngredient(ing)}>
                                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent><p>Hapus dari resep</p></TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </Draggable>
                                            );
                                        }) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Belum ada bahan.</TableCell>
                                            </TableRow>
                                        )}
                                        {provided.placeholder}
                                    </TableBody>
                                )}
                            </Droppable>
                        </table>
                    </div>
                </div>
                <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Aksi ini akan menghapus {selectedIngredients.size} bahan dari resep secara permanen. Aksi ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction asChild>
                                <Button variant="destructive" onClick={confirmBulkDelete}>Hapus</Button>
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DragDropContext>
        </TooltipProvider>
    );
};
