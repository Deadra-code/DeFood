// Lokasi file: src/features/FoodDatabase/components/FoodTable.jsx
// Deskripsi: Memperbaiki masalah spasi kosong dengan menyesuaikan offset 'top' pada header tabel
//            agar sesuai dengan tinggi toolbar aksi massal.

import React from 'react';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from '../../../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { cn } from '../../../lib/utils';
import BulkActionToolbar from './BulkActionToolbar';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
};

const FoodTableRow = React.memo(({ food, isSelected, onSelect, onEdit, onDelete, style }) => {
    return (
        <TableRow style={style} data-state={isSelected ? 'selected' : ''} className="group">
            <TableCell>
                <Checkbox checked={isSelected} onCheckedChange={onSelect} aria-label={`Pilih ${food.name}`}/>
            </TableCell>
            <TableCell className="font-medium">{food.name}</TableCell>
            <TableCell><Badge variant="outline">{food.category || '-'}</Badge></TableCell>
            <TableCell className="text-right">{food.calories_kcal} kkal</TableCell>
            <TableCell className="text-right">{food.protein_g} g</TableCell>
            <TableCell className="text-right">{food.carbs_g} g</TableCell>
            <TableCell className="text-right">{food.fat_g} g</TableCell>
            <TableCell className="text-right">{formatCurrency(food.price_per_100g)}</TableCell>
            <TableCell className="text-right">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={onEdit}><Edit size={14} className="mr-2" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive"><Trash2 size={14} className="mr-2" /> Hapus</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </TableCell>
        </TableRow>
    );
});

const FoodTable = ({ foods, selection, onEdit, onDelete, onBulkDelete }) => {
    const { selectedFoods, handleSelectFood, handleSelectAll, isAllSelected } = selection;

    // Tinggi toolbar dihitung dari: padding (p-4 -> 1rem*2) + tinggi tombol (size-sm -> h-9 -> 2.25rem) + border (1px)
    // 16px + 36px + 16px + 1px = 69px.
    const toolbarHeight = '69px';

    return (
        <div className="border rounded-lg">
            {selectedFoods.size > 0 && (
                <BulkActionToolbar
                    selectedCount={selectedFoods.size}
                    onBulkDelete={onBulkDelete}
                />
            )}
            <Table>
                {/* --- PERBAIKAN: Menggunakan nilai tinggi toolbar yang akurat untuk offset 'top' --- */}
                <TableHeader className={cn(
                    "sticky z-10 bg-card",
                    selectedFoods.size > 0 ? `top-[${toolbarHeight}]` : "top-0"
                )}>
                    <TableRow>
                        <TableHead className="w-12">
                            <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} aria-label="Pilih semua"/>
                        </TableHead>
                        <TableHead>Nama Bahan</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">Kalori</TableHead>
                        <TableHead className="text-right">Protein</TableHead>
                        <TableHead className="text-right">Karbo</TableHead>
                        <TableHead className="text-right">Lemak</TableHead>
                        <TableHead className="text-right">Harga</TableHead>
                        <TableHead className="text-right w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {foods.map((food, index) => (
                        <FoodTableRow
                            key={food.id}
                            food={food}
                            isSelected={selectedFoods.has(food.id)}
                            onSelect={() => handleSelectFood(food.id)}
                            onEdit={() => onEdit(food)}
                            onDelete={() => onDelete(food)}
                            style={{ animationDelay: `${index * 30}ms` }}
                            className="animate-fade-in-up"
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default FoodTable;
