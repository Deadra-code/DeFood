// Lokasi file: src/features/Recipes/components/MacroBarChart.jsx
// Deskripsi: Mendesain ulang total komponen untuk menampilkan ringkasan makro
//            yang lebih jelas, informatif, dan menarik secara visual.

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';

const MacroBarChart = ({ protein, carbs, fat, fiber }) => {
    const [rendered, setRendered] = useState(false);
    // Total makro untuk kalkulasi persentase bar (tanpa serat)
    const totalMacrosForBar = protein + carbs + fat;

    useEffect(() => {
        // Memicu animasi saat komponen pertama kali render
        const timer = setTimeout(() => setRendered(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (totalMacrosForBar === 0 && fiber === 0) {
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

    const proteinPercent = totalMacrosForBar > 0 ? (protein / totalMacrosForBar) * 100 : 0;
    const carbsPercent = totalMacrosForBar > 0 ? (carbs / totalMacrosForBar) * 100 : 0;
    const fatPercent = totalMacrosForBar > 0 ? (fat / totalMacrosForBar) * 100 : 0;

    const macroData = [
        { name: 'Protein', value: protein, percent: proteinPercent, color: 'bg-blue-500' },
        { name: 'Karbohidrat', value: carbs, percent: carbsPercent, color: 'bg-amber-500' },
        { name: 'Lemak', value: fat, percent: fatPercent, color: 'bg-red-500' },
    ];

    // --- PENINGKATAN UI/UX ---
    // Komponen item makro yang baru untuk tata letak yang lebih bersih
    const MacroItem = ({ name, value, color }) => (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${color}`} />
                <span className="text-sm text-muted-foreground">{name}</span>
            </div>
            <span className="font-medium text-sm">{value.toFixed(1)}g</span>
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Ringkasan Nutrisi / Porsi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                
                {/* --- PENINGKATAN UI/UX --- */}
                {/* Tata letak daftar yang lebih jelas untuk detail makro dan serat */}
                <div className="space-y-2 pt-2">
                    {macroData.map((macro) => (
                        <MacroItem key={macro.name} {...macro} />
                    ))}
                    <div className="border-t my-2"></div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground font-semibold">Serat</span>
                        <span className="font-medium text-sm">{fiber?.toFixed(1) || 0}g</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default MacroBarChart;
