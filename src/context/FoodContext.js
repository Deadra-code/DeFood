// Lokasi file: src/context/FoodContext.js
// Deskripsi: Memperbaiki peringatan variabel yang tidak digunakan.

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
    // PERBAIKAN: Menggunakan sintaks [, set...] untuk menandakan variabel state tidak dibaca
    const [, setPendingDelete] = useState({});

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
            await fetchFoods();
            return newFood;
        } catch (err) {
            console.error("Add food error:", err);
            throw err;
        }
    };

    const updateFood = async (food) => {
        try {
            await api.updateFood(food);
            await fetchFoods();
            return true;
        } catch (err) {
            console.error("Update food error:", err);
            throw err;
        }
    };

    const deleteFood = (foodToDelete) => {
        const originalFoods = [...foods];
        
        setFoods(prev => prev.filter(f => f.id !== foodToDelete.id));

        const controller = { isCancelled: false };
        const deleteId = foodToDelete.id;
        
        setPendingDelete(prev => ({ ...prev, [deleteId]: controller }));

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
        fetchFoods,
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
