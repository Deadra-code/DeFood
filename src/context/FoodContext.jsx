// Lokasi file: src/context/FoodContext.js
// Deskripsi: (LENGKAP & TERBARU) Mengelola state global untuk database bahan,
//            termasuk fungsi untuk pembaruan optimis dan fitur "Undo".

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api/electronAPI';
import { useAppContext } from './AppContext';
import { useNotifier } from '../hooks/useNotifier';

const FoodContext = createContext();

export const FoodProvider = ({ children }) => {
    const { apiReady } = useAppContext();
    const { notify } = useNotifier();

    const [foods, setFoods] = useState([]);
    const [foodsLoading, setFoodsLoading] = useState(true);
    const [updateCounter, setUpdateCounter] = useState(0);

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
        const tempId = `temp-${Date.now()}`;
        const newFoodWithId = { ...food, id: tempId };
        
        setFoods(prevFoods => [...prevFoods, newFoodWithId]);

        try {
            const savedFood = await api.addFood(food);
            await fetchFoods(); // Refetch untuk data yang konsisten
            return savedFood;
        } catch (err) {
            console.error("Add food error:", err);
            setFoods(prevFoods => prevFoods.filter(f => f.id !== tempId));
            throw err;
        }
    };
    
    const addFoodBulk = (foodsToAdd) => {
        setFoods(prevFoods => [...prevFoods, ...foodsToAdd]);
    };

    const updateFood = async (foodToUpdate) => {
        const originalFoods = [...foods];
        
        setFoods(prevFoods => prevFoods.map(f => f.id === foodToUpdate.id ? foodToUpdate : f));

        try {
            await api.updateFood(foodToUpdate);
            setUpdateCounter(c => c + 1); // Memicu update di komponen lain
        } catch (err) {
            console.error("Update food error:", err);
            setFoods(originalFoods);
            throw err;
        }
    };

    const deleteFood = (foodId) => {
        setFoods(prevFoods => prevFoods.filter(f => f.id !== foodId));
        api.deleteFood(foodId).catch(err => {
            console.error("Permanent delete food error:", err);
            notify.error(`Gagal menghapus bahan secara permanen dari database.`);
            fetchFoods(); // Pulihkan dari database jika API call gagal
        });
    };

    const deleteFoodsBulk = async (foodIds) => {
        const originalFoods = [...foods];
        const foodsToDelete = foods.filter(f => foodIds.includes(f.id));
        
        setFoods(prevFoods => prevFoods.filter(f => !foodIds.includes(f.id)));

        try {
            await api.deleteFoodsBulk(foodIds);
            return foodsToDelete;
        } catch (err) {
            console.error("Bulk delete failed:", err);
            setFoods(originalFoods);
            throw err;
        }
    };

    const value = {
        foods,
        foodsLoading,
        updateCounter,
        addFood,
        addFoodBulk,
        updateFood,
        deleteFood,
        deleteFoodsBulk,
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
