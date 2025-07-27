// Lokasi file: src/context/RecipeContext.js
// Deskripsi: Diperbarui untuk menstandarisasi strategi pembaruan data.

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
            return newRecipe; 
        } catch (err) {
            console.error("Add recipe error:", err);
            throw err;
        }
    };
    
    // --- PERBAIKAN (Isu #3): updateRecipe sekarang me-refetch data untuk konsistensi ---
    const updateRecipe = async (recipe) => {
        try {
            await api.updateRecipeDetails(recipe);
            await fetchRecipes(); // Muat ulang daftar untuk memastikan data sinkron
            return true;
        } catch (err) {
            console.error("Update recipe error:", err);
            throw err; // Lempar error agar bisa ditangani di UI
        }
    };

    const deleteRecipe = async (recipeId) => {
        try {
            await api.deleteRecipe(recipeId);
            await fetchRecipes(); // Muat ulang daftar setelah menghapus
            return true;
        } catch (err) {
            console.error("Delete recipe error:", err);
            throw err; // Lempar error agar bisa ditangani di UI
        }
    };

    const duplicateRecipe = async (recipeId) => {
        try {
            const newRecipe = await api.duplicateRecipe(recipeId);
            await fetchRecipes();
            return newRecipe;
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
        duplicateRecipe,
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
