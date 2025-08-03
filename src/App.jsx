// Lokasi file: src/App.js
// Deskripsi: (DIPERBARUI) Menambahkan persistensi state menggunakan localStorage untuk
//            mengingat tab aktif dan resep terakhir yang dibuka.

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
import { useUIStateContext } from './context/UIStateContext';
import { Button } from './components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from './components/ui/alert-dialog';
import { TooltipProvider } from './components/ui/tooltip';
import TitleBar from './components/TitleBar';
import AppMenu from './components/AppMenu';
import SettingsDialog from './features/Settings/SettingsDialog';

export default function App() {
    const { apiReady } = useAppContext();
    const { recipes, loading: recipesLoading } = useRecipeContext();
    const { isDirty, setIsDirty, saveAction } = useUIStateContext();

    // --- PENINGKATAN: State diinisialisasi dari localStorage ---
    const [activeTab, setActiveTab] = useState(localStorage.getItem('activeTab') || 'recipes');
    const [activeRecipe, setActiveRecipe] = useState(null);
    
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [pendingTab, setPendingTab] = useState(null);
    const [isUnsavedAlertOpen, setIsUnsavedAlertOpen] = useState(false);
    const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

    // --- PENINGKATAN: Efek untuk menyimpan state ke localStorage ---
    useEffect(() => {
        localStorage.setItem('activeTab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        if (activeRecipe) {
            localStorage.setItem('activeRecipeId', activeRecipe.id);
        }
    }, [activeRecipe]);

    // Efek untuk mengatur tema
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Efek untuk memulihkan dan mengatur resep aktif
    useEffect(() => {
        if (!recipesLoading && recipes.length > 0) {
            const lastRecipeId = localStorage.getItem('activeRecipeId');
            const recipeToSelect = recipes.find(r => r.id === parseInt(lastRecipeId, 10)) || recipes[0];
            setActiveRecipe(recipeToSelect);
        } else if (!recipesLoading && recipes.length === 0) {
            setActiveRecipe(null);
        }
    }, [recipes, recipesLoading]);


    const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    
    const handleRecipeCreated = (newRecipe) => {
        setActiveRecipe(newRecipe);
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

    const handleSaveAndProceed = async () => {
        if (saveAction && typeof saveAction.save === 'function') {
            await saveAction.save();
        }
        confirmTabChange();
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
                            <RecipeManagerPage 
                                activeRecipe={activeRecipe}
                                setActiveRecipe={setActiveRecipe}
                            />
                        </TabsContent>
                        <TabsContent value="foods" className="h-full m-0 animate-fade-in"><FoodDatabasePage /></TabsContent>
                    </main>
                </Tabs>
            </div>
            
            <AlertDialog open={isUnsavedAlertOpen} onOpenChange={setIsUnsavedAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Perubahan Belum Disimpan</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda memiliki perubahan yang belum disimpan. Apa yang ingin Anda lakukan?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingTab(null)}>Batal</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button variant="destructive" onClick={confirmTabChange}>Lanjutkan Tanpa Menyimpan</Button>
                        </AlertDialogAction>
                        <AlertDialogAction asChild>
                            <Button onClick={handleSaveAndProceed}>Simpan dan Lanjutkan</Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </TooltipProvider>
    );
}
