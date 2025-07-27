// Lokasi file: src/features/Recipes/components/ImportIngredientsDialog.jsx
// Deskripsi: Menambahkan tombol AI untuk menyarankan draf bahan berdasarkan nama resep.

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger } from '../../../components/ui/dialog';
import { Textarea } from '../../../components/ui/textarea';
import { useNotifier } from '../../../hooks/useNotifier';
import * as api from '../../../api/electronAPI';
import { Loader2, CheckCircle, XCircle, FileText, Sparkles } from 'lucide-react';
import { useFoodContext } from '../../../context/FoodContext';

const cleanIngredientLine = (line) => {
    return line
        .replace(/^[\d\s/.,]+(gram|kg|g|mg|ons|sdm|sdt|siung|buah|lembar|batang|pcs|ml|l)?\s*/i, '')
        .trim();
};

// PERBAIKAN: Menerima objek `recipe` lengkap, bukan hanya `recipeId`
const ImportIngredientsDialog = ({ recipe, onFinished }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false); // State baru untuk loading saran AI
    const [status, setStatus] = useState('Silakan tempel daftar bahan Anda di sini.');
    const [result, setResult] = useState(null);
    const { notify } = useNotifier();
    const { fetchFoods } = useFoodContext();

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setText('');
                setIsProcessing(false);
                setIsSuggesting(false);
                setStatus('Silakan tempel daftar bahan Anda di sini.');
                setResult(null);
            }, 200);
        } else {
            api.onAiProcessStatus(({ message }) => {
                setStatus(message);
            });
        }
        return () => {
            api.removeAiProcessStatusListener();
        };
    }, [isOpen]);

    // --- FUNGSI BARU: Menghasilkan draf bahan dengan AI ---
    const handleGenerateSuggestions = async () => {
        if (!recipe.name) {
            notify.error("Nama resep tidak valid untuk menghasilkan saran.");
            return;
        }
        setIsSuggesting(true);
        try {
            const suggestions = await api.draftIngredients(recipe.name);
            if (suggestions && suggestions.length > 0) {
                // Menggabungkan nama bahan, masing-masing di baris baru
                const suggestionText = suggestions.map(s => s.name).join('\n');
                setText(prev => prev ? `${prev}\n${suggestionText}` : suggestionText);
                notify.success("Saran bahan berhasil ditambahkan ke area teks.");
            } else {
                notify.info("AI tidak dapat memberikan saran untuk resep ini.");
            }
        } catch (err) {
            notify.error(`Gagal mendapatkan saran AI: ${err.message}`);
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleProcess = async () => {
        const lines = text.split('\n')
            .map(line => cleanIngredientLine(line))
            .filter(line => line.length > 1);

        if (lines.length === 0) {
            notify.error("Tidak ada nama bahan yang valid untuk diproses.");
            return;
        }

        setIsProcessing(true);
        setStatus('Menganalisis dan memproses bahan...');
        setResult(null);

        try {
            const { processedFoods, failed } = await api.processUnknownIngredients(lines);
            
            if (processedFoods.length > 0) {
                setStatus(`Menambahkan ${processedFoods.length} bahan ke resep...`);
                
                const ingredientsToAdd = processedFoods.map(food => ({
                    food_id: food.id,
                    quantity: 100,
                    unit: 'g',
                }));

                await api.addIngredientsBulk({ recipe_id: recipe.id, ingredients: ingredientsToAdd });
            }
            
            setResult({ added: processedFoods.map(f => f.name), failed });
            setStatus(`Proses selesai! ${processedFoods.length} bahan ditambahkan ke resep.`);
            
            if (processedFoods.length > 0) {
                await fetchFoods();
                onFinished();
            }
        } catch (err) {
            notify.error(`Terjadi kesalahan: ${err.message}`);
            setStatus('Proses gagal. Silakan coba lagi.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" /> Impor dari Teks
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex justify-between items-center">
                        <DialogTitle>Impor & Lengkapi Bahan Otomatis</DialogTitle>
                        {/* --- TOMBOL AI BARU --- */}
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleGenerateSuggestions} 
                            disabled={isSuggesting || isProcessing}
                        >
                            {isSuggesting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                            )}
                            Dapatkan Saran
                        </Button>
                    </div>
                    <DialogDescription>
                        Tempel daftar bahan Anda (satu bahan per baris), atau klik "Dapatkan Saran" agar AI membuatkan draf untuk Anda.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Textarea
                        placeholder="Contoh:&#10;250 gram dada ayam&#10;5 siung bawang putih&#10;1 sdt garam..."
                        rows={10}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={isProcessing}
                    />
                    <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground min-h-[40px] flex items-center">
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <span>{status}</span>
                    </div>
                    {result && (
                        <div className="space-y-2 text-sm">
                            {result.added.length > 0 && (
                                <div className="text-green-600 flex items-start">
                                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5" />
                                    <div><strong>Berhasil Ditambahkan:</strong> {result.added.join(', ')}</div>
                                </div>
                            )}
                            {result.failed.length > 0 && (
                                <div className="text-red-600 flex items-start">
                                    <XCircle className="h-4 w-4 mr-2 mt-0.5" />
                                    <div><strong>Gagal Diproses:</strong> {result.failed.map(f => f.name).join(', ')}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isProcessing}>
                        {result ? 'Tutup' : 'Batal'}
                    </Button>
                    <Button onClick={handleProcess} disabled={isProcessing || !text}>
                        {isProcessing ? 'Memproses...' : 'Mulai Proses'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ImportIngredientsDialog;
