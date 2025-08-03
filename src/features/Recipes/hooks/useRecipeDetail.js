// Lokasi file: src/features/Recipes/hooks/useRecipeDetail.js
// Deskripsi: (DIPERBARUI) Hook ini sekarang mendaftarkan fungsi 'handleSave'-nya
//            ke UIStateContext saat komponen aktif.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNotifier } from '../../../hooks/useNotifier';
import * as api from '../../../api/electronAPI';
import { useRecipeContext } from '../../../context/RecipeContext';
import { useUIStateContext } from '../../../context/UIStateContext';
import { useFoodContext } from '../../../context/FoodContext';
import { isEqual, cloneDeep } from 'lodash';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const useRecipeDetail = (recipe, onRecipeDeleted, onRecipeUpdated) => {
    const { notify } = useNotifier();
    const { duplicateRecipe, updateRecipe } = useRecipeContext();
    const { setIsDirty, setSaveAction } = useUIStateContext(); // Ambil setSaveAction
    const { foods, updateCounter } = useFoodContext();

    const [editableRecipe, setEditableRecipe] = useState(null);
    const [initialRecipe, setInitialRecipe] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const isDirty = useMemo(() => {
        if (!initialRecipe || !editableRecipe) return false;
        return !isEqual(initialRecipe, editableRecipe);
    }, [initialRecipe, editableRecipe]);

    useEffect(() => {
        setIsDirty(isDirty);
    }, [isDirty, setIsDirty]);
    
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
        if (!editableRecipe || !Array.isArray(editableRecipe.ingredients) || foods.length === 0 || updateCounter === 0) {
            return;
        }
        
        let needsSync = false;
        const newIngredients = editableRecipe.ingredients.map(ing => {
            if (!ing.food) return ing;
            const updatedFoodData = foods.find(f => f.id === ing.food.id);
            if (updatedFoodData && !isEqual(ing.food, updatedFoodData)) {
                needsSync = true;
                return { ...ing, food: updatedFoodData };
            }
            return ing;
        });

        if (needsSync) {
            const updatedRecipe = { ...editableRecipe, ingredients: newIngredients };
            setEditableRecipe(updatedRecipe);
            setInitialRecipe(cloneDeep(updatedRecipe));
            notify.info("Data bahan dalam resep ini telah diperbarui.");
        }
    }, [updateCounter, foods, editableRecipe, notify]);

    const handleSave = useCallback(async () => {
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
    }, [editableRecipe, updateRecipe, notify, onRecipeUpdated, fetchAndSetRecipeData]);

    // --- BARU: Mendaftarkan dan membersihkan fungsi simpan di konteks ---
    useEffect(() => {
        // Daftarkan fungsi handleSave saat komponen ini aktif
        setSaveAction({ save: handleSave });

        // Fungsi cleanup: hapus fungsi simpan saat komponen tidak lagi aktif
        return () => {
            setSaveAction(null);
        };
    }, [handleSave, setSaveAction]);


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

    return {
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
    };
};
