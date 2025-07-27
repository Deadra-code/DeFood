// Lokasi file: src/components/FoodDialogManager.jsx
// Deskripsi: Manajer dialog yang disederhanakan untuk menangani CRUD bahan makanan.

import React, { useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { useNotifier } from '../hooks/useNotifier';
import { useFoodContext } from '../context/FoodContext';
import { useUIStateContext } from '../context/UIStateContext';
import FoodForm from '../features/FoodDatabase/FoodForm';

export default function FoodDialogManager() {
    const { addFood, updateFood } = useFoodContext();
    const { foodToEdit, setFoodToEdit } = useUIStateContext();
    const { notify } = useNotifier();
    const [isSaving, setIsSaving] = useState(false);

    const isModalOpen = !!foodToEdit;

    const handleSave = async (data) => {
        setIsSaving(true);
        const isNew = !data.id;

        try {
            if (isNew) {
                await addFood(data);
            } else {
                await updateFood(data);
            }
            notify.success(`Bahan makanan "${data.name}" berhasil ${isNew ? 'disimpan' : 'diperbarui'}.`);
            setFoodToEdit(null); // Tutup dialog setelah berhasil
        } catch (dbError) {
            console.error("Save food error:", dbError);
            // Menampilkan pesan error yang lebih spesifik ke pengguna
            const errorMessage = dbError.message || 'Terjadi kesalahan tidak diketahui.';
            if (errorMessage.toLowerCase().includes('unique constraint')) {
                notify.error(`Gagal: Nama bahan "${data.name}" sudah ada.`);
            } else {
                notify.error(`Gagal menyimpan: ${errorMessage}`);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFoodToEdit(null);
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCancel()}>
            <DialogContent>
                {/* Render form hanya jika ada data 'foodToEdit' */}
                {foodToEdit && (
                    <FoodForm
                        food={foodToEdit}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        isSaving={isSaving}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};
