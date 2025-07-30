// Lokasi file: src/features/Recipes/components/RecipeDetail/RecipeAnalysis.jsx
// Deskripsi: (DIPERBARUI) Komponen ini sekarang menerima dan meneruskan prop
//            margin keuntungan ke CostAnalysisCard.

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Flame } from 'lucide-react';
import CostAnalysisCard from '../CostAnalysisCard';
import MacroBarChart from '../MacroBarChart';

const StatCard = ({ title, value, icon }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
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

    return (
        <div className="grid gap-4 grid-cols-2">
            <StatCard title="Total Kalori / Porsi" value={`${(recipeTotals.calories / safeServings).toFixed(0)} kkal`} icon={<Flame className="h-4 w-4 text-muted-foreground" />} />
            <CostAnalysisCard
                key={recipeId}
                hppPerPortion={hppPerPortion}
                ingredients={ingredients}
                servings={servings}
                operationalCost={operationalCost}
                laborCost={laborCost}
                margin={margin} // Meneruskan prop
                onCostChange={onCostChange}
            />
            <MacroBarChart
                protein={recipeTotals.protein / safeServings}
                carbs={recipeTotals.carbs / safeServings}
                fat={recipeTotals.fat / safeServings}
                fiber={recipeTotals.fiber / safeServings}
            />
        </div>
    );
};
