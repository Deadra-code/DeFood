// Lokasi file: src/features/Recipes/components/ProductionPlan/SelectedRecipesPanel.jsx
// Deskripsi: Panel B - Menampilkan resep yang dipilih dan input untuk jumlah porsi.

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { ScrollArea } from '../../../../components/ui/scroll-area';

export default function SelectedRecipesPanel({ plan, onUpdateServings }) {
    const selectedRecipes = Object.values(plan);

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>2. Atur Jumlah Porsi</CardTitle>
                <CardDescription>Masukkan jumlah porsi yang ingin Anda buat untuk setiap resep.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="space-y-4 pr-4">
                        {selectedRecipes.length > 0 ? (
                            selectedRecipes.map(({ recipe, servings }) => (
                                <div key={recipe.id} className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-medium truncate col-span-2">{recipe.name}</span>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={servings}
                                        onChange={(e) => onUpdateServings(recipe.id, e.target.value)}
                                        className="text-right"
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">
                                <p>Pilih resep dari panel kiri untuk memulai.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
