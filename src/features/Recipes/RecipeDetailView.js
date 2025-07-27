// Lokasi file: src/features/Recipes/RecipeDetailView.js
// Deskripsi: Versi lengkap dan final dari komponen detail resep.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from '../../components/ui/table';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '../../components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { Trash2, Save, MoreVertical, Loader2, GripVertical, Flame, Download, Copy } from 'lucide-react';
import { useNotifier } from '../../hooks/useNotifier';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import * as api from '../../api/electronAPI';
import AddIngredientDialog from './components/AddIngredientDialog';
import { calculateRecipeTotals } from '../../utils/nutritionCalculator';
import MacroBarChart from './components/MacroBarChart';
import CostAnalysisCard from './components/CostAnalysisCard';
import { cn } from '../../lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useRecipeContext } from '../../context/RecipeContext';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
};

const StatCard = ({ title, value, icon }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export default function RecipeDetailView({ recipe, onRecipeDeleted, onRecipeUpdated, setIsDirty }) {
    const { notify } = useNotifier();
    const { duplicateRecipe } = useRecipeContext();
    const [details, setDetails] = useState(recipe);
    const [ingredients, setIngredients] = useState([]);
    const [servings, setServings] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState({ id: null, quantity: '' });

    const isDirty = useMemo(() => JSON.stringify(details) !== JSON.stringify(recipe), [details, recipe]);

    useEffect(() => {
        setIsDirty(isDirty);
    }, [isDirty, setIsDirty]);

    const scalingFactor = useMemo(() => servings > 0 ? servings : 1, [servings]);
    const recipeTotals = useMemo(() => calculateRecipeTotals(ingredients, 1), [ingredients]); // HPP dihitung untuk 1 porsi dasar

    const fetchIngredients = useCallback(async () => {
        if (!recipe?.id) return;
        setIsLoading(true);
        try {
            const ingredientList = await api.getIngredientsForRecipe(recipe.id);
            setIngredients(ingredientList || []);
        } catch (err) {
            notify.error("Gagal memuat bahan resep.");
        } finally {
            setIsLoading(false);
        }
    }, [recipe, notify]);

    useEffect(() => {
        setDetails(recipe);
        fetchIngredients();
        setIsEditingTitle(false);
        setServings(1);
        setEditingIngredient({ id: null, quantity: '' });
    }, [recipe, fetchIngredients]);
    
    const handleDetailChange = (field, value) => setDetails(prev => ({ ...prev, [field]: value }));
    
    const handleSaveDetails = async () => {
        setIsSaving(true);
        try {
            await api.updateRecipeDetails(details);
            notify.success("Detail resep berhasil disimpan.");
            onRecipeUpdated(details);
        } catch (err) {
            notify.error("Gagal menyimpan detail resep.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRecipe = async () => {
        try {
            await api.deleteRecipe(recipe.id);
            notify.success(`Resep "${recipe.name}" berhasil dihapus.`);
            setIsDeleteDialogOpen(false);
            onRecipeDeleted(recipe.id);
        } catch (err) {
            notify.error("Gagal menghapus resep.");
        }
    };

    const handleDuplicateRecipe = async () => {
        try {
            const newRecipe = await duplicateRecipe(recipe.id);
            notify.success(`Resep "${recipe.name}" berhasil diduplikasi.`);
            onRecipeUpdated(newRecipe);
        } catch (err) {
            notify.error("Gagal menduplikasi resep.");
        }
    };

    const deleteIngredient = async (ingredientId) => {
        try {
            await api.deleteIngredientFromRecipe(ingredientId);
            fetchIngredients();
            notify.success("Bahan berhasil dihapus dari resep.");
        } catch (err) {
            notify.error("Gagal menghapus bahan.");
        }
    };
    
    const handleOnDragEnd = async (result) => {
        if (!result.destination) return;
        const items = Array.from(ingredients);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setIngredients(items);
        try {
            await api.updateIngredientOrder(items);
        } catch (error) {
            notify.error("Gagal menyimpan urutan bahan. Memuat ulang...");
            fetchIngredients();
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text(details.name, 14, 22);
        doc.setFontSize(12);
        doc.text(`Porsi: ${servings}`, 14, 32);
        doc.text(details.description || "Tidak ada deskripsi.", 14, 42);
        const tableData = ingredients.map(ing => [ ing.food.name, `${(ing.quantity_g * scalingFactor).toFixed(0)} g` ]);
        doc.autoTable({ startY: 50, head: [['Nama Bahan', 'Jumlah']], body: tableData });
        let finalY = doc.lastAutoTable.finalY || 60;
        doc.setFontSize(16);
        doc.text("Instruksi", 14, finalY + 15);
        doc.setFontSize(12);
        const instructions = doc.splitTextToSize(details.instructions || "Tidak ada instruksi.", 180);
        doc.text(instructions, 14, finalY + 25);
        doc.save(`${details.name}.pdf`);
        notify.success("Resep berhasil diekspor ke PDF.");
    };

    const handleUpdateQuantity = async () => {
        if (!editingIngredient.id) return;
        const newQuantity = parseFloat(editingIngredient.quantity);
        if (isNaN(newQuantity) || newQuantity <= 0) {
            notify.error("Jumlah harus berupa angka positif.");
            setEditingIngredient({ id: null, quantity: '' });
            return;
        }
        const baseQuantity = newQuantity / scalingFactor;
        try {
            await api.updateIngredient({ id: editingIngredient.id, quantity_g: baseQuantity });
            fetchIngredients();
            notify.success("Jumlah bahan diperbarui.");
        } catch (err) {
            notify.error("Gagal memperbarui jumlah.");
        } finally {
            setEditingIngredient({ id: null, quantity: '' });
        }
    };

    if (isLoading) {
        return <div className="p-8 flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <TooltipProvider>
            <div className="p-6 lg:p-8 space-y-8 overflow-y-auto h-full">
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        {isEditingTitle ? ( <Input value={details.name} onChange={e => handleDetailChange('name', e.target.value)} className="text-4xl font-bold h-auto p-0 border-none shadow-none focus-visible:ring-0 tracking-tight" autoFocus onBlur={() => setIsEditingTitle(false)} onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingTitle(false); }} /> ) : ( <h1 className="text-4xl font-bold tracking-tight cursor-pointer hover:bg-muted rounded-md px-1 -mx-1" onClick={() => setIsEditingTitle(true)}> {details.name} </h1> )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleExportPDF}><Download className="mr-2 h-4 w-4" /> Ekspor</Button>
                        <Button onClick={handleSaveDetails} disabled={!isDirty || isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isDirty ? 'Simpan' : 'Tersimpan'}
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={handleDuplicateRecipe}><Copy className="mr-2 h-4 w-4" /> Duplikat</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setIsDeleteDialogOpen(true)}><Trash2 className="mr-2 h-4 w-4" /> Hapus Resep</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Panel Statistik */}
                <div className="grid gap-4 grid-cols-2">
                    <StatCard title="Total Kalori / Porsi" value={`${(recipeTotals.calories * scalingFactor).toFixed(0)} kkal`} icon={<Flame className="h-4 w-4 text-muted-foreground" />} />
                    <CostAnalysisCard hppPerPortion={recipeTotals.price} />
                    <MacroBarChart 
                        protein={recipeTotals.protein * scalingFactor}
                        carbs={recipeTotals.carbs * scalingFactor}
                        fat={recipeTotals.fat * scalingFactor}
                    />
                </div>
                
                {/* Manajemen Porsi & Deskripsi */}
                <div>
                    <Label htmlFor="servings" className="text-lg font-semibold">Porsi</Label>
                    <Input id="servings" type="number" min="1" value={servings} onChange={(e) => setServings(Number(e.target.value))} className="mt-2 w-24" />
                </div>
                <div>
                    <Label htmlFor="recipe-desc" className="text-lg font-semibold">Deskripsi</Label>
                    <Textarea id="recipe-desc" value={details.description || ''} onChange={e => handleDetailChange('description', e.target.value)} placeholder="Deskripsi singkat tentang resep ini..." className="mt-2" />
                </div>

                {/* Tabel Bahan */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">Bahan-bahan</CardTitle>
                            <AddIngredientDialog recipeId={recipe.id} onIngredientAdded={fetchIngredients} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DragDropContext onDragEnd={handleOnDragEnd}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-8"></TableHead>
                                        <TableHead>Nama Bahan</TableHead>
                                        <TableHead>Jumlah</TableHead>
                                        <TableHead className="text-right w-24">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <Droppable droppableId="ingredients">
                                    {(provided) => (
                                        <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                                            {ingredients.length > 0 ? ingredients.map((ing, index) => (
                                                <Draggable key={ing.id} draggableId={String(ing.id)} index={index}>
                                                    {(provided, snapshot) => (
                                                        <TableRow ref={provided.innerRef} {...provided.draggableProps} className={cn("group", snapshot.isDragging && "bg-accent shadow-lg")}>
                                                            <TableCell className="pl-2" {...provided.dragHandleProps}><Tooltip><TooltipTrigger asChild><GripVertical className="h-5 w-5 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Ubah urutan</p></TooltipContent></Tooltip></TableCell>
                                                            <TableCell className="font-medium"><div>{ing.food.name}</div><div className="text-xs text-muted-foreground"> {ing.food.calories_kcal} kkal &bull; {formatCurrency(ing.food.price_per_100g)} / 100g </div></TableCell>
                                                            <TableCell>
                                                                {editingIngredient.id === ing.id ? ( <Input type="number" value={editingIngredient.quantity} onChange={(e) => setEditingIngredient(prev => ({ ...prev, quantity: e.target.value }))} onBlur={handleUpdateQuantity} onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateQuantity(); if (e.key === 'Escape') setEditingIngredient({ id: null, quantity: '' }); }} autoFocus className="h-8 w-24" /> ) : ( <div className="cursor-pointer rounded-md p-1 -m-1 hover:bg-muted" onClick={() => setEditingIngredient({ id: ing.id, quantity: (ing.quantity_g * scalingFactor).toFixed(0) })}> {(ing.quantity_g * scalingFactor).toFixed(0)} g </div> )}
                                                            </TableCell>
                                                            <TableCell className="text-right"><div className="opacity-0 group-hover:opacity-100 transition-opacity"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => deleteIngredient(ing.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TooltipTrigger><TooltipContent><p>Hapus bahan</p></TooltipContent></Tooltip></div></TableCell>
                                                        </TableRow>
                                                    )}
                                                </Draggable>
                                            )) : ( <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Belum ada bahan.</TableCell></TableRow> )}
                                            {provided.placeholder}
                                        </TableBody>
                                    )}
                                </Droppable>
                            </Table>
                        </DragDropContext>
                    </CardContent>
                </Card>

                {/* Instruksi */}
                <div>
                    <Label htmlFor="recipe-instr" className="text-lg font-semibold">Instruksi</Label>
                    <Textarea id="recipe-instr" value={details.instructions || ''} onChange={e => handleDetailChange('instructions', e.target.value)} placeholder="1. Siapkan bahan-bahan..." rows={12} className="mt-2" />
                </div>
            </div>

            {/* Dialog Hapus */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Anda yakin ingin menghapus resep ini?</AlertDialogTitle>
                        <AlertDialogDescription>Resep "{recipe.name}" akan dihapus secara permanen. Aksi ini tidak dapat dibatalkan.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <Button variant="destructive" onClick={handleDeleteRecipe}>Hapus</Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </TooltipProvider>
    );
}
