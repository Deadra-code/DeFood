// Lokasi file: src/features/Recipes/RecipeDetailView.js
// Deskripsi: Diperbaiki dengan mempertahankan posisi scroll setelah update.

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'; // --- PERBAIKAN: Impor useRef ---
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from '../../components/ui/table';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '../../components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { Trash2, Save, MoreVertical, Loader2, GripVertical, Flame, Download, Copy, Pencil, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useNotifier } from '../../hooks/useNotifier';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import * as api from '../../api/electronAPI';
import AddIngredientDialog from './components/AddIngredientDialog';
import { calculateRecipeTotals, validateIngredientsForCalculation } from '../../utils/nutritionCalculator';
import MacroBarChart from './components/MacroBarChart';
import CostAnalysisCard from './components/CostAnalysisCard';
import { cn } from '../../lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useRecipeContext } from '../../context/RecipeContext';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

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
    const { duplicateRecipe, updateRecipe } = useRecipeContext();
    const [details, setDetails] = useState(recipe);
    const [ingredients, setIngredients] = useState([]);
    const [servings, setServings] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState({ id: null, quantity: '', unit: '' });
    const [deletingIngredientId, setDeletingIngredientId] = useState(null);
    const [calculationErrors, setCalculationErrors] = useState([]);

    // --- PERBAIKAN: Ref untuk container dan state untuk menyimpan posisi scroll ---
    const containerRef = useRef(null);
    const scrollPositionRef = useRef(0);

    const isDifferent = useMemo(() => JSON.stringify(details) !== JSON.stringify(recipe), [details, recipe]);

    useEffect(() => {
        setIsDirty(isDifferent);
    }, [isDifferent, setIsDirty]);

    useEffect(() => {
        const errors = validateIngredientsForCalculation(ingredients);
        setCalculationErrors(errors);
    }, [ingredients]);

    // --- PERBAIKAN: Mengembalikan posisi scroll setelah ingredients di-render ulang ---
    useEffect(() => {
        if (containerRef.current) {
            requestAnimationFrame(() => {
                containerRef.current.scrollTop = scrollPositionRef.current;
            });
        }
    }, [ingredients]);

    const recipeTotalsForBatch = useMemo(() => calculateRecipeTotals(ingredients), [ingredients]);
    const safeServings = useMemo(() => (servings > 0 ? servings : 1), [servings]);
    const hppPerPortion = useMemo(() => recipeTotalsForBatch.price / safeServings, [recipeTotalsForBatch.price, safeServings]);

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
    }, [recipe?.id, notify]);

    useEffect(() => {
        setDetails(recipe);
        fetchIngredients();
        setIsEditingTitle(false);
        setServings(1);
        setEditingIngredient({ id: null, quantity: '', unit: '' });
    }, [recipe, fetchIngredients]);
    
    const handleDetailChange = (field, value) => setDetails(prev => ({ ...prev, [field]: value }));
    
    const handleSaveDetails = async () => {
        setIsSaving(true);
        try {
            await updateRecipe(details);
            notify.success("Detail resep berhasil disimpan.");
            onRecipeUpdated(details);
        } catch (err) {
            notify.error(`Gagal menyimpan detail resep: ${err.message}`);
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
        // --- PERBAIKAN: Simpan posisi scroll sebelum update ---
        if (containerRef.current) {
            scrollPositionRef.current = containerRef.current.scrollTop;
        }
        setDeletingIngredientId(ingredientId);
        try {
            await api.deleteIngredientFromRecipe(ingredientId);
            fetchIngredients();
            notify.success("Bahan berhasil dihapus dari resep.");
        } catch (err) {
            notify.error("Gagal menghapus bahan.");
        } finally {
            setDeletingIngredientId(null);
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
        const tableData = ingredients.map(ing => [ ing.food.name, `${ing.quantity} ${ing.unit}` ]);
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
            return;
        }
        // --- PERBAIKAN: Simpan posisi scroll sebelum update ---
        if (containerRef.current) {
            scrollPositionRef.current = containerRef.current.scrollTop;
        }
        try {
            await api.updateIngredient({ id: editingIngredient.id, quantity: newQuantity, unit: editingIngredient.unit });
            fetchIngredients();
            notify.success("Jumlah bahan diperbarui.");
        } catch (err) {
            notify.error(`Gagal memperbarui jumlah: ${err.message}`);
        } finally {
            setEditingIngredient({ id: null, quantity: '', unit: '' });
        }
    };

    const handleUnitChange = async (ingredientId, newUnit) => {
        const ingredient = ingredients.find(ing => ing.id === ingredientId);
        if (!ingredient) return;

        // --- PERBAIKAN: Simpan posisi scroll sebelum update ---
        if (containerRef.current) {
            scrollPositionRef.current = containerRef.current.scrollTop;
        }
        try {
            await api.updateIngredient({ id: ingredientId, quantity: ingredient.quantity, unit: newUnit });
            fetchIngredients();
            notify.success(`Satuan untuk "${ingredient.food.name}" diperbarui.`);
        } catch (err) {
            notify.error(`Gagal memperbarui satuan: ${err.message}`);
        }
    };

    if (isLoading) {
        return <div className="p-8 flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <TooltipProvider>
            {/* --- PERBAIKAN: Tambahkan ref ke container utama --- */}
            <div ref={containerRef} className="p-6 lg:p-8 space-y-8 overflow-y-auto h-full">
                <header className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        {isEditingTitle ? (
                            <Input
                                value={details.name}
                                onChange={e => handleDetailChange('name', e.target.value)}
                                className="text-4xl font-bold h-auto p-0 border-none shadow-none focus-visible:ring-0 tracking-tight"
                                autoFocus
                                onBlur={() => setIsEditingTitle(false)}
                                onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingTitle(false); }}
                            />
                        ) : (
                            <h1 className="text-4xl font-bold tracking-tight cursor-pointer hover:bg-muted rounded-md px-1 -mx-1" onClick={() => setIsEditingTitle(true)}>
                                {details.name} {isDifferent && <span className="text-destructive">*</span>}
                            </h1>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleExportPDF}><Download className="mr-2 h-4 w-4" /> Ekspor</Button>
                        <Button onClick={handleSaveDetails} disabled={!isDifferent || isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isDifferent ? 'Simpan' : 'Tersimpan'}
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
                </header>

                {calculationErrors.length > 0 && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Peringatan Akurasi Kalkulasi</AlertTitle>
                        <AlertDescription>
                            <ul className="list-disc pl-5">
                                {calculationErrors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                            <p className="mt-2">
                                Total nutrisi dan harga mungkin tidak akurat. Harap perbarui bahan yang bermasalah.
                            </p>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-4 grid-cols-2">
                    <StatCard title="Total Kalori / Porsi" value={`${(recipeTotalsForBatch.calories / safeServings).toFixed(0)} kkal`} icon={<Flame className="h-4 w-4 text-muted-foreground" />} />
                    <CostAnalysisCard 
                        hppPerPortion={hppPerPortion} 
                        ingredients={ingredients} 
                        servings={servings} 
                    />
                    <MacroBarChart 
                        protein={recipeTotalsForBatch.protein / safeServings}
                        carbs={recipeTotalsForBatch.carbs / safeServings}
                        fat={recipeTotalsForBatch.fat / safeServings}
                        fiber={recipeTotalsForBatch.fiber / safeServings}
                    />
                </div>
                
                <div>
                    <Label htmlFor="servings" className="text-lg font-semibold">Resep ini untuk berapa porsi?</Label>
                    <Input id="servings" type="number" min="1" value={servings} onChange={(e) => setServings(Number(e.target.value))} className="mt-2 w-24" />
                </div>
                
                <div>
                    <Label htmlFor="recipe-desc" className="text-lg font-semibold">Deskripsi</Label>
                    <Textarea id="recipe-desc" value={details.description || ''} onChange={e => handleDetailChange('description', e.target.value)} placeholder="Deskripsi singkat tentang resep ini..." className="mt-2" />
                </div>
                
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
                                            {ingredients.length > 0 ? ingredients.map((ing, index) => {
                                                let availableUnits = ['g'];
                                                try {
                                                    const conversions = JSON.parse(ing.food.unit_conversions || '{}');
                                                    availableUnits = ['g', ...Object.keys(conversions)];
                                                } catch (e) { /* Biarkan default jika parsing gagal */ }

                                                return (
                                                    <Draggable key={ing.id} draggableId={String(ing.id)} index={index}>
                                                        {(provided, snapshot) => (
                                                            <TableRow ref={provided.innerRef} {...provided.draggableProps} className={cn("group", snapshot.isDragging && "bg-accent shadow-lg")}>
                                                                <TableCell className="pl-2" {...provided.dragHandleProps}><Tooltip><TooltipTrigger asChild><GripVertical className="h-5 w-5 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Ubah urutan</p></TooltipContent></Tooltip></TableCell>
                                                                <TableCell className="font-medium"><div>{ing.food.name}</div><div className="text-xs text-muted-foreground"> {ing.food.calories_kcal} kkal &bull; {formatCurrency(ing.food.price_per_100g)} / 100g </div></TableCell>
                                                                
                                                                <TableCell>
                                                                    {editingIngredient.id === ing.id ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <Input
                                                                                type="number"
                                                                                value={editingIngredient.quantity}
                                                                                onChange={(e) => setEditingIngredient(prev => ({ ...prev, quantity: e.target.value }))}
                                                                                onBlur={handleUpdateQuantity}
                                                                                onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateQuantity(); }}
                                                                                autoFocus
                                                                                className="h-8 w-20"
                                                                            />
                                                                            <span className="text-sm text-muted-foreground">{editingIngredient.unit}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-2">
                                                                            <div
                                                                                className="cursor-pointer rounded-md p-1 -m-1 hover:bg-muted min-w-[40px] text-left"
                                                                                onClick={() => setEditingIngredient({ id: ing.id, quantity: ing.quantity, unit: ing.unit })}
                                                                            >
                                                                                {ing.quantity}
                                                                            </div>
                                                                            <Select
                                                                                value={ing.unit}
                                                                                onValueChange={(newUnit) => handleUnitChange(ing.id, newUnit)}
                                                                            >
                                                                                <SelectTrigger className="h-8 w-[100px]">
                                                                                    <SelectValue placeholder="Pilih satuan" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {availableUnits.map(unit => (
                                                                                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                    )}
                                                                </TableCell>

                                                                <TableCell className="text-right">
                                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button variant="ghost" size="icon" onClick={() => deleteIngredient(ing.id)} disabled={deletingIngredientId === ing.id}>
                                                                                    {deletingIngredientId === ing.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent><p>Hapus bahan</p></TooltipContent>
                                                                        </Tooltip>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </Draggable>
                                                )
                                            }) : ( <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Belum ada bahan.</TableCell></TableRow> )}
                                            {provided.placeholder}
                                        </TableBody>
                                    )}
                                </Droppable>
                            </Table>
                        </DragDropContext>
                    </CardContent>
                </Card>

                <div>
                    <Label htmlFor="recipe-instr" className="text-lg font-semibold">Instruksi</Label>
                    <Textarea id="recipe-instr" value={details.instructions || ''} onChange={e => handleDetailChange('instructions', e.target.value)} placeholder="1. Siapkan bahan-bahan..." rows={12} className="mt-2" />
                </div>
            </div>
            
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
