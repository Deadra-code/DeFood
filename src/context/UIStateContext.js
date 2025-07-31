// Lokasi file: src/context/UIStateContext.js
// Deskripsi: Menambahkan state 'isDirty' untuk manajemen perubahan yang belum disimpan secara global.

import React, { createContext, useContext, useState } from 'react';

const UIStateContext = createContext();

export const UIStateProvider = ({ children }) => {
    // State untuk mengelola data bahan yang sedang diedit atau dibuat.
    const [foodToEdit, setFoodToEdit] = useState(null);
    
    // State untuk mengontrol visibilitas dialog pembuatan resep baru.
    const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);

    // BARU: State untuk melacak perubahan yang belum disimpan di halaman detail resep.
    const [isDirty, setIsDirty] = useState(false);

    const value = {
        foodToEdit,
        setFoodToEdit,
        isCreatingRecipe,
        setIsCreatingRecipe,
        isDirty,
        setIsDirty,
    };

    return <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>;
};

export const useUIStateContext = () => {
    const context = useContext(UIStateContext);
    if (context === undefined) {
        throw new Error('useUIStateContext must be used within a UIStateProvider');
    }
    return context;
};
