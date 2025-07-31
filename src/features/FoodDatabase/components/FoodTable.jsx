// Lokasi file: src/features/FoodDatabase/components/FoodTable.jsx
// Deskripsi: Komponen untuk merender data makanan dalam format tabel.

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

const FoodTable = ({ foods, selection, onEdit, onDelete, onBulkDelete }) => {
    const { selectedFoods, handleSelectFood, handleSelectAll, isAllSelected } = selection;

    return (
        <div className="border rounded-lg">
            {selectedFoods.size > 0 && (
                <BulkActionToolbar
                    selectedCount={selectedFoods.size}
                    onBulkDelete={onBulkDelete}
                />
            )}
            <Table>
                <TableHeader className={cn("sticky z-10 bg-card", selectedFoods.size > 0 ? "top-[65px]" : "top-0")}>
                    <TableRow>
                        <TableHead className="w-12">
                            <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} aria-label="Pilih semua"/>
                        </TableHead>
                        <TableHead>Nama Bahan</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Kalori</TableHead>
                        <TableHead>Protein</TableHead>
                        <TableHead>Karbo</TableHead>
                        <TableHead>Lemak</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead className="text-right w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {foods.map((food, index) => (
                        <TableRow key={food.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 30}ms` }} data-state={selectedFoods.has(food.id) ? 'selected' : ''}>
                            <TableCell>
                                <Checkbox checked={selectedFoods.has(food.id)} onCheckedChange={() => handleSelectFood(food.id)} aria-label={`Pilih ${food.name}`}/>
                            </TableCell>
                            <TableCell className="font-medium">{food.name}</TableCell>
                            <TableCell><Badge variant="outline">{food.category || '-'}</Badge></TableCell>
                            <TableCell>{food.calories_kcal} kkal</TableCell>
                            <TableCell>{food.protein_g} g</TableCell>
                            <TableCell>{food.carbs_g} g</TableCell>
                            <TableCell>{food.fat_g} g</TableCell>
                            <TableCell>{formatCurrency(food.price_per_100g)}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onSelect={() => onEdit(food)}><Edit size={14} className="mr-2" /> Edit</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => onDelete(food)} className="text-destructive focus:text-destructive"><Trash2 size={14} className="mr-2" /> Hapus</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default FoodTable;
