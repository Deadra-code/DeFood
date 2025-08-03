// Lokasi file: src/features/Recipes/RecipeDetailView.jsx
// Deskripsi: Komponen utama yang telah dimodularisasi. Menggunakan custom hooks untuk memisahkan logika.

import React, { useState, useMemo } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../../components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Loader2, AlertCircle } from 'lucide-react';
import { useUIStateContext } from '../../context/UIStateContext';
import { calculateRecipeTotals, validateIngredientsForCalculation } from '../../utils/nutritionCalculator';
import { toast } from 'react-hot-toast';
import UndoToast from '../../components/ui/UndoToast';
import * as api from '../../api/electronAPI'; // Ditambahkan untuk akses api di handleAiAction

// Impor hooks dan komponen modular
import { useRecipeDetail } from './hooks/useRecipeDetail';
import { useRecipeAI } from './hooks/useRecipeAI';
import { RecipeHeader } from './components/RecipeDetail/RecipeHeader';
import { RecipeAnalysis } from './components/RecipeDetail/RecipeAnalysis';
import { RecipeIngredientsTable } from './components/RecipeDetail/RecipeIngredientsTable';
import { InstructionsEditor } from './components/RecipeDetail/InstructionsEditor';
import AddIngredientDialog from './components/AddIngredientDialog';
import { RecipeScalerDialog } from './components/RecipeDetail/RecipeScalerDialog';
import { AiButton } from './components/RecipeDetail/AiButton'; // --- PERBAIKAN: Impor yang hilang ditambahkan di sini ---

export default function RecipeDetailView({ recipe, onRecipeDeleted, onRecipeUpdated }) {
    const { setFoodToEdit } = useUIStateContext();

    // Menggunakan custom hooks untuk mengelola logika
    const {
        editableRecipe,
        setEditableRecipe,
        isLoading,
        isSaving,
        isDirty,
        isDeleteDialogOpen,
        setIsDeleteDialogOpen,
        handleSave,
        handleDeleteRecipe,
        handleDuplicateRecipe,
        handleExportPDF,
        fetchAndSetRecipeData
    } = useRecipeDetail(recipe, onRecipeDeleted, onRecipeUpdated);

    const {
        aiLoading,
        nameSuggestions,
        isSuggestionPopoverOpen,
        setIsSuggestionPopoverOpen,
        handleAiAction
    } = useRecipeAI((field, value) => handleDataChange(field, value));
    
    const [lastDeletedIngredient, setLastDeletedIngredient] = useState(null);
    const [isScalerOpen, setIsScalerOpen] = useState(false);

    // Kalkulasi turunan
    const recipeTotals = useMemo(() => calculateRecipeTotals(editableRecipe?.ingredients), [editableRecipe?.ingredients]);
    const calculationErrors = useMemo(() => validateIngredientsForCalculation(editableRecipe?.ingredients), [editableRecipe?.ingredients]);

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

    const deleteIngredient = (ingredientToDelete) => {
        const originalIngredients = editableRecipe.ingredients || [];
        const originalIndex = originalIngredients.findIndex(ing => ing.id === ingredientToDelete.id);
        if (originalIndex === -1) return;

        setLastDeletedIngredient({ item: ingredientToDelete, index: originalIndex });
        handleIngredientsChange(originalIngredients.filter(ing => ing.id !== ingredientToDelete.id));

        toast.custom((t) => (
            <UndoToast
                t={t}
                message={`Bahan "${ingredientToDelete.food.name}" dihapus.`}
                onUndo={() => handleUndoDeleteIngredient(t.id)}
            />
        ), { duration: 5000 });
    };

    const handleUndoDeleteIngredient = (toastId) => {
        if (lastDeletedIngredient) {
            const { item, index } = lastDeletedIngredient;
            const currentIngredients = editableRecipe.ingredients || [];
            const newIngredients = [...currentIngredients];
            newIngredients.splice(index, 0, item);
            handleIngredientsChange(newIngredients);
            setLastDeletedIngredient(null);
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
                nameSuggestions={nameSuggestions}
                isSuggestionPopoverOpen={isSuggestionPopoverOpen}
                setIsSuggestionPopoverOpen={setIsSuggestionPopoverOpen}
                handleDetailChange={handleDataChange}
                handleSaveDetails={handleSave}
                handleSuggestNames={() => handleAiAction(api.suggestRecipeNames, 'name', editableRecipe.ingredients)}
                handleDuplicateRecipe={handleDuplicateRecipe}
                setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                handleExportPDF={handleExportPDF}
                onOpenScaler={() => setIsScalerOpen(true)}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor="recipe-desc" className="text-lg font-semibold">Deskripsi</Label>
                        <AiButton 
                            onClick={() => handleAiAction(api.generateDescription, 'description', { recipeName: editableRecipe.name, ingredients: editableRecipe.ingredients })} 
                            isLoading={aiLoading.description} 
                            tooltipContent={editableRecipe.description ? "Sempurnakan deskripsi" : "Buat draf deskripsi"} 
                        />
                    </div>
                    <Textarea 
                        id="recipe-desc" 
                        value={editableRecipe.description || ''} 
                        onChange={e => handleDataChange('description', e.target.value)} 
                        placeholder="Deskripsi singkat tentang resep ini..."
                        rows={5}
                    />
                </div>
                <div className="md:col-span-1">
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
            </div>

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
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <Card className="xl:col-span-1">
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

                <div className="xl:col-span-1">
                    <InstructionsEditor
                        initialInstructions={editableRecipe.instructions}
                        onInstructionsChange={handleDataChange}
                        onAiGenerate={() => handleAiAction(api.generateInstructions, 'instructions', { recipeName: editableRecipe.name, ingredients: editableRecipe.ingredients })}
                        isAiLoading={aiLoading.instructions}
                    />
                </div>
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
            
            <RecipeScalerDialog
                isOpen={isScalerOpen}
                onOpenChange={setIsScalerOpen}
                recipe={editableRecipe}
            />
        </div>
    );
}
