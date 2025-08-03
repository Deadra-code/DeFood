// Lokasi file: src/context/UIStateContext.js
// Deskripsi: (DIPERBARUI) Menambahkan state 'saveAction' untuk memungkinkan
//            komponen lain memicu fungsi simpan secara global.

import React, { createContext, useContext, useState } from 'react';

const UIStateContext = createContext();

export const UIStateProvider = ({ children }) => {
    const [foodToEdit, setFoodToEdit] = useState(null);
    const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    
    // --- BARU: State untuk menyimpan fungsi 'simpan' yang aktif ---
    // Ini memungkinkan dialog konfirmasi untuk memanggil fungsi simpan
    // dari komponen RecipeDetailView tanpa prop drilling.
    const [saveAction, setSaveAction] = useState(null);

    const value = {
        foodToEdit,
        setFoodToEdit,
        isCreatingRecipe,
        setIsCreatingRecipe,
        isDirty,
        setIsDirty,
        saveAction,
        setSaveAction,
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
