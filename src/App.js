// Lokasi file: src/App.js
// Deskripsi: Diperbarui untuk mengelola tab secara terprogram melalui state, bukan manipulasi DOM.

import React, { useState, useEffect } from 'react';
import { Loader2, BookOpen, Database, Moon, Sun, Settings } from 'lucide-react';
import { useAppContext } from './context/AppContext';
import RecipeManagerPage from './features/Recipes/RecipeManagerPage';
import FoodDatabasePage from './features/FoodDatabase/FoodDatabasePage';
import SettingsPage from './features/Settings/SettingsPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import ToasterProvider from './components/ui/ToasterProvider.jsx';
import FoodDialogManager from './components/FoodDialogManager';
import RecipeDialogManager from './features/Recipes/components/RecipeDialogManager';
import { useRecipeContext } from './context/RecipeContext';
import { Button } from './components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from './components/ui/alert-dialog';

export default function App() {
    const { apiReady } = useAppContext();
    const { refetchRecipes } = useRecipeContext();
    const [activeRecipe, setActiveRecipe] = useState(null);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    
    // --- PERBAIKAN (Isu #2): Logika tab dikelola oleh state ---
    const [activeTab, setActiveTab] = useState('recipes'); 
    const [pendingTab, setPendingTab] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isUnsavedAlertOpen, setIsUnsavedAlertOpen] = useState(false);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };
    
    const handleRecipeCreated = (newRecipe) => {
        refetchRecipes();
        setActiveRecipe(newRecipe);
    };

    // --- PERBAIKAN (Isu #2): Handler baru untuk perubahan tab ---
    const handleTabChange = (newTab) => {
        // Hanya periksa perubahan jika meninggalkan tab resep
        if (isDirty && activeTab === 'recipes') {
            setPendingTab(newTab);
            setIsUnsavedAlertOpen(true);
        } else {
            setActiveTab(newTab);
        }
    };
    
    // --- PERBAIKAN (Isu #2): Konfirmasi perubahan tab sekarang hanya mengubah state ---
    const confirmTabChange = () => {
        setIsDirty(false);
        setActiveTab(pendingTab);
        setIsUnsavedAlertOpen(false);
        setPendingTab(null);
    };

    if (!apiReady) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
                <Loader2 className="h-8 w-8 animate-spin mr-3" />
                Memuat Aplikasi...
            </div>
        );
    }

    return (
        <>
            <ToasterProvider />
            <FoodDialogManager />
            <RecipeDialogManager onRecipeCreated={handleRecipeCreated} />

            <div className="flex h-screen font-sans bg-background text-foreground">
                {/* --- PERBAIKAN (Isu #2): Komponen Tabs sekarang dikontrol oleh state --- */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full h-full flex flex-col">
                    <header className="flex-shrink-0 border-b px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                               <BookOpen/> DeFood
                            </h1>
                            <TabsList>
                                {/* --- PERBAIKAN (Isu #2): onClick dihapus, dikelola oleh onValueChange di parent --- */}
                                <TabsTrigger value="recipes">
                                    <BookOpen className="h-4 w-4 mr-2" /> Buku Resep
                                </TabsTrigger>
                                <TabsTrigger value="foods">
                                    <Database className="h-4 w-4 mr-2" /> Database Bahan
                                </TabsTrigger>
                                <TabsTrigger value="settings">
                                    <Settings className="h-4 w-4 mr-2" /> Pengaturan
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        </Button>
                    </header>
                    
                    <main className="flex-grow overflow-hidden">
                        <TabsContent value="recipes" className="h-full m-0 animate-fade-in">
                            <RecipeManagerPage 
                                activeRecipe={activeRecipe}
                                setActiveRecipe={setActiveRecipe}
                                isDirty={isDirty}
                                setIsDirty={setIsDirty}
                            />
                        </TabsContent>
                        <TabsContent value="foods" className="h-full m-0 animate-fade-in">
                            <FoodDatabasePage />
                        </TabsContent>
                        <TabsContent value="settings" className="h-full m-0 animate-fade-in">
                            <SettingsPage />
                        </TabsContent>
                    </main>
                </Tabs>
            </div>
            
            <AlertDialog open={isUnsavedAlertOpen} onOpenChange={setIsUnsavedAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Perubahan Belum Disimpan</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda memiliki perubahan yang belum disimpan. Jika Anda melanjutkan, perubahan tersebut akan hilang. Apakah Anda yakin?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingTab(null)}>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmTabChange}>Lanjutkan</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
