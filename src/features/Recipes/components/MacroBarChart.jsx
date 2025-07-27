// Lokasi file: src/features/Recipes/components/MacroBarChart.jsx
// Deskripsi: Menambahkan Serat (Fiber) ke dalam visualisasi.

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';

const MacroBarChart = ({ protein, carbs, fat, fiber }) => {
    const [rendered, setRendered] = useState(false);
    const totalMacros = protein + carbs + fat; // Serat tidak dihitung dalam total kalori makro

    useEffect(() => {
        const timer = setTimeout(() => setRendered(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (totalMacros === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Ringkasan Nutrisi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-sm text-muted-foreground py-4">
                        Data nutrisi tidak tersedia.
                    </div>
                </CardContent>
            </Card>
        );
    }

    const proteinPercent = (protein / totalMacros) * 100;
    const carbsPercent = (carbs / totalMacros) * 100;
    const fatPercent = (fat / totalMacros) * 100;

    const macroData = [
        { name: 'Protein', value: protein, percent: proteinPercent, color: 'bg-macro-protein' },
        { name: 'Karbo', value: carbs, percent: carbsPercent, color: 'bg-macro-carbs' },
        { name: 'Lemak', value: fat, percent: fatPercent, color: 'bg-macro-fat' },
    ];

    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle className="text-sm font-medium">Ringkasan Nutrisi / Porsi</CardTitle>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
                    <div className="flex h-3 w-full rounded-full overflow-hidden bg-muted">
                        {macroData.map((macro) => (
                            <Tooltip key={macro.name}>
                                <TooltipTrigger asChild>
                                    <div
                                        className={`${macro.color} transition-all duration-700 ease-out`}
                                        style={{ width: rendered ? `${macro.percent}%` : '0%' }}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{macro.name}: {macro.value.toFixed(1)}g ({macro.percent.toFixed(0)}%)</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </TooltipProvider>
                <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                    {macroData.map((macro) => (
                        <div key={macro.name} className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${macro.color}`} />
                            <span>{macro.name}</span>
                        </div>
                    ))}
                     <div className="flex items-center gap-2 font-semibold">
                        <span>Serat: {fiber?.toFixed(1) || 0}g</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default MacroBarChart;
