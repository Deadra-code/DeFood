// Lokasi file: src/features/FoodDatabase/hooks/useFoodData.js
// Deskripsi: Hook untuk mengambil, memfilter, dan mengurutkan data makanan.

import { useState, useMemo } from 'react';
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

    const categories = useMemo(() => {
        const uniqueCategories = new Set(foods.map(f => f.category).filter(Boolean));
        return Array.from(uniqueCategories).sort();
    }, [foods]);

    const filteredAndSortedFoods = useMemo(() => {
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
            if (sort.key === 'name') {
                comparison = (valA || '').localeCompare(valB || '');
            } else {
                if (valA > valB) comparison = 1;
                else if (valA < valB) comparison = -1;
            }
            return sort.order === 'desc' ? comparison * -1 : comparison;
        });
        return processedFoods;
    }, [foods, debouncedSearchTerm, sort, activeCategories]);
    
    const isFilterActive = searchTerm || activeCategories.size > 0;
    const handleResetFilters = () => {
        setSearchTerm('');
        setActiveCategories(new Set());
    };

    return {
        foods: filteredAndSortedFoods,
        foodsLoading,
        categories,
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
            sortLabels
        }
    };
};
