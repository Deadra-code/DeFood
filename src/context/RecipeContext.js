// Lokasi file: src/context/RecipeContext.js
// Deskripsi: Menerapkan pembaruan state optimis. UI tidak lagi menunggu
//            refetch untuk menampilkan perubahan.

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
            // Pembaruan Optimis
            setRecipes(prev => [...prev, newRecipe].sort((a, b) => a.name.localeCompare(b.name)));
            return newRecipe; 
        } catch (err) {
            console.error("Add recipe error:", err);
            throw err;
        }
    };
    
    const updateRecipe = async (recipeToUpdate) => {
        const originalRecipes = [...recipes];
        // Pembaruan Optimis
        setRecipes(prev => prev.map(r => r.id === recipeToUpdate.id ? recipeToUpdate : r));
        try {
            await api.updateRecipeDetails(recipeToUpdate);
        } catch (err) {
            console.error("Update recipe error:", err);
            setRecipes(originalRecipes); // Kembalikan jika gagal
            throw err;
        }
    };

    const deleteRecipe = async (recipeId) => {
        const originalRecipes = [...recipes];
        // Pembaruan Optimis
        setRecipes(prev => prev.filter(r => r.id !== recipeId));
        try {
            await api.deleteRecipe(recipeId);
        } catch (err) {
            console.error("Delete recipe error:", err);
            setRecipes(originalRecipes); // Kembalikan jika gagal
            throw err;
        }
    };

    const duplicateRecipe = async (recipeId) => {
        try {
            const newRecipe = await api.duplicateRecipe(recipeId);
            // Pembaruan Optimis
            setRecipes(prev => [...prev, newRecipe].sort((a, b) => a.name.localeCompare(b.name)));
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
