// Lokasi file: src/context/RecipeContext.js
// Deskripsi: (DIPERBARUI) Menambahkan pemeriksaan keamanan untuk memastikan
//            hanya resep dengan ID yang valid yang ditambahkan ke state.

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

            // --- PENINGKATAN KEAMANAN ---
            // Sebelum menambahkan ke state, pastikan objek resep baru
            // memiliki ID yang valid (bukan undefined atau null).
            if (newRecipe && typeof newRecipe.id !== 'undefined' && newRecipe.id !== null) {
                setRecipes(prev => [...prev, newRecipe].sort((a, b) => a.name.localeCompare(b.name)));
                return newRecipe;
            } else {
                // Jika ID tidak valid, log error dan jangan perbarui state
                // untuk mencegah aplikasi crash.
                console.error("Gagal menambahkan resep ke state: ID tidak valid.", newRecipe);
                // Mungkin refetch data dari DB untuk sinkronisasi ulang
                fetchRecipes();
                throw new Error("Objek resep yang diterima dari backend tidak valid.");
            }
        } catch (err) {
            console.error("Add recipe error:", err);
            throw err;
        }
    };
    
    const updateRecipe = async (recipeToUpdate) => {
        const originalRecipes = [...recipes];
        setRecipes(prev => prev.map(r => r.id === recipeToUpdate.id ? recipeToUpdate : r));
        try {
            await api.updateRecipeDetails(recipeToUpdate);
        } catch (err) {
            console.error("Update recipe error:", err);
            setRecipes(originalRecipes);
            throw err;
        }
    };

    const deleteRecipe = async (recipeId) => {
        const originalRecipes = [...recipes];
        setRecipes(prev => prev.filter(r => r.id !== recipeId));
        try {
            await api.deleteRecipe(recipeId);
        } catch (err) {
            console.error("Delete recipe error:", err);
            setRecipes(originalRecipes);
            throw err;
        }
    };

    const duplicateRecipe = async (recipeId) => {
        try {
            const newRecipe = await api.duplicateRecipe(recipeId);
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
