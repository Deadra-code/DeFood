// Lokasi file: src/features/FoodDatabase/hooks/useFoodSelection.js
// Deskripsi: Hook untuk mengelola logika pemilihan item makanan.

import { useState, useEffect } from 'react';

export const useFoodSelection = (filteredFoods) => {
    const [selectedFoods, setSelectedFoods] = useState(new Set());

    useEffect(() => {
        setSelectedFoods(new Set());
    }, [filteredFoods]);

    const handleSelectFood = (foodId) => {
        setSelectedFoods(prev => {
            const newSet = new Set(prev);
            if (newSet.has(foodId)) {
                newSet.delete(foodId);
            } else {
                newSet.add(foodId);
            }
            return newSet;
        });
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedFoods(new Set(filteredFoods.map(f => f.id)));
        } else {
            setSelectedFoods(new Set());
        }
    };

    const isAllSelected = filteredFoods.length > 0 && selectedFoods.size === filteredFoods.length;

    return {
        selectedFoods,
        handleSelectFood,
        handleSelectAll,
        isAllSelected
    };
};
