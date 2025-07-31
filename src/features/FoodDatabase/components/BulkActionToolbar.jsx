// Lokasi file: src/features/FoodDatabase/components/BulkActionToolbar.jsx
// Deskripsi: Toolbar untuk aksi massal pada item yang dipilih.

import React from 'react';
import { Button } from '../../../components/ui/button';
import { Trash2 } from 'lucide-react';

const BulkActionToolbar = ({ selectedCount, onBulkDelete }) => {
    return (
        <div className="sticky top-0 z-10 p-4 border-b flex items-center justify-between bg-card">
            <span className="text-sm font-medium">{selectedCount} bahan terpilih</span>
            <Button variant="destructive" size="sm" onClick={onBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4"/> Hapus Terpilih
            </Button>
        </div>
    );
};

export default BulkActionToolbar;
