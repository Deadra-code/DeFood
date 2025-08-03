// Lokasi file: src/features/FoodDatabase/components/FoodTable.jsx
// Deskripsi: (OPTIMALISASI) Komponen FoodTableRow sekarang dibungkus dengan React.memo
//            untuk mencegah render ulang yang tidak perlu dan meningkatkan performa.

import React from 'react';
import { Button } from '../../../components/ui/button';
import { TableBody, TableCell, TableRow, TableHead, TableHeader } from '../../../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { cn } from '../../../lib/utils';
import BulkActionToolbar from './BulkActionToolbar';

const formatCurrency = (value) => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
};

const formatNumber = (value) => {
    if (value === null) return 'N/A';
    const num = Number(value);
    if (isNaN(num)) return '0';
    return num.toFixed(1);
};

const SortableHeader = ({ children, sortKey, onSort }) => {
    return (
        <TableHead onClick={() => onSort(sortKey)} className="cursor-pointer hover:bg-accent transition-colors">
            <div className="flex items-center gap-2">
                {children}
            </div>
        </TableHead>
    );
};

// --- PENINGKATAN: Komponen dibungkus dengan React.memo ---
const FoodTableRow = React.memo(({ food, isSelected, onSelect, onEdit, onDelete, style }) => {
    return (
        <TableRow style={style} data-state={isSelected ? 'selected' : ''} className="group">
            <TableCell>
                <Checkbox checked={isSelected} onCheckedChange={onSelect} aria-label={`Pilih ${food.name}`}/>
            </TableCell>
            <TableCell className="font-medium">{food.name}</TableCell>
            <TableCell><Badge variant="outline">{food.category || '-'}</Badge></TableCell>
            <TableCell className="text-right">{food.calories_kcal === null ? 'N/A' : `${formatNumber(food.calories_kcal)} kkal`}</TableCell>
            <TableCell className="text-right">{food.protein_g === null ? 'N/A' : `${formatNumber(food.protein_g)} g`}</TableCell>
            <TableCell className="text-right">{food.carbs_g === null ? 'N/A' : `${formatNumber(food.carbs_g)} g`}</TableCell>
            <TableCell className="text-right">{food.fat_g === null ? 'N/A' : `${formatNumber(food.fat_g)} g`}</TableCell>
            <TableCell className="text-right">{food.fiber_g === null ? 'N/A' : `${formatNumber(food.fiber_g)} g`}</TableCell>
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

const FoodTable = ({ foods, selection, onEdit, onDelete, onBulkDelete, sortProps, displayConversion }) => {
    const { selectedFoods, handleSelectFood, handleSelectAll, isAllSelected } = selection;
    const { sort, handleSort } = sortProps;

    const dynamicUnitLabel = `(per ${displayConversion.amount} ${displayConversion.unit})`;

    const headers = [
        { key: 'name', label: 'Nama Bahan', className: 'w-[25%]' },
        { key: 'category', label: 'Kategori', className: 'w-[15%]' },
        { key: 'calories_kcal', label: `Kalori ${dynamicUnitLabel}`, className: 'text-right' },
        { key: 'protein_g', label: `Protein ${dynamicUnitLabel}`, className: 'text-right' },
        { key: 'carbs_g', label: `Karbo ${dynamicUnitLabel}`, className: 'text-right' },
        { key: 'fat_g', label: `Lemak ${dynamicUnitLabel}`, className: 'text-right' },
        { key: 'fiber_g', label: `Serat ${dynamicUnitLabel}`, className: 'text-right' },
        { key: 'price_per_100g', label: `Harga ${dynamicUnitLabel}`, className: 'text-right' },
    ];

    return (
        <div className="border rounded-lg flex flex-col h-full">
            {selectedFoods.size > 0 && (
                <BulkActionToolbar
                    selectedCount={selectedFoods.size}
                    onBulkDelete={onBulkDelete}
                />
            )}
            <div className="relative flex-grow overflow-y-auto">
                <table className="w-full caption-bottom text-sm">
                    <TableHeader className="sticky z-10 bg-card top-0">
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} aria-label="Pilih semua"/>
                            </TableHead>
                            {headers.map(header => (
                                <SortableHeader
                                    key={header.key}
                                    sortKey={header.key}
                                    currentSort={sort}
                                    onSort={handleSort}
                                >
                                    <span className={header.className}>{header.label}</span>
                                </SortableHeader>
                            ))}
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
                </table>
            </div>
        </div>
    );
};

export default FoodTable;
