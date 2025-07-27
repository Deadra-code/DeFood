// Lokasi file: src/features/Recipes/components/RecipeDialogManager.jsx
// Deskripsi: Menggunakan useRecipeContext untuk menambah resep.

import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useUIStateContext } from '../../../context/UIStateContext';
import { useRecipeContext } from '../../../context/RecipeContext'; // Impor hook konteks
import { useNotifier } from '../../../hooks/useNotifier';

const RecipeDialogManager = ({ onRecipeCreated }) => {
    const { isCreatingRecipe, setIsCreatingRecipe } = useUIStateContext();
    const { addRecipe } = useRecipeContext(); // Gunakan konteks
    const { notify } = useNotifier();
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (name.trim().length < 2) {
            setError("Nama resep minimal 2 karakter.");
            return;
        }
        
        try {
            const newRecipe = await addRecipe({ name: name.trim() });
            if (newRecipe) {
                notify.success(`Resep "${name.trim()}" berhasil dibuat.`);
                onRecipeCreated(newRecipe); // Kirim objek resep baru ke parent
                handleClose();
            }
        } catch (err) {
            notify.error("Gagal membuat resep baru.");
        }
    };

    const handleClose = () => {
        setIsCreatingRecipe(false);
        setName('');
        setError('');
    };

    return (
        <Dialog open={isCreatingRecipe} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <DialogHeader>
                        <DialogTitle>Buat Resep Baru</DialogTitle>
                        <DialogDescription>
                            Masukkan nama untuk resep baru Anda. Detail lainnya bisa ditambahkan nanti.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="recipe-name" className="text-right">Nama</Label>
                            <Input 
                                id="recipe-name" 
                                value={name} 
                                onChange={(e) => { setName(e.target.value); setError(''); }} 
                                className="col-span-3" 
                                placeholder="Contoh: Salad Ayam Panggang"
                                autoFocus
                            />
                        </div>
                        {error && <p className="col-start-2 col-span-3 text-red-500 text-xs">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>Batal</Button>
                        <Button type="submit">Simpan</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default RecipeDialogManager;
