// Lokasi file: src/features/Recipes/RecipeDetailView.js
// Deskripsi: Menggunakan setIsDirty dari UIStateContext, bukan dari props.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useUIStateContext } from '../../context/UIStateContext';
import { useFoodContext } from '../../context/FoodContext';
import { calculateRecipeTotals, validateIngredientsForCalculation } from '../../utils/nutritionCalculator';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { isEqual, cloneDeep } from 'lodash';
import { toast } from 'react-hot-toast';
import UndoToast from '../../components/ui/UndoToast';

import { RecipeHeader } from './components/RecipeDetail/RecipeHeader';
import { RecipeAnalysis } from './components/RecipeDetail/RecipeAnalysis';
import { RecipeIngredientsTable } from './components/RecipeDetail/RecipeIngredientsTable';
import { AiButton } from './components/RecipeDetail/AiButton';
import AddIngredientDialog from './components/AddIngredientDialog';
import { InstructionsEditor } from './components/RecipeDetail/InstructionsEditor';

// HAPUS: prop setIsDirty
export default function RecipeDetailView({ recipe, onRecipeDeleted, onRecipeUpdated }) {
    const { notify } = useNotifier();
    const { duplicateRecipe, updateRecipe } = useRecipeContext();
    const { setFoodToEdit, setIsDirty } = useUIStateContext(); // BARU: dapatkan setIsDirty dari konteks
    const { foods, updateCounter } = useFoodContext();
    
    const [editableRecipe, setEditableRecipe] = useState(null);
    const [initialRecipe, setInitialRecipe] = useState(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [calculationErrors, setCalculationErrors] = useState([]);
    const [aiLoading, setAiLoading] = useState({ title: false, description: false, instructions: false });
    
    const [nameSuggestions, setNameSuggestions] = useState([]);
    const [isSuggestionPopoverOpen, setIsSuggestionPopoverOpen] = useState(false);
    
    const [lastDeletedIngredient, setLastDeletedIngredient] = useState(null);

    const isDirtyMemo = useMemo(() => {
        if (!initialRecipe || !editableRecipe) return false;
        return !isEqual(initialRecipe, editableRecipe);
    }, [initialRecipe, editableRecipe]);

    // BARU: Gunakan useEffect untuk menyinkronkan isDirtyMemo lokal dengan state global
    useEffect(() => {
        setIsDirty(isDirtyMemo);
    }, [isDirtyMemo, setIsDirty]);

    const recipeTotals = useMemo(() => calculateRecipeTotals(editableRecipe?.ingredients), [editableRecipe?.ingredients]);
    
    useEffect(() => {
        setCalculationErrors(validateIngredientsForCalculation(editableRecipe?.ingredients));
    }, [editableRecipe?.ingredients]);

    const fetchAndSetRecipeData = useCallback(async () => {
        if (!recipe?.id) return;
        setIsLoading(true);
        try {
            const ingredientList = await api.getIngredientsForRecipe(recipe.id);
            const fullRecipeData = { ...recipe, servings: recipe.servings || 1, ingredients: ingredientList || [] };
            setEditableRecipe(cloneDeep(fullRecipeData));
            setInitialRecipe(cloneDeep(fullRecipeData));
        } catch (err) {
            notify.error("Gagal memuat data resep lengkap.");
        } finally {
            setIsLoading(false);
        }
    }, [recipe, notify]);

    useEffect(() => {
        fetchAndSetRecipeData();
    }, [recipe.id, fetchAndSetRecipeData]);

    useEffect(() => {
        if (!editableRecipe || !Array.isArray(editableRecipe.ingredients) || foods.length === 0) return;
        
        let needsSync = false;
        const newIngredients = editableRecipe.ingredients.map(ing => {
            if (!ing.food) return ing;
            const updatedFoodData = foods.find(f => f.id === ing.food.id);
            if (updatedFoodData && JSON.stringify(ing.food) !== JSON.stringify(updatedFoodData)) {
                needsSync = true;
                return { ...ing, food: updatedFoodData };
            }
            return ing;
        });

        if (needsSync) {
            setEditableRecipe(prevRecipe => ({ ...prevRecipe, ingredients: newIngredients }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [updateCounter, foods]); 

    const handleDataChange = (field, value) => {
        const isNumericField = ['cost_operational_recipe', 'cost_labor_recipe', 'margin_percent', 'servings'].includes(field);
        const processedValue = isNumericField ? parseFloat(value) || 0 : value;
        setEditableRecipe(prev => ({ ...prev, [field]: processedValue }));
    };

    const handleIngredientsChange = (newIngredients) => {
        if (Array.isArray(newIngredients)) {
            setEditableRecipe(prev => ({ ...prev, ingredients: newIngredients }));
        }
    };

    const handleEditIngredientFood = (foodToEdit) => setFoodToEdit({ ...foodToEdit, isNew: false, source: 'recipe-edit' });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateRecipe(editableRecipe);
            notify.success("Resep berhasil disimpan.");
            onRecipeUpdated(editableRecipe);
            await fetchAndSetRecipeData();
        } catch (err) {
            notify.error(`Gagal menyimpan resep: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    // ... (sisa fungsi tetap sama) ...
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
    
    const deleteIngredient = (ingredientToDelete) => {
        const originalIngredients = editableRecipe.ingredients || [];
        const originalIndex = originalIngredients.findIndex(ing => ing.id === ingredientToDelete.id);
        if (originalIndex === -1) return;

        setLastDeletedIngredient({ item: ingredientToDelete, index: originalIndex });

        const newIngredients = originalIngredients.filter(ing => ing.id !== ingredientToDelete.id);
        handleIngredientsChange(newIngredients);

        toast.custom(
            (t) => (
                <UndoToast
                    t={t}
                    message={`Bahan "${ingredientToDelete.food.name}" dihapus.`}
                    onUndo={() => handleUndoDeleteIngredient(t.id)}
                />
            ),
            { duration: 5000 }
        );
    };

    const handleUndoDeleteIngredient = (toastId) => {
        if (lastDeletedIngredient) {
            const { item, index } = lastDeletedIngredient;
            const currentIngredients = editableRecipe.ingredients || [];
            const newIngredients = [...currentIngredients];
            
            newIngredients.splice(index, 0, item);
            handleIngredientsChange(newIngredients);
            
            setLastDeletedIngredient(null);
            notify.success("Penghapusan dibatalkan.");
        }
        if (toastId) toast.dismiss(toastId);
    };

    const handleBulkDeleteIngredients = (ids) => {
        if (Array.isArray(editableRecipe?.ingredients)) {
            handleIngredientsChange(editableRecipe.ingredients.filter(ing => !ids.includes(ing.id)));
        }
    };
    const handleOnDragEnd = (result) => {
        if (!result.destination || !Array.isArray(editableRecipe?.ingredients)) return;
        const items = Array.from(editableRecipe.ingredients);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        handleIngredientsChange(items);
    };
    const handleUpdateIngredient = (id, quantity, unit) => {
        if (Array.isArray(editableRecipe?.ingredients)) {
            handleIngredientsChange(editableRecipe.ingredients.map(ing => ing.id === id ? { ...ing, quantity, unit } : ing));
        }
    };
    
    const handleExportPDF = () => {
        if (!editableRecipe || !Array.isArray(editableRecipe.ingredients)) {
            notify.error("Tidak ada data bahan untuk diekspor.");
            return;
        }
        const doc = new jsPDF();
        doc.text(editableRecipe.name, 14, 22);
        doc.text(`Porsi: ${editableRecipe.servings || 1}`, 14, 32);
        doc.autoTable({ startY: 40, head: [['Nama Bahan', 'Jumlah', 'Satuan']], body: editableRecipe.ingredients.map(ing => [ing.food.name, ing.quantity, ing.unit]) });
        const finalY = doc.lastAutoTable.finalY;
        doc.text('Instruksi', 14, finalY + 10);
        doc.text(editableRecipe.instructions || 'Tidak ada instruksi.', 14, finalY + 20, { maxWidth: 180 });
        doc.save(`${editableRecipe.name}.pdf`);
    };

    const handleAiAction = async (action, field, payload) => {
        setAiLoading(prev => ({ ...prev, [field]: true }));
        try {
            const result = await action(payload);
            if (field === 'name') {
                setNameSuggestions(Array.isArray(result) ? result : []);
                setIsSuggestionPopoverOpen(true);
            } else {
                handleDataChange(field, result);
                notify.success(`AI berhasil memperbarui ${field}.`);
            }
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
                isDifferent={isDirtyMemo}
                isSaving={isSaving}
                aiLoading={aiLoading}
                nameSuggestions={nameSuggestions}
                isSuggestionPopoverOpen={isSuggestionPopoverOpen}
                setIsSuggestionPopoverOpen={setIsSuggestionPopoverOpen}
                handleDetailChange={handleDataChange}
                handleSaveDetails={handleSave}
                handleSuggestNames={() => handleAiAction(api.suggestRecipeNames, 'name', editableRecipe.ingredients)}
                handleDuplicateRecipe={handleDuplicateRecipe}
                setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                handleExportPDF={handleExportPDF}
            />

            {calculationErrors.length > 0 && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Peringatan Akurasi Kalkulasi</AlertTitle><AlertDescription><ul className="list-disc pl-5">{calculationErrors.map((error, index) => (<li key={index}>{error}</li>))}</ul></AlertDescription></Alert>}
            
            <RecipeAnalysis 
                recipeId={editableRecipe.id} 
                recipeTotals={recipeTotals} 
                servings={editableRecipe.servings || 1} 
                ingredients={editableRecipe.ingredients}
                operationalCost={editableRecipe.cost_operational_recipe}
                laborCost={editableRecipe.cost_labor_recipe}
                margin={editableRecipe.margin_percent}
                onCostChange={handleDataChange}
            />
            
            <div>
                <Label htmlFor="servings" className="text-lg font-semibold">Resep ini untuk berapa porsi?</Label>
                <Input 
                    id="servings" 
                    type="number" 
                    min="1" 
                    value={editableRecipe.servings || 1} 
                    onChange={(e) => handleDataChange('servings', e.target.value)} 
                    className="mt-2 w-24" 
                />
            </div>
            
            <div>
                <div className="flex items-center gap-2 mb-2"><Label htmlFor="recipe-desc" className="text-lg font-semibold">Deskripsi</Label><AiButton onClick={() => handleAiAction(api.generateDescription, 'description', { recipeName: editableRecipe.name, ingredients: editableRecipe.ingredients })} isLoading={aiLoading.description} tooltipContent={editableRecipe.description ? "Sempurnakan deskripsi" : "Buat draf deskripsi"} /></div>
                <Textarea id="recipe-desc" value={editableRecipe.description || ''} onChange={e => handleDataChange('description', e.target.value)} placeholder="Deskripsi singkat tentang resep ini..." />
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Bahan-bahan</CardTitle>
                        <AddIngredientDialog recipeId={editableRecipe.id} onIngredientAdded={fetchAndSetRecipeData} />
                    </div>
                </CardHeader>
                <CardContent>
                    <RecipeIngredientsTable 
                        ingredients={editableRecipe.ingredients || []}
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
                <div className="flex items-center gap-2 mb-4"><h2 className="text-lg font-semibold">Instruksi</h2><AiButton onClick={() => handleAiAction(api.generateInstructions, 'instructions', { recipeName: editableRecipe.name, ingredients: editableRecipe.ingredients })} isLoading={aiLoading.instructions} tooltipContent="Buat draf instruksi dengan AI" /></div>
                <InstructionsEditor initialValue={editableRecipe.instructions || ''} onChange={(newInstructions) => handleDataChange('instructions', newInstructions)} />
            </div>
            
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Anda yakin ingin menghapus resep ini?</AlertDialogTitle><AlertDialogDescription>Resep "{editableRecipe.name}" akan dihapus secara permanen. Aksi ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction asChild><Button variant="destructive" onClick={handleDeleteRecipe}>Hapus</Button></AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </div>
    );
}
