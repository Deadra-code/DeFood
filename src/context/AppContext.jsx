// Lokasi file: src/context/AppContext.js
// Deskripsi: Disederhanakan secara drastis untuk hanya menyediakan status `apiReady`.
//            State lain telah dipindahkan ke context masing-masing.

import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [apiReady, setApiReady] = useState(false);

    // Efek ini hanya berjalan sekali untuk mendeteksi kapan API Electron siap.
    useEffect(() => {
        const handleApiReady = () => setApiReady(true);
        
        if (window.api) {
            handleApiReady();
        } else {
            // Fallback jika preload script belum selesai dieksekusi
            window.addEventListener('api-ready', handleApiReady, { once: true });
        }

        return () => window.removeEventListener('api-ready', handleApiReady);
    }, []);
    
    const value = {
        apiReady,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
