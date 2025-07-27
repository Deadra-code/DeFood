// Lokasi file: src/features/Recipes/RecipeManagerPage.js
// Deskripsi: Menerapkan animasi tata letak awal dan daftar bertingkat.

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { PlusCircle, ChevronRight, BookOpen, Search } from 'lucide-react';
import { useRecipeContext } from '../../context/RecipeContext';
import RecipeDetailView from './RecipeDetailView';
import { cn } from '../../lib/utils';
import { SkeletonList } from '../../components/ui/SkeletonCard';
import EmptyState from '../../components/ui/EmptyState';
import { useUIStateContext } from '../../context/UIStateContext';
import { Input } from '../../components/ui/input';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../../components/ui/alert-dialog';

export default function RecipeManagerPage({ activeRecipe, setActiveRecipe, isDirty, setIsDirty }) {
    const { recipes, loading: recipesLoading, refetchRecipes } = useRecipeContext();
    const [searchTerm, setSearchTerm] = useState('');
    const { setIsCreatingRecipe } = useUIStateContext();
    
    const [pendingRecipe, setPendingRecipe] = useState(null);
    const [isUnsavedAlertOpen, setIsUnsavedAlertOpen] = useState(false);

    useEffect(() => {
        if (activeRecipe) {
            const fullRecipeObject = recipes.find(r => r.id === activeRecipe.id);
            if(fullRecipeObject) setActiveRecipe(fullRecipeObject);
        } else if (!recipesLoading && recipes.length > 0) {
            setActiveRecipe(recipes[0]);
        }
    }, [activeRecipe, recipes, recipesLoading, setActiveRecipe]);

    const handleRecipeSelect = (recipe) => {
        if (isDirty) {
            setPendingRecipe(recipe);
            setIsUnsavedAlertOpen(true);
        } else {
            setActiveRecipe(recipe);
        }
    };

    const confirmRecipeChange = () => {
        setIsDirty(false);
        setActiveRecipe(pendingRecipe);
        setIsUnsavedAlertOpen(false);
        setPendingRecipe(null);
    };

    const handleRecipeDeleted = () => {
        setIsDirty(false);
        refetchRecipes();
        setActiveRecipe(null);
    };
    
    const handleRecipeUpdated = (updatedRecipe) => {
        refetchRecipes();
        setActiveRecipe(updatedRecipe);
    };

    const filteredRecipes = recipes.filter(recipe =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="grid grid-cols-[320px_1fr] h-full bg-muted/30">
            {/* PENAMBAHAN: Animasi tata letak awal */}
            <aside className="border-r bg-card flex flex-col h-full animate-slide-in-from-left">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="search" 
                            placeholder="Cari resep..." 
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {recipesLoading ? (
                        <div className="p-4"><SkeletonList count={8} /></div>
                    ) : filteredRecipes.length > 0 ? (
                        <div className="space-y-2 p-4">
                            {filteredRecipes.map((recipe, index) => (
                                // PENAMBAHAN: Animasi daftar bertingkat
                                <Card 
                                    key={recipe.id} 
                                    onClick={() => handleRecipeSelect(recipe)} 
                                    className={cn(
                                        "cursor-pointer transition-all hover:border-primary/80 animate-fade-in-up",
                                        activeRecipe?.id === recipe.id ? 'border-primary bg-primary/5' : ''
                                    )}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <CardContent className="p-3 flex justify-between items-center gap-2">
                                        <p className="font-semibold truncate flex-1 min-w-0">{recipe.name}</p>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                         <div className="p-4 h-full flex items-center justify-center">
                            <EmptyState icon={<BookOpen className="h-16 w-16" />} title="Tidak Ada Resep" description="Buat resep pertama Anda untuk memulai.">
                                <Button onClick={() => setIsCreatingRecipe(true)}><PlusCircle className="mr-2 h-4 w-4" /> Buat Resep</Button>
                            </EmptyState>
                        </div>
                    )}
                </div>
                 <div className="p-4 border-t">
                    <Button className="w-full" onClick={() => setIsCreatingRecipe(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Resep Baru
                    </Button>
                </div>
            </aside>
            
            {/* PENAMBAHAN: Animasi tata letak awal */}
            <main className="flex-grow overflow-y-auto animate-slide-in-from-right" style={{ animationDelay: '100ms' }}>
                {activeRecipe ? (
                    <RecipeDetailView
                        key={activeRecipe.id}
                        recipe={activeRecipe}
                        onRecipeDeleted={handleRecipeDeleted}
                        onRecipeUpdated={handleRecipeUpdated}
                        setIsDirty={setIsDirty}
                    />
                ) : !recipesLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold">Selamat Datang!</h3>
                        <p className="text-muted-foreground text-sm">Pilih resep dari daftar atau buat yang baru.</p>
                    </div>
                )}
            </main>

            <AlertDialog open={isUnsavedAlertOpen} onOpenChange={setIsUnsavedAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Perubahan Belum Disimpan</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda memiliki perubahan yang belum disimpan. Jika Anda melanjutkan, perubahan tersebut akan hilang. Apakah Anda yakin?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRecipeChange}>Lanjutkan</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
