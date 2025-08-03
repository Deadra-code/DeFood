// Lokasi file: src/features/Recipes/components/ProductionPlan/ProductionPlanPage.jsx
// Deskripsi: Komponen utama untuk fitur "Kalkulator Gabungan".
//            Mengelola state dan menyatukan semua bagian dari fitur ini.

import React, { useState, useMemo, useEffect } from 'react';
import { useRecipeContext } from '../../../../context/RecipeContext';
import * as api from '../../../../api/electronAPI';
import { calculateProductionPlan } from '../../../../utils/productionCalculator';
import RecipeSelectionList from './RecipeSelectionList';
import SelectedRecipesPanel from './SelectedRecipesPanel';
import AggregatedResults from './AggregatedResults';
import { Button } from '../../../../components/ui/button';
import { XCircle } from 'lucide-react';

export default function ProductionPlanPage() {
    const { recipes: allRecipes } = useRecipeContext();
    const [plan, setPlan] = useState({});
    const [ingredientsData, setIngredientsData] = useState({});

    // Mengambil data bahan untuk resep yang dipilih
    useEffect(() => {
        const fetchIngredients = async () => {
            const recipeIds = Object.keys(plan);
            const newIngredients = {};
            for (const id of recipeIds) {
                if (!ingredientsData[id]) { // Hanya fetch jika belum ada
                    const ingredients = await api.getIngredientsForRecipe(id);
                    newIngredients[id] = ingredients;
                }
            }
            if (Object.keys(newIngredients).length > 0) {
                setIngredientsData(prev => ({ ...prev, ...newIngredients }));
            }
        };

        fetchIngredients();
    }, [plan]);

    const handleToggleRecipe = (recipe) => {
        setPlan(prevPlan => {
            const newPlan = { ...prevPlan };
            if (newPlan[recipe.id]) {
                delete newPlan[recipe.id];
            } else {
                newPlan[recipe.id] = { recipe, servings: recipe.servings || 1 };
            }
            return newPlan;
        });
    };

    const handleUpdateServings = (recipeId, servings) => {
        const newServings = Math.max(1, parseInt(servings, 10) || 1);
        setPlan(prevPlan => ({
            ...prevPlan,
            [recipeId]: { ...prevPlan[recipeId], servings: newServings }
        }));
    };
    
    const handleResetPlan = () => {
        setPlan({});
        setIngredientsData({});
    };

    // Kalkulasi hasil gabungan menggunakan useMemo untuk efisiensi
    const aggregatedData = useMemo(() => {
        return calculateProductionPlan(plan, ingredientsData);
    }, [plan, ingredientsData]);

    const selectedRecipeIds = Object.keys(plan);

    return (
        <div className="p-6 lg:p-8 h-full flex flex-col gap-6">
            <header className="flex-shrink-0 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Kalkulator Resep Gabungan</h1>
                    <p className="text-muted-foreground">Rencanakan produksi untuk beberapa resep sekaligus.</p>
                </div>
                <Button variant="outline" onClick={handleResetPlan} disabled={selectedRecipeIds.length === 0}>
                    <XCircle className="mr-2 h-4 w-4" /> Bersihkan
                </Button>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
                {/* Panel A: Daftar Pilihan Resep */}
                <RecipeSelectionList
                    allRecipes={allRecipes}
                    selectedRecipeIds={selectedRecipeIds}
                    onToggleRecipe={handleToggleRecipe}
                />
                <div className="lg:col-span-2 grid grid-rows-[auto_1fr] gap-6 min-h-0">
                    {/* Panel B: Resep Terpilih & Pengaturan Porsi */}
                    <SelectedRecipesPanel
                        plan={plan}
                        onUpdateServings={handleUpdateServings}
                    />
                    {/* Panel C: Hasil Kalkulasi Gabungan */}
                    <AggregatedResults
                        aggregatedData={aggregatedData}
                    />
                </div>
            </div>
        </div>
    );
}
