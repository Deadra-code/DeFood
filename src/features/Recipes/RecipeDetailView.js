// Lokasi file: src/features/Recipes/RecipeDetailView.js
// Deskripsi: Memperbaiki nama fungsi 'updateRecipeDetails' menjadi 'updateRecipe' agar sesuai dengan context.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../../components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useNotifier } from '../../hooks/useNotifier';
import * as api from '../../api/electronAPI';
import { useRecipeContext } from '../../context/RecipeContext';
import { useUIStateContext } from '../../context/UIStateContext';
import { useFoodContext } from '../../context/FoodContext';
import { calculateRecipeTotals, validateIngredientsForCalculation } from '../../utils/nutritionCalculator';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { RecipeHeader } from './components/RecipeDetail/RecipeHeader';
import { RecipeAnalysis } from './components/RecipeDetail/RecipeAnalysis';
import { RecipeIngredientsTable } from './components/RecipeDetail/RecipeIngredientsTable';
import { AiButton } from './components/RecipeDetail/AiButton';
import AddIngredientDialog from './components/AddIngredientDialog';
import { InstructionsEditor } from './components/RecipeDetail/InstructionsEditor';
import { isEqual } from 'lodash';

export default function RecipeDetailView({ recipe, onRecipeDeleted, onRecipeUpdated, setIsDirty: setParentIsDirty }) {
    const { notify } = useNotifier();
    // --- PERBAIKAN: Mengubah nama 'updateRecipeDetails' menjadi 'updateRecipe' ---
    const { duplicateRecipe, updateRecipe } = useRecipeContext();
    const { setFoodToEdit } = useUIStateContext();
    const { fetchFoods } = useFoodContext();
    
    const [editableRecipe, setEditableRecipe] = useState(null);
    const [initialRecipe, setInitialRecipe] = useState(null);

    const [servings, setServings] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [calculationErrors, setCalculationErrors] = useState([]);
    const [aiLoading, setAiLoading] = useState({ title: false, description: false, instructions: false });
    const [isSuggestingAndProcessing, setIsSuggestingAndProcessing] = useState(false);

    const isDirty = useMemo(() => {
        if (!initialRecipe || !editableRecipe) return false;
        return !isEqual(initialRecipe, editableRecipe);
    }, [initialRecipe, editableRecipe]);

    useEffect(() => {
        setParentIsDirty(isDirty);
    }, [isDirty, setParentIsDirty]);

    const recipeTotals = useMemo(() => calculateRecipeTotals(editableRecipe?.ingredients), [editableRecipe?.ingredients]);
    
    useEffect(() => {
        setCalculationErrors(validateIngredientsForCalculation(editableRecipe?.ingredients));
    }, [editableRecipe?.ingredients]);

    const fetchAndSetRecipeData = useCallback(async () => {
        if (!recipe?.id) return;
        setIsLoading(true);
        try {
            const ingredientList = await api.getIngredientsForRecipe(recipe.id);
            const fullRecipeData = {
                ...recipe,
                ingredients: ingredientList || [],
            };
            setEditableRecipe(JSON.parse(JSON.stringify(fullRecipeData)));
            setInitialRecipe(JSON.parse(JSON.stringify(fullRecipeData)));
        } catch (err) {
            notify.error("Gagal memuat data resep lengkap.");
        } finally {
            setIsLoading(false);
        }
    }, [recipe, notify]);

    useEffect(() => {
        fetchAndSetRecipeData();
        setServings(1);
    }, [recipe, fetchAndSetRecipeData]);
    
    const handleDataChange = (field, value) => {
        setEditableRecipe(prev => ({ ...prev, [field]: value }));
    };

    const handleIngredientsChange = (newIngredients) => {
        setEditableRecipe(prev => ({ ...prev, ingredients: newIngredients }));
    };

    const handleEditIngredientFood = (foodToEdit) => {
        setFoodToEdit({ 
            ...foodToEdit, 
            isNew: false,
            source: 'recipe-edit' 
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // --- PERBAIKAN: Memanggil fungsi 'updateRecipe' yang benar ---
            await updateRecipe(editableRecipe);
            notify.success("Resep berhasil disimpan.");
            onRecipeUpdated(editableRecipe);
            setInitialRecipe(JSON.parse(JSON.stringify(editableRecipe)));
        } catch (err) {
            notify.error(`Gagal menyimpan resep: ${err.message}`);
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
    
    const handleAiIngredientSuggestion = async () => {
        if (!editableRecipe.name) {
            notify.error("Nama resep tidak valid untuk menghasilkan saran.");
            return;
        }
        setIsSuggestingAndProcessing(true);
        notify.info(`AI sedang mencari saran bahan untuk "${editableRecipe.name}"...`);
        try {
            const suggestions = await api.draftIngredients({ recipeName: editableRecipe.name, servings: servings });
            if (!suggestions || suggestions.length === 0) {
                notify.info("AI tidak dapat memberikan saran untuk resep ini.");
                return;
            }
            
            const ingredientNames = suggestions.map(s => ({ name: s.name, quantity: s.quantity, unit: s.unit }));
            const { processedFoods, failed } = await api.processUnknownIngredients(ingredientNames);
            
            if (failed.length > 0) {
                notify.error(`Gagal memproses: ${failed.map(f => f.name).join(', ')}`);
            }

            if (processedFoods.length === 0) {
                notify.info("Tidak ada bahan baru yang bisa ditambahkan.");
                return;
            }

            const newIngredientsToAdd = processedFoods.map(food => ({
                id: `new-${food.id}-${Date.now()}`, 
                quantity: food.quantity,
                unit: food.unit,
                food: food
            }));

            handleIngredientsChange([...editableRecipe.ingredients, ...newIngredientsToAdd]);
            notify.success(`${newIngredientsToAdd.length} bahan berhasil disarankan dan ditambahkan!`);
            fetchFoods();

        } catch (err) {
            notify.error(`Terjadi kesalahan: ${err.message}`);
        } finally {
            setIsSuggestingAndProcessing(false);
        }
    };

    const deleteIngredient = (ingredientId) => {
        const newIngredients = editableRecipe.ingredients.filter(ing => ing.id !== ingredientId);
        handleIngredientsChange(newIngredients);
    };
    
    const handleBulkDeleteIngredients = (ingredientIds) => {
        const newIngredients = editableRecipe.ingredients.filter(ing => !ingredientIds.includes(ing.id));
        handleIngredientsChange(newIngredients);
    };

    const handleOnDragEnd = (result) => {
        if (!result.destination) return;
        const items = Array.from(editableRecipe.ingredients);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        handleIngredientsChange(items);
    };

    const handleUpdateIngredient = (id, quantity, unit) => {
        const newIngredients = editableRecipe.ingredients.map(ing => ing.id === id ? { ...ing, quantity, unit } : ing);
        handleIngredientsChange(newIngredients);
    };
    
    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text(editableRecipe.name, 14, 22);
        doc.text(`Porsi: ${servings}`, 14, 32);
        doc.autoTable({ 
            startY: 40, 
            head: [['Nama Bahan', 'Jumlah', 'Satuan']], 
            body: editableRecipe.ingredients.map(ing => [ing.food.name, ing.quantity, ing.unit]) 
        });
        const finalY = doc.lastAutoTable.finalY;
        doc.text('Instruksi', 14, finalY + 10);
        doc.text(editableRecipe.instructions || 'Tidak ada instruksi.', 14, finalY + 20, { maxWidth: 180 });
        
        doc.save(`${editableRecipe.name}.pdf`);
    };

    const handleAiAction = async (action, field, payload) => {
        setAiLoading(prev => ({ ...prev, [field]: true }));
        try {
            const result = await action(payload);
            handleDataChange(field, result);
            notify.success(`AI berhasil memperbarui ${field}.`);
        } catch (err) {
            notify.error(`Aksi AI gagal: ${err.message}`);
        } finally {
            setAiLoading(prev => ({ ...prev, [field]: false }));
        }
    };

    if (isLoading || !editableRecipe) {
        return <div className="p-8 flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="p-6 lg:p-8 space-y-8 overflow-y-auto h-full">
            <RecipeHeader
                details={editableRecipe}
                isDifferent={isDirty}
                isSaving={isSaving}
                aiLoading={aiLoading}
                handleDetailChange={handleDataChange}
                handleSaveDetails={handleSave}
                handleSuggestNames={() => handleAiAction(api.suggestRecipeNames, 'name', editableRecipe.ingredients)}
                handleDuplicateRecipe={handleDuplicateRecipe}
                setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                handleExportPDF={handleExportPDF}
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

            <RecipeAnalysis recipeTotals={recipeTotals} servings={servings} ingredients={editableRecipe.ingredients} />
            
            <div>
                <Label htmlFor="servings" className="text-lg font-semibold">Resep ini untuk berapa porsi?</Label>
                <Input id="servings" type="number" min="1" value={servings} onChange={(e) => setServings(Number(e.target.value))} className="mt-2 w-24" />
            </div>
            
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="recipe-desc" className="text-lg font-semibold">Deskripsi</Label>
                    <AiButton 
                        onClick={() => handleAiAction(api.generateDescription, 'description', { recipeName: editableRecipe.name, ingredients: editableRecipe.ingredients })} 
                        isLoading={aiLoading.description} 
                        tooltipContent={editableRecipe.description ? "Sempurnakan deskripsi" : "Buat draf deskripsi"} 
                    />
                </div>
                <Textarea id="recipe-desc" value={editableRecipe.description || ''} onChange={e => handleDataChange('description', e.target.value)} placeholder="Deskripsi singkat tentang resep ini..." />
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Bahan-bahan</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleAiIngredientSuggestion} disabled={isSuggestingAndProcessing}>
                                {isSuggestingAndProcessing ? 
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                                    <Sparkles className="mr-2 h-4 w-4" />
                                }
                                Sarankan Bahan
                            </Button>
                            <AddIngredientDialog recipeId={recipe.id} onIngredientAdded={fetchAndSetRecipeData} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <RecipeIngredientsTable
                        ingredients={editableRecipe.ingredients}
                        setIngredients={handleIngredientsChange}
                        handleOnDragEnd={handleOnDragEnd}
                        deleteIngredient={deleteIngredient}
                        handleUpdateIngredient={handleUpdateIngredient}
                        handleEditIngredientFood={handleEditIngredientFood}
                        handleBulkDeleteIngredients={handleBulkDeleteIngredients}
                    />
                </CardContent>
            </Card>

            <div>
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-semibold">Instruksi</h2>
                    <AiButton 
                        onClick={() => handleAiAction(api.generateInstructions, 'instructions', { recipeName: editableRecipe.name, ingredients: editableRecipe.ingredients })} 
                        isLoading={aiLoading.instructions} 
                        tooltipContent="Buat draf instruksi dengan AI" 
                    />
                </div>
                <InstructionsEditor
                    initialValue={editableRecipe.instructions || ''}
                    onChange={(newInstructions) => {
                        handleDataChange('instructions', newInstructions);
                    }}
                />
            </div>
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Anda yakin ingin menghapus resep ini?</AlertDialogTitle>
                        <AlertDialogDescription>Resep "{editableRecipe.name}" akan dihapus secara permanen. Aksi ini tidak dapat dibatalkan.</AlertDialogDescription>
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
