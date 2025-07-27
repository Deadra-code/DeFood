// Lokasi file: src/context/UIStateContext.js
// Deskripsi: Disederhanakan untuk hanya mengelola state dialog aplikasi.

import React, { createContext, useContext, useState } from 'react';

const UIStateContext = createContext();

export const UIStateProvider = ({ children }) => {
    // State untuk mengelola data bahan yang sedang diedit atau dibuat.
    // Jika null, dialog tertutup. Jika object, dialog terbuka.
    const [foodToEdit, setFoodToEdit] = useState(null);
    
    // State untuk mengontrol visibilitas dialog pembuatan resep baru.
    const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);

    const value = {
        foodToEdit,
        setFoodToEdit,
        isCreatingRecipe,
        setIsCreatingRecipe,
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
