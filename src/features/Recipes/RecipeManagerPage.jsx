// Lokasi file: src/features/Recipes/RecipeManagerPage.js
// Deskripsi: Menghapus props 'isDirty' dan 'setIsDirty', sekarang menggunakan dari UIStateContext.

import React, { useState, useMemo } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { PlusCircle, ChevronRight, BookOpen, Search, ArrowUpDown } from 'lucide-react';
import { useRecipeContext } from '../../context/RecipeContext';
import RecipeDetailView from './RecipeDetailView';
import { cn } from '../../lib/utils';
import { SkeletonList } from '../../components/ui/SkeletonCard';
import EmptyState from '../../components/ui/EmptyState';
import { useUIStateContext } from '../../context/UIStateContext';
import { Input } from '../../components/ui/input';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../../components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';

// HAPUS: props isDirty, setIsDirty
export default function RecipeManagerPage({ activeRecipe, setActiveRecipe }) {
    const { recipes, loading: recipesLoading, refetchRecipes } = useRecipeContext();
    const { isDirty, setIsDirty, setIsCreatingRecipe } = useUIStateContext(); // BARU
    const [searchTerm, setSearchTerm] = useState('');
    
    const [pendingRecipe, setPendingRecipe] = useState(null);
    const [isUnsavedAlertOpen, setIsUnsavedAlertOpen] = useState(false);
    const [sortOrder, setSortOrder] = useState('name-asc');

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
        setActiveRecipe(null); 
        refetchRecipes();
    };
    
    const handleRecipeUpdated = (updatedRecipe) => {
        refetchRecipes().then(() => {
            setActiveRecipe(updatedRecipe);
        });
    };

    const sortedAndFilteredRecipes = useMemo(() => {
        let processedRecipes = recipes.filter(recipe =>
            recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        processedRecipes.sort((a, b) => {
            switch (sortOrder) {
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'date-desc': return new Date(b.created_at) - new Date(a.created_at);
                case 'date-asc': return new Date(a.created_at) - new Date(b.created_at);
                default: return 0;
            }
        });
        return processedRecipes;
    }, [recipes, searchTerm, sortOrder]);

    return (
        <div className="grid grid-cols-[320px_1fr] h-full bg-muted/30">
            <aside className="border-r bg-card flex flex-col h-full animate-slide-in-from-left">
                <div className="p-4 border-b flex flex-col gap-4">
                    <div className="flex gap-2">
                        <div className="relative flex-grow">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="search" placeholder="Cari resep..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline" size="icon"><ArrowUpDown className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSortOrder('name-asc')}>Nama (A-Z)</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortOrder('name-desc')}>Nama (Z-A)</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortOrder('date-desc')}>Terbaru</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortOrder('date-asc')}>Terlama</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <Button className="w-full" onClick={() => setIsCreatingRecipe(true)}><PlusCircle className="mr-2 h-4 w-4" /> Resep Baru</Button>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {recipesLoading ? (
                        <div className="p-4"><SkeletonList count={8} /></div>
                    ) : sortedAndFilteredRecipes.length > 0 ? (
                        <div className="space-y-2 p-4">
                            {sortedAndFilteredRecipes.map((recipe, index) => (
                                <Card key={recipe.id} onClick={() => handleRecipeSelect(recipe)} className={cn("cursor-pointer transition-all hover:border-primary/80 animate-fade-in-up", activeRecipe?.id === recipe.id ? 'border-primary bg-primary/5' : '')} style={{ animationDelay: `${index * 50}ms` }}>
                                    <CardContent className="p-3 flex justify-between items-center gap-2">
                                        <p className="font-semibold truncate flex-1 min-w-0">{recipe.name}</p>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                         <div className="p-4 h-full flex items-center justify-center">
                            <EmptyState icon={<BookOpen className="h-16 w-16" />} title="Tidak Ada Resep" description="Buat resep pertama Anda untuk memulai."><Button onClick={() => setIsCreatingRecipe(true)}><PlusCircle className="mr-2 h-4 w-4" /> Buat Resep</Button></EmptyState>
                        </div>
                    )}
                </div>
            </aside>
            
            <main className="flex-grow overflow-y-auto animate-slide-in-from-right" style={{ animationDelay: '100ms' }}>
                {activeRecipe ? (
                    // HAPUS: prop setIsDirty
                    <RecipeDetailView key={activeRecipe.id} recipe={activeRecipe} onRecipeDeleted={handleRecipeDeleted} onRecipeUpdated={handleRecipeUpdated} />
                ) : !recipesLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold">Selamat Datang!</h3>
                        <p className="text-muted-foreground text-sm">Pilih resep dari daftar atau buat yang baru.</p>
                    </div>
                )}
            </main>

            <AlertDialog open={isUnsavedAlertOpen} onOpenChange={setIsUnsavedAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Perubahan Belum Disimpan</AlertDialogTitle><AlertDialogDescription>Anda memiliki perubahan yang belum disimpan. Jika Anda melanjutkan, perubahan tersebut akan hilang. Apakah Anda yakin?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={confirmRecipeChange}>Lanjutkan</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </div>
    );
}
