// Lokasi file: src/features/FoodDatabase/hooks/useFoodData.js
// Deskripsi: (DIPERBARUI) Menambahkan state dan logika untuk konversi tampilan tabel secara dinamis.

import { useState, useMemo, useCallback } from 'react';
import { useFoodContext } from '../../../context/FoodContext';
import { useDebounce } from '../../../hooks/useDebounce';

const sortLabels = {
    'usage_count-desc': 'Paling Sering',
    'name-asc': 'Nama (A-Z)',
    'price_per_100g-asc': 'Harga Termurah',
    'price_per_100g-desc': 'Harga Termahal',
    'calories_kcal-asc': 'Kalori Terendah',
};

export const useFoodData = () => {
    const { foods, foodsLoading } = useFoodContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [sort, setSort] = useState({ key: 'usage_count', order: 'desc' });
    const [activeCategories, setActiveCategories] = useState(new Set());
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // --- BARU: State untuk mengelola satuan tampilan tabel ---
    const [displayConversion, setDisplayConversion] = useState({ amount: 100, unit: 'gram' });

    const categories = useMemo(() => {
        const uniqueCategories = new Set(foods.map(f => f.category).filter(Boolean));
        return Array.from(uniqueCategories).sort();
    }, [foods]);

    const handleSort = useCallback((sortKey) => {
        setSort(currentSort => {
            if (currentSort.key === sortKey) {
                return { key: sortKey, order: currentSort.order === 'asc' ? 'desc' : 'asc' };
            }
            return { key: sortKey, order: 'asc' };
        });
    }, []);

    const filteredAndSortedFoods = useMemo(() => {
        // ... (logika filter dan sort tidak berubah) ...
        let processedFoods = [...foods];
        if (debouncedSearchTerm) {
            processedFoods = processedFoods.filter(food => food.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
        }
        if (activeCategories.size > 0) {
            processedFoods = processedFoods.filter(food => activeCategories.has(food.category));
        }
        processedFoods.sort((a, b) => {
            const valA = a[sort.key];
            const valB = b[sort.key];
            let comparison = 0;
            if (sort.key === 'name' || sort.key === 'category') {
                comparison = (valA || '').localeCompare(valB || '');
            } else {
                if (valA > valB) comparison = 1;
                else if (valA < valB) comparison = -1;
            }
            return sort.order === 'desc' ? comparison * -1 : comparison;
        });
        return processedFoods;
    }, [foods, debouncedSearchTerm, sort, activeCategories]);

    // --- BARU: Logika untuk transformasi data berdasarkan satuan tampilan ---
    const transformedFoods = useMemo(() => {
        const { amount, unit } = displayConversion;
        if (unit === 'gram' && amount === 100) {
            return filteredAndSortedFoods; // Kembalikan data asli jika default
        }

        return filteredAndSortedFoods.map(food => {
            const conversions = JSON.parse(food.unit_conversions || '{}');
            conversions['gram'] = 1; // Selalu ada konversi gram ke gram

            const gramEquivalent = conversions[unit];
            if (gramEquivalent === undefined || gramEquivalent <= 0) {
                // Jika bahan tidak memiliki konversi untuk satuan yang dipilih,
                // kembalikan nilai null agar bisa ditangani di UI.
                return { ...food, calories_kcal: null, protein_g: null, carbs_g: null, fat_g: null, fiber_g: null, price_per_100g: null };
            }

            const conversionFactor = (gramEquivalent * amount) / 100;
            
            return {
                ...food,
                price_per_100g: food.price_per_100g * conversionFactor,
                calories_kcal: food.calories_kcal * conversionFactor,
                protein_g: food.protein_g * conversionFactor,
                carbs_g: food.carbs_g * conversionFactor,
                fat_g: food.fat_g * conversionFactor,
                fiber_g: food.fiber_g * conversionFactor,
            };
        });
    }, [filteredAndSortedFoods, displayConversion]);
    
    const isFilterActive = searchTerm || activeCategories.size > 0;
    const handleResetFilters = () => {
        setSearchTerm('');
        setActiveCategories(new Set());
    };

    return {
        foods: transformedFoods, // Kirim data yang sudah ditransformasi
        foodsLoading,
        categories,
        displayConversion, // Ekspor state baru
        setDisplayConversion, // Ekspor setter baru
        filterProps: {
            searchTerm,
            setSearchTerm,
            activeCategories,
            setActiveCategories,
            isFilterActive,
            handleResetFilters
        },
        sortProps: {
            sort,
            setSort,
            sortLabels,
            handleSort
        }
    };
};
