// Lokasi file: src/features/FoodDatabase/hooks/useFoodDeletion.js
// Deskripsi: Hook untuk mengelola logika penghapusan dengan fitur "Undo".

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useFoodContext } from '../../../context/FoodContext';
import { useNotifier } from '../../../hooks/useNotifier';
import UndoToast from '../../../components/ui/UndoToast';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../../../components/ui/alert-dialog';
import { Button } from '../../../components/ui/button';

export const useFoodDeletion = (selectedFoods, onBulkDeleteSuccess) => {
    const { deleteFood, deleteFoodsBulk, addFoodBulk } = useFoodContext();
    const { notify } = useNotifier();
    const [pendingSingleDeletions, setPendingSingleDeletions] = useState(new Map());
    const [pendingBulkDeletions, setPendingBulkDeletions] = useState(new Map());
    const [isConfirmBulkDeleteDialogOpen, setIsConfirmBulkDeleteDialogOpen] = useState(false);

    useEffect(() => {
        return () => {
            pendingSingleDeletions.forEach(data => clearTimeout(data.timerId));
            pendingBulkDeletions.forEach(data => clearTimeout(data.timerId));
        };
    }, [pendingSingleDeletions, pendingBulkDeletions]);

    const handleDeleteRequest = (foodToDelete) => {
        if (pendingSingleDeletions.has(foodToDelete.id)) return;
        
        deleteFood(foodToDelete.id);

        const timerId = setTimeout(() => {
            setPendingSingleDeletions(prev => {
                const newMap = new Map(prev);
                newMap.delete(foodToDelete.id);
                return newMap;
            });
        }, 5000);

        setPendingSingleDeletions(prev => new Map(prev).set(foodToDelete.id, { item: foodToDelete, timerId }));

        toast.custom(
            (t) => (
                <UndoToast
                    t={t}
                    message={`Bahan "${foodToDelete.name}" dihapus.`}
                    onUndo={() => handleUndoSingleDelete(foodToDelete.id, t.id)}
                />
            ),
            { duration: 5000 }
        );
    };

    const handleUndoSingleDelete = (foodId, toastId) => {
        if (pendingSingleDeletions.has(foodId)) {
            const { item, timerId } = pendingSingleDeletions.get(foodId);
            addFoodBulk([item]);
            
            clearTimeout(timerId);
            setPendingSingleDeletions(prev => {
                const newMap = new Map(prev);
                newMap.delete(foodId);
                return newMap;
            });
            notify.success("Penghapusan dibatalkan.");
        }
        if (toastId) toast.dismiss(toastId);
    };

    const handleConfirmBulkDelete = async () => {
        const idsToDelete = Array.from(selectedFoods);
        setIsConfirmBulkDeleteDialogOpen(false);
        
        try {
            const deletedItems = await deleteFoodsBulk(idsToDelete);
            onBulkDeleteSuccess();

            const bulkDeleteId = `bulk-${Date.now()}`;
            const timerId = setTimeout(() => {
                 setPendingBulkDeletions(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(bulkDeleteId);
                    return newMap;
                });
            }, 5000);
            
            setPendingBulkDeletions(prev => new Map(prev).set(bulkDeleteId, { timerId, items: deletedItems }));

            toast.custom(
                (t) => (
                    <UndoToast
                        t={t}
                        message={`${idsToDelete.length} bahan dihapus.`}
                        onUndo={() => handleUndoBulkDelete(bulkDeleteId, t.id)}
                    />
                ),
                { duration: 5000 }
            );

        } catch (err) {
            notify.error(`Gagal menghapus bahan: ${err.message}`);
        }
    };

    const handleUndoBulkDelete = (bulkDeleteId, toastId) => {
        if (pendingBulkDeletions.has(bulkDeleteId)) {
            const { timerId, items } = pendingBulkDeletions.get(bulkDeleteId);
            clearTimeout(timerId);
            
            addFoodBulk(items);
            
            setPendingBulkDeletions(prev => {
                const newMap = new Map(prev);
                newMap.delete(bulkDeleteId);
                return newMap;
            });
            notify.success("Penghapusan massal dibatalkan.");
        }
        if (toastId) toast.dismiss(toastId);
    };
    
    const renderConfirmDialog = () => (
        <AlertDialog open={isConfirmBulkDeleteDialogOpen} onOpenChange={setIsConfirmBulkDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Aksi ini akan menghapus {selectedFoods.size} bahan dari database secara permanen. Aksi ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button variant="destructive" onClick={handleConfirmBulkDelete}>Ya, Hapus</Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    return {
        handleDeleteRequest,
        setIsConfirmBulkDeleteDialogOpen,
        renderConfirmDialog
    };
};
