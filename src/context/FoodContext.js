// Lokasi file: src/context/FoodContext.js
// Deskripsi: Konteks untuk mengelola state global dari database bahan makanan.
//            Logika disesuaikan untuk melempar error agar bisa ditangani oleh UI.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api/electronAPI';
import { toast } from 'react-hot-toast';
import UndoToast from '../components/ui/UndoToast';
import { useAppContext } from './AppContext';

const FoodContext = createContext();

export const FoodProvider = ({ children }) => {
    const { apiReady } = useAppContext();

    const [foods, setFoods] = useState([]);
    const [foodsLoading, setFoodsLoading] = useState(true);
    const [pendingDelete, setPendingDelete] = useState({});

    const fetchFoods = useCallback(async () => {
        if (!apiReady) return;
        setFoodsLoading(true);
        try {
            const list = await api.getFoods();
            setFoods(list || []);
        } catch (err) {
            console.error("Fetch foods error:", err);
            setFoods([]);
        } finally {
            setFoodsLoading(false);
        }
    }, [apiReady]);

    useEffect(() => {
        if (apiReady) {
            fetchFoods();
        }
    }, [apiReady, fetchFoods]);

    const addFood = async (food) => {
        try {
            const newFood = await api.addFood(food);
            // Muat ulang semua bahan untuk memastikan data (terutama yang diurutkan) konsisten
            await fetchFoods();
            return newFood;
        } catch (err) {
            console.error("Add food error:", err);
            // Melempar error agar bisa ditangkap oleh komponen pemanggil
            throw err;
        }
    };

    const updateFood = async (food) => {
        try {
            await api.updateFood(food);
            // Muat ulang semua bahan untuk memastikan data (terutama yang diurutkan) konsisten
            await fetchFoods();
            return true;
        } catch (err) {
            console.error("Update food error:", err);
            // Melempar error agar bisa ditangkap oleh komponen pemanggil
            throw err;
        }
    };

    const deleteFood = (foodToDelete) => {
        const originalFoods = [...foods];
        
        // 1. Update UI secara optimis
        setFoods(prev => prev.filter(f => f.id !== foodToDelete.id));

        // 2. Buat controller untuk pembatalan
        const controller = { isCancelled: false };
        const deleteId = foodToDelete.id;
        
        setPendingDelete(prev => ({ ...prev, [deleteId]: controller }));

        // 3. Fungsi untuk membatalkan
        const handleUndo = () => {
            controller.isCancelled = true;
            setFoods(originalFoods);
            toast.success(`Penghapusan "${foodToDelete.name}" dibatalkan.`);
            setPendingDelete(prev => {
                const newPending = { ...prev };
                delete newPending[deleteId];
                return newPending;
            });
        };

        // 4. Tampilkan toast dengan opsi undo
        toast.custom(
            (t) => (
                <UndoToast
                    t={t}
                    message={`Bahan "${foodToDelete.name}" dihapus.`}
                    onUndo={handleUndo}
                />
            ),
            { duration: 5000 }
        );

        // 5. Setelah 5 detik, jalankan penghapusan permanen JIKA tidak dibatalkan
        setTimeout(() => {
            setPendingDelete(prev => {
                const newPending = { ...prev };
                delete newPending[deleteId];
                return newPending;
            });

            if (!controller.isCancelled) {
                api.deleteFood(deleteId).catch(err => {
                    console.error("Permanent delete failed:", err);
                    toast.error(`Gagal menghapus "${foodToDelete.name}" secara permanen.`);
                    // Jika gagal di backend, kembalikan state UI
                    setFoods(originalFoods);
                });
            }
        }, 5000);
    };


    const value = {
        foods,
        foodsLoading,
        addFood,
        updateFood,
        deleteFood,
    };

    return <FoodContext.Provider value={value}>{children}</FoodContext.Provider>;
};

export const useFoodContext = () => {
    const context = useContext(FoodContext);
    if (context === undefined) {
        throw new Error('useFoodContext must be used within a FoodProvider');
    }
    return context;
};
