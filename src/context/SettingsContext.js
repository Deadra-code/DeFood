// Lokasi file: src/context/SettingsContext.js
// Deskripsi: Konteks untuk mengelola state global pengaturan bisnis.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api/electronAPI';
import { useAppContext } from './AppContext';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const { apiReady } = useAppContext();
    const [settings, setSettings] = useState({
        margin: '70',
        operationalCost: '0',
        laborCost: '0'
    });
    const [loading, setLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        if (!apiReady) return;
        setLoading(true);
        try {
            const fetchedSettings = await api.getSettings();
            setSettings(fetchedSettings);
        } catch (err) {
            console.error("Fetch settings error:", err);
        } finally {
            setLoading(false);
        }
    }, [apiReady]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const saveSettings = async (newSettings) => {
        try {
            await api.saveSettings(newSettings);
            setSettings(newSettings); // Update state lokal
            return true;
        } catch (err) {
            console.error("Save settings error:", err);
            throw err;
        }
    };

    const value = {
        settings,
        loading,
        saveSettings,
        refetchSettings: fetchSettings,
    };

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettingsContext = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettingsContext must be used within a SettingsProvider');
    }
    return context;
};
