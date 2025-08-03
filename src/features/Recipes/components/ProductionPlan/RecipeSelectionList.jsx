// Lokasi file: src/features/Recipes/components/ProductionPlan/RecipeSelectionList.jsx
// Deskripsi: Panel A - Menampilkan daftar semua resep dengan checkbox untuk pemilihan.

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Search } from 'lucide-react';

export default function RecipeSelectionList({ allRecipes, selectedRecipeIds, onToggleRecipe }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRecipes = allRecipes.filter(recipe =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>1. Pilih Resep</CardTitle>
                <div className="relative pt-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari resep..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="space-y-2 pr-4">
                        {filteredRecipes.map(recipe => (
                            <div
                                key={recipe.id}
                                className="flex items-center space-x-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-accent"
                                onClick={() => onToggleRecipe(recipe)}
                            >
                                <Checkbox
                                    id={`recipe-${recipe.id}`}
                                    checked={selectedRecipeIds.includes(String(recipe.id))}
                                    onCheckedChange={() => onToggleRecipe(recipe)}
                                />
                                <label htmlFor={`recipe-${recipe.id}`} className="font-medium leading-none cursor-pointer">
                                    {recipe.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
