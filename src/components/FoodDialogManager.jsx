// Lokasi file: src/components/FoodDialogManager.jsx
// Deskripsi: Memperbaiki kesalahan sintaks pada impor React.

import React, { useState } from 'react'; // PERBAIKAN: Sintaks impor yang benar
import { Dialog, DialogContent } from './ui/dialog';
import { useNotifier } from '../hooks/useNotifier';
import { useFoodContext } from '../context/FoodContext';
import { useUIStateContext } from '../context/UIStateContext';
import FoodForm from '../features/FoodDatabase/FoodForm';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Info } from 'lucide-react';

export default function FoodDialogManager() {
    const { addFood, updateFood } = useFoodContext();
    const { foodToEdit, setFoodToEdit } = useUIStateContext();
    const { notify } = useNotifier();
    const [isSaving, setIsSaving] = useState(false);

    const isModalOpen = !!foodToEdit;
    const isGlobalEdit = foodToEdit?.source === 'recipe-edit';

    const handleSave = async (data) => {
        setIsSaving(true);
        const isNew = !data.id;

        try {
            if (isNew) {
                await addFood(data);
            } else {
                await updateFood(data);
            }
            notify.success(
                `Bahan makanan "${data.name}" berhasil ${
                    isNew ? 'disimpan' : 'diperbarui'
                }.`
            );
            setFoodToEdit(null);
        } catch (dbError) {
            console.error('Save food error:', dbError);
            const errorMessage =
                dbError.message || 'Terjadi kesalahan tidak diketahui.';
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
            <DialogContent className="sm:max-w-md">
                {foodToEdit && (
                    <>
                        {isGlobalEdit && (
                            <Alert className="mt-4">
                                <Info className="h-4 w-4" />
                                <AlertTitle>Catatan</AlertTitle>
                                <AlertDescription>
                                    Perubahan pada bahan ini akan diterapkan di{' '}
                                    <strong>semua resep</strong> yang menggunakannya.
                                </AlertDescription>
                            </Alert>
                        )}
                        <FoodForm
                            food={foodToEdit}
                            onSave={handleSave}
                            onCancel={handleCancel}
                            isSaving={isSaving}
                        />
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
