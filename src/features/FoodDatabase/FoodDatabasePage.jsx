// Lokasi file: src/features/FoodDatabase/FoodDatabasePage.js
// Deskripsi: (DIPERBARUI) Meneruskan state dan handler untuk fitur konversi tampilan
//            ke komponen header dan tabel.

import React, { useState } from 'react';
import { Apple, PlusCircle, Search } from 'lucide-react';

import { useFoodData } from './hooks/useFoodData';
import { useFoodSelection } from './hooks/useFoodSelection';
import { useFoodDeletion } from './hooks/useFoodDeletion';

import FoodDatabaseHeader from './components/FoodDatabaseHeader';
import FoodGrid from './components/FoodGrid';
import FoodTable from './components/FoodTable';
import { SkeletonList } from '../../components/ui/SkeletonCard';
import EmptyState from '../../components/ui/EmptyState';
import { useUIStateContext } from '../../context/UIStateContext';
import { Button } from '../../components/ui/button';

export default function FoodDatabasePage() {
    const { setFoodToEdit } = useUIStateContext();
    const [viewMode, setViewMode] = useState('table');

    const { foods, foodsLoading, categories, filterProps, sortProps, displayConversion, setDisplayConversion } = useFoodData();
    const selection = useFoodSelection(foods);
    const deletion = useFoodDeletion(selection.selectedFoods, () => selection.handleSelectAll(false));

    const handleAddNew = () => setFoodToEdit({ isNew: true });
    const handleEdit = (food) => setFoodToEdit({ ...food, isNew: false });

    const renderContent = () => {
        if (foodsLoading) {
            return <SkeletonList count={8} />;
        }
        if (foods.length === 0 && !filterProps.isFilterActive) {
            return (
                <EmptyState icon={<Apple className="h-20 w-20" />} title="Database Kosong" description="Mulai dengan menambahkan bahan pertama Anda.">
                    <Button onClick={handleAddNew}><PlusCircle size={18} className="mr-2" /> Tambah Bahan</Button>
                </EmptyState>
            );
        }
        if (foods.length === 0 && filterProps.isFilterActive) {
            return (
                <EmptyState icon={<Search className="h-20 w-20" />} title="Bahan Tidak Ditemukan" description="Tidak ada bahan yang cocok dengan filter Anda.">
                    <Button variant="outline" onClick={filterProps.handleResetFilters}>Reset Filter</Button>
                </EmptyState>
            );
        }

        return viewMode === 'table' ? (
            <FoodTable
                foods={foods}
                selection={selection}
                onEdit={handleEdit}
                onDelete={deletion.handleDeleteRequest}
                onBulkDelete={() => deletion.setIsConfirmBulkDeleteDialogOpen(true)}
                sortProps={sortProps}
                displayConversion={displayConversion} // Kirim prop baru
            />
        ) : (
            <FoodGrid
                foods={foods}
                onEdit={handleEdit}
                onDelete={deletion.handleDeleteRequest}
            />
        );
    };

    return (
        <div className="p-6 lg:p-8 h-full flex flex-col">
            <FoodDatabaseHeader
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onAddNew={handleAddNew}
                categories={categories}
                filterProps={filterProps}
                sortProps={sortProps}
                displayConversion={displayConversion} // Kirim prop baru
                onDisplayConversionChange={setDisplayConversion} // Kirim prop baru
            />
            <div className="flex-grow overflow-y-auto pr-2 -mr-4">
                {renderContent()}
            </div>
            {deletion.renderConfirmDialog()}
        </div>
    );
}
