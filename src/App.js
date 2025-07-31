// Lokasi file: src/App.js
// Deskripsi: Menghapus state 'isDirty' lokal dan props terkait, sekarang menggunakan dari UIStateContext.

import React, { useState, useEffect } from 'react';
import { Loader2, BookOpen, Database, Moon, Sun, Settings as SettingsIcon } from 'lucide-react';
import { useAppContext } from './context/AppContext';
import RecipeManagerPage from './features/Recipes/RecipeManagerPage';
import FoodDatabasePage from './features/FoodDatabase/FoodDatabasePage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import ToasterProvider from './components/ui/ToasterProvider.jsx';
import FoodDialogManager from './components/FoodDialogManager';
import RecipeDialogManager from './features/Recipes/components/RecipeDialogManager';
import { useRecipeContext } from './context/RecipeContext';
import { useUIStateContext } from './context/UIStateContext'; // BARU
import { Button } from './components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from './components/ui/alert-dialog';
import { TooltipProvider } from './components/ui/tooltip';
import TitleBar from './components/TitleBar';
import AppMenu from './components/AppMenu';
import SettingsDialog from './features/Settings/SettingsDialog';

export default function App() {
    const { apiReady } = useAppContext();
    const { recipes, loading: recipesLoading, refetchRecipes } = useRecipeContext();
    const { isDirty, setIsDirty } = useUIStateContext(); // BARU: Menggunakan state dari konteks
    const [activeRecipe, setActiveRecipe] = useState(null);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    
    const [newlyCreatedRecipe, setNewlyCreatedRecipe] = useState(null);
    
    const [activeTab, setActiveTab] = useState('recipes'); 
    const [pendingTab, setPendingTab] = useState(null);
    // HAPUS: const [isDirty, setIsDirty] = useState(false);
    const [isUnsavedAlertOpen, setIsUnsavedAlertOpen] = useState(false);
    
    const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        if (newlyCreatedRecipe && recipes.find(r => r.id === newlyCreatedRecipe.id)) {
            setActiveRecipe(newlyCreatedRecipe);
            setNewlyCreatedRecipe(null);
        }
    }, [newlyCreatedRecipe, recipes]);

    useEffect(() => {
        if (!recipesLoading && recipes.length > 0 && !activeRecipe && !newlyCreatedRecipe) {
            const sortedRecipes = [...recipes].sort((a, b) => a.name.localeCompare(b.name));
            setActiveRecipe(sortedRecipes[0]);
        }
    }, [recipes, recipesLoading, activeRecipe, newlyCreatedRecipe]);

    const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    
    const handleRecipeCreated = (newRecipe) => {
        refetchRecipes().then(() => {
            setNewlyCreatedRecipe(newRecipe);
        });
    };

    const handleTabChange = (newTab) => {
        if (isDirty && activeTab === 'recipes') {
            setPendingTab(newTab);
            setIsUnsavedAlertOpen(true);
        } else {
            setActiveTab(newTab);
        }
    };
    
    const confirmTabChange = () => {
        setIsDirty(false);
        setActiveTab(pendingTab);
        setIsUnsavedAlertOpen(false);
        setPendingTab(null);
    };

    if (!apiReady) {
        return <div className="flex h-screen w-full items-center justify-center bg-background text-foreground"><Loader2 className="h-8 w-8 animate-spin mr-3" />Memuat Aplikasi...</div>;
    }

    return (
        <TooltipProvider>
            <ToasterProvider />
            <FoodDialogManager />
            <RecipeDialogManager onRecipeCreated={handleRecipeCreated} />
            <SettingsDialog isOpen={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen} />

            <div className="flex h-screen font-sans bg-background text-foreground border rounded-lg overflow-hidden">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full h-full flex flex-col">
                    <header className="flex-shrink-0 border-b px-2 py-2 flex items-center justify-between" style={{ WebkitAppRegion: 'drag' }}>
                        <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' }}>
                            <h1 className="text-xl font-bold text-primary flex items-center gap-2 ml-2"><BookOpen/> DeFood</h1>
                            <TabsList>
                                <TabsTrigger value="recipes"><BookOpen className="h-4 w-4 mr-2" /> Buku Resep</TabsTrigger>
                                <TabsTrigger value="foods"><Database className="h-4 w-4 mr-2" /> Database Bahan</TabsTrigger>
                            </TabsList>
                        </div>
                        <div className="flex items-center gap-2">
                            <div style={{ WebkitAppRegion: 'no-drag' }} className="flex items-center">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme} aria-label="Toggle theme">
                                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsSettingsDialogOpen(true)} aria-label="Buka Pengaturan">
                                    <SettingsIcon className="h-4 w-4" />
                                </Button>
                            </div>
                            <AppMenu />
                            <TitleBar />
                        </div>
                    </header>
                    
                    <main className="flex-grow overflow-hidden">
                        <TabsContent value="recipes" className="h-full m-0 animate-fade-in">
                            {/* HAPUS: props isDirty dan setIsDirty */}
                            <RecipeManagerPage 
                                activeRecipe={activeRecipe}
                                setActiveRecipe={setActiveRecipe}
                            />
                        </TabsContent>
                        <TabsContent value="foods" className="h-full m-0 animate-fade-in"><FoodDatabasePage /></TabsContent>
                    </main>
                </Tabs>
            </div>
            
            <AlertDialog open={isUnsavedAlertOpen} onOpenChange={setIsUnsavedAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Perubahan Belum Disimpan</AlertDialogTitle><AlertDialogDescription>Anda memiliki perubahan yang belum disimpan. Jika Anda melanjutkan, perubahan tersebut akan hilang. Apakah Anda yakin?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setPendingTab(null)}>Batal</AlertDialogCancel><AlertDialogAction onClick={confirmTabChange}>Lanjutkan</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </TooltipProvider>
    );
}
