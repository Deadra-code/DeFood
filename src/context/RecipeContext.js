// Lokasi file: src/context/RecipeContext.js
// Deskripsi: Ditambahkan fungsi untuk menangani duplikasi resep.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api/electronAPI';
import { useAppContext } from './AppContext';

const RecipeContext = createContext();

export const RecipeProvider = ({ children }) => {
    const { apiReady } = useAppContext();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRecipes = useCallback(async () => {
        if (!apiReady) return;
        setLoading(true);
        try {
            const list = await api.getRecipes();
            setRecipes(list || []);
        } catch (err) {
            console.error("Fetch recipes error:", err);
            setRecipes([]);
        } finally {
            setLoading(false);
        }
    }, [apiReady]);

    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    const addRecipe = async (recipe) => {
        try {
            const newRecipe = await api.addRecipe(recipe);
            await fetchRecipes(); // Muat ulang daftar untuk konsistensi
            return newRecipe; // Kembalikan resep baru agar bisa dipilih
        } catch (err) {
            console.error("Add recipe error:", err);
            throw err;
        }
    };
    
    const updateRecipe = async (recipe) => {
        try {
            await api.updateRecipeDetails(recipe);
            // Update state lokal untuk responsivitas instan
            setRecipes(prev => prev.map(r => (r.id === recipe.id ? recipe : r)));
            return true;
        } catch (err) {
            console.error("Update recipe error:", err);
            return false;
        }
    };

    const deleteRecipe = async (recipeId) => {
        try {
            await api.deleteRecipe(recipeId);
            await fetchRecipes(); // Muat ulang daftar setelah menghapus
            return true;
        } catch (err) {
            console.error("Delete recipe error:", err);
            return false;
        }
    };

    const duplicateRecipe = async (recipeId) => { // FUNGSI BARU
        try {
            const newRecipe = await api.duplicateRecipe(recipeId);
            await fetchRecipes();
            return newRecipe; // Kembalikan resep baru untuk dipilih
        } catch (err) {
            console.error("Duplicate recipe error:", err);
            throw err;
        }
    };
    
    const value = {
        recipes,
        loading,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        duplicateRecipe, // BARU
        refetchRecipes: fetchRecipes,
    };

    return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
};

export const useRecipeContext = () => {
    const context = useContext(RecipeContext);
    if (context === undefined) {
        throw new Error('useRecipeContext must be used within a RecipeProvider');
    }
    return context;
};
