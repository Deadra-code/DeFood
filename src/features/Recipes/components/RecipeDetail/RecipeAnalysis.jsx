// Lokasi file: src/features/Recipes/components/RecipeDetail/RecipeAnalysis.jsx
// Deskripsi: Menghapus impor 'Flame' yang tidak digunakan untuk menghilangkan peringatan ESLint.

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
// HAPUS: import { Flame } from 'lucide-react';
import CostAnalysisCard from '../CostAnalysisCard';
import MacroBarChart from '../MacroBarChart';

const StatCard = ({ title, value, description }) => (
    <Card className="flex flex-col justify-center">
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight">{value}</span>
                <span className="text-xl text-muted-foreground">kkal</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </CardContent>
    </Card>
);

export const RecipeAnalysis = ({ 
    recipeId, 
    recipeTotals, 
    servings, 
    ingredients, 
    operationalCost, 
    laborCost, 
    margin,
    onCostChange 
}) => {
    const safeServings = servings > 0 ? servings : 1;
    const hppPerPortion = recipeTotals.price / safeServings;
    const caloriesPerPortion = recipeTotals.calories / safeServings;

    return (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <div className="grid gap-6">
                 <StatCard 
                    title="Total Kalori" 
                    value={caloriesPerPortion.toFixed(0)}
                    description="per porsi saji"
                />
                <MacroBarChart
                    protein={recipeTotals.protein / safeServings}
                    carbs={recipeTotals.carbs / safeServings}
                    fat={recipeTotals.fat / safeServings}
                    fiber={recipeTotals.fiber / safeServings}
                />
            </div>
            <CostAnalysisCard
                key={recipeId}
                hppPerPortion={hppPerPortion}
                ingredients={ingredients}
                servings={servings}
                operationalCost={operationalCost}
                laborCost={laborCost}
                margin={margin}
                onCostChange={onCostChange}
            />
        </div>
    );
};
