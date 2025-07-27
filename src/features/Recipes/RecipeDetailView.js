// Lokasi file: src/features/Recipes/RecipeDetailView.js
// Deskripsi: Diperbarui untuk menangani pembukaan dialog edit bahan dari tabel.

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../../components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Loader2, AlertCircle } from 'lucide-react';
import { useNotifier } from '../../hooks/useNotifier';
import * as api from '../../api/electronAPI';
import { useRecipeContext } from '../../context/RecipeContext';
import { useUIStateContext } from '../../context/UIStateContext'; // --- BARU: Impor UI State Context ---
import { calculateRecipeTotals, validateIngredientsForCalculation } from '../../utils/nutritionCalculator';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Impor komponen-komponen
import { RecipeHeader } from './components/RecipeDetail/RecipeHeader';
import { RecipeAnalysis } from './components/RecipeDetail/RecipeAnalysis';
import { RecipeIngredientsTable } from './components/RecipeDetail/RecipeIngredientsTable';
import { AiButton } from './components/RecipeDetail/AiButton';
import AddIngredientDialog from './components/AddIngredientDialog';
import ImportIngredientsDialog from './components/ImportIngredientsDialog';

export default function RecipeDetailView({ recipe, onRecipeDeleted, onRecipeUpdated, setIsDirty }) {
    const { notify } = useNotifier();
    const { duplicateRecipe, updateRecipe } = useRecipeContext();
    const { setFoodToEdit } = useUIStateContext(); // --- BARU: Dapatkan fungsi untuk membuka dialog ---
    const [details, setDetails] = useState(recipe);
    const [ingredients, setIngredients] = useState([]);
    const [servings, setServings] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [calculationErrors, setCalculationErrors] = useState([]);
    const [aiLoading, setAiLoading] = useState({
        title: false,
        description: false,
        instructions: false,
    });
    const containerRef = useRef(null);

    const isDifferent = useMemo(() => JSON.stringify(details) !== JSON.stringify(recipe), [details, recipe]);
    const recipeTotals = useMemo(() => calculateRecipeTotals(ingredients), [ingredients]);

    useEffect(() => { setIsDirty(isDifferent); }, [isDifferent, setIsDirty]);
    useEffect(() => { setCalculationErrors(validateIngredientsForCalculation(ingredients)); }, [ingredients]);

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
        setServings(1);
    }, [recipe, fetchIngredients]);
    
    const handleDetailChange = (field, value) => setDetails(prev => ({ ...prev, [field]: value }));
    
    // --- FUNGSI BARU: Handler untuk membuka dialog edit bahan ---
    const handleEditIngredientFood = (foodToEdit) => {
        setFoodToEdit({ ...foodToEdit, isNew: false });
    };

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
        const originalIngredients = [...ingredients];
        const newIngredients = ingredients.filter(ing => ing.id !== ingredientId);
        setIngredients(newIngredients);
        try {
            await api.deleteIngredientFromRecipe(ingredientId);
            notify.success("Bahan berhasil dihapus dari resep.");
        } catch (err) {
            notify.error("Gagal menghapus bahan. Perubahan dibatalkan.");
            setIngredients(originalIngredients);
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

    const handleUpdateIngredient = async (id, quantity, unit) => {
        const originalIngredients = [...ingredients];
        const newIngredients = ingredients.map(ing => ing.id === id ? { ...ing, quantity, unit } : ing);
        setIngredients(newIngredients);
        try {
            await api.updateIngredient({ id, quantity, unit });
        } catch (err) {
            notify.error("Gagal memperbarui bahan.");
            setIngredients(originalIngredients);
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text(details.name, 14, 22);
        doc.text(`Porsi: ${servings}`, 14, 32);
        doc.autoTable({ startY: 50, head: [['Nama Bahan', 'Jumlah']], body: ingredients.map(ing => [ing.food.name, `${ing.quantity} ${ing.unit}`]) });
        doc.save(`${details.name}.pdf`);
    };

    const handleAiAction = async (action, field, payload) => {
        setAiLoading(prev => ({ ...prev, [field]: true }));
        try {
            const result = await action(payload);
            handleDetailChange(field, result);
            notify.success(`AI berhasil memperbarui ${field}.`);
        } catch (err) {
            notify.error(`Aksi AI gagal: ${err.message}`);
        } finally {
            setAiLoading(prev => ({ ...prev, [field]: false }));
        }
    };
    
    const handleSuggestNames = () => {
        if (ingredients.length === 0) {
            notify.error("Tambahkan bahan terlebih dahulu.");
            return;
        }
        handleAiAction(api.suggestRecipeNames, 'name', ingredients);
    };

    const handleDescriptionAi = () => {
        if (details.description) {
            handleAiAction(api.refineDescription, 'description', details.description);
        } else {
            handleAiAction(api.generateDescription, 'description', { recipeName: details.name, ingredients });
        }
    };

    const handleInstructionsAi = () => {
        if (ingredients.length === 0) {
            notify.error("Tambahkan bahan terlebih dahulu.");
            return;
        }
        handleAiAction(api.generateInstructions, 'instructions', { recipeName: details.name, ingredients });
    };

    if (isLoading) {
        return <div className="p-8 flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div ref={containerRef} className="p-6 lg:p-8 space-y-8 overflow-y-auto h-full">
            <RecipeHeader
                details={details}
                isDifferent={isDifferent}
                isSaving={isSaving}
                aiLoading={aiLoading}
                handleDetailChange={handleDetailChange}
                handleSaveDetails={handleSaveDetails}
                handleSuggestNames={handleSuggestNames}
                handleExportPDF={handleExportPDF}
                handleDuplicateRecipe={handleDuplicateRecipe}
                setIsDeleteDialogOpen={setIsDeleteDialogOpen}
            />

            {calculationErrors.length > 0 && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Peringatan Akurasi Kalkulasi</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc pl-5">{calculationErrors.map((error, index) => (<li key={index}>{error}</li>))}</ul>
                    </AlertDescription>
                </Alert>
            )}

            <RecipeAnalysis recipeTotals={recipeTotals} servings={servings} ingredients={ingredients} />
            
            <div>
                <Label htmlFor="servings" className="text-lg font-semibold">Resep ini untuk berapa porsi?</Label>
                <Input id="servings" type="number" min="1" value={servings} onChange={(e) => setServings(Number(e.target.value))} className="mt-2 w-24" />
            </div>
            
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="recipe-desc" className="text-lg font-semibold">Deskripsi</Label>
                    <AiButton onClick={handleDescriptionAi} isLoading={aiLoading.description} tooltipContent={details.description ? "Sempurnakan deskripsi" : "Buat draf deskripsi"} />
                </div>
                <Textarea id="recipe-desc" value={details.description || ''} onChange={e => handleDetailChange('description', e.target.value)} placeholder="Deskripsi singkat tentang resep ini..." />
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Bahan-bahan</CardTitle>
                        <div className="flex items-center gap-2">
                            <ImportIngredientsDialog recipe={recipe} onFinished={fetchIngredients} />
                            <AddIngredientDialog recipeId={recipe.id} onIngredientAdded={fetchIngredients} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <RecipeIngredientsTable
                        ingredients={ingredients}
                        setIngredients={setIngredients}
                        handleOnDragEnd={handleOnDragEnd}
                        deleteIngredient={deleteIngredient}
                        handleUpdateIngredient={handleUpdateIngredient}
                        handleEditIngredientFood={handleEditIngredientFood} // --- BARU: Teruskan handler ke tabel ---
                    />
                </CardContent>
            </Card>

            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="recipe-instr" className="text-lg font-semibold">Instruksi</Label>
                    <AiButton onClick={handleInstructionsAi} isLoading={aiLoading.instructions} tooltipContent="Buat draf instruksi" />
                </div>
                <Textarea id="recipe-instr" value={details.instructions || ''} onChange={e => handleDetailChange('instructions', e.target.value)} placeholder="1. Siapkan bahan-bahan..." rows={12} />
            </div>
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Anda yakin ingin menghapus resep ini?</AlertDialogTitle>
                        <AlertDialogDescription>Resep "{recipe.name}" akan dihapus secara permanen. Aksi ini tidak dapat dibatalkan.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button variant="destructive" onClick={handleDeleteRecipe}>Hapus</Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
