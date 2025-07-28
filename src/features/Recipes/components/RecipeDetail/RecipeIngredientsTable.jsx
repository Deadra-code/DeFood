// Lokasi file: src/features/Recipes/components/RecipeDetail/RecipeIngredientsTable.jsx
// Deskripsi: Tabel interaktif untuk mengelola bahan resep dengan drag-and-drop, edit langsung, dan hapus massal.

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from '../../../../components/ui/table';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip';
import { GripVertical, Trash2, Edit } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Checkbox } from '../../../../components/ui/checkbox';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../../../../components/ui/alert-dialog';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
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
    const [editingIngredient, setEditingIngredient] = useState({ id: null, quantity: '', unit: '' });
    const [selectedIngredients, setSelectedIngredients] = useState(new Set());
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);

    // Reset pilihan jika daftar bahan berubah
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

    const startEditing = (ing) => {
        setEditingIngredient({ id: ing.id, quantity: ing.quantity, unit: ing.unit });
    };

    const finishEditing = () => {
        if (!editingIngredient.id) return;
        const newQuantity = parseFloat(editingIngredient.quantity);
        if (isNaN(newQuantity) || newQuantity <= 0) {
            setEditingIngredient({ id: null, quantity: '', unit: '' });
            return;
        }
        handleUpdateIngredient(editingIngredient.id, newQuantity, editingIngredient.unit);
        setEditingIngredient({ id: null, quantity: '', unit: '' });
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
                <Table>
                    <TableHeader>
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
                                    let availableUnits = ['g'];
                                    try {
                                        const conversions = JSON.parse(ing.food.unit_conversions || '{}');
                                        availableUnits = ['g', ...Object.keys(conversions)];
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
                                                        <div className="text-xs text-muted-foreground"> {ing.food.calories_kcal} kkal &bull; {formatCurrency(ing.food.price_per_100g)} / 100g </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {editingIngredient.id === ing.id ? (
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    type="number"
                                                                    value={editingIngredient.quantity}
                                                                    onChange={(e) => setEditingIngredient(prev => ({ ...prev, quantity: e.target.value }))}
                                                                    onBlur={finishEditing}
                                                                    onKeyDown={(e) => { if (e.key === 'Enter') finishEditing(); }}
                                                                    autoFocus
                                                                    className="h-8 w-20"
                                                                />
                                                                <span className="text-sm text-muted-foreground">{editingIngredient.unit}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <div className="cursor-pointer rounded-md p-1 -m-1 hover:bg-muted min-w-[40px] text-left" onClick={() => startEditing(ing)}>
                                                                    {ing.quantity}
                                                                </div>
                                                                <Select value={ing.unit} onValueChange={(newUnit) => handleUnitChangeForIngredient(ing.id, newUnit)}>
                                                                    <SelectTrigger className="h-8 w-[100px]"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        {availableUnits.map(unit => (<SelectItem key={unit} value={unit}>{unit}</SelectItem>))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        )}
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
                                                                    <Button variant="ghost" size="icon" onClick={() => deleteIngredient(ing.id)}>
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
                </Table>
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
