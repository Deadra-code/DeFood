// Lokasi file: src/features/FoodDatabase/FoodDatabasePage.js
// Deskripsi: Menghapus impor 'cn' yang tidak digunakan.

import React, { useState, useMemo } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PlusCircle, Edit, Trash2, Apple, Flame, Search, Tag, LayoutGrid, List, Filter, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from '../../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '../../components/ui/dropdown-menu';
import { Badge } from '../../components/ui/badge';
import { SkeletonList } from '../../components/ui/SkeletonCard';
import EmptyState from '../../components/ui/EmptyState';
import { useFoodContext } from '../../context/FoodContext';
import { useUIStateContext } from '../../context/UIStateContext';
// PERBAIKAN: Menghapus impor 'cn' yang tidak digunakan

const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
};

const MacroSummary = ({ protein, carbs, fat }) => (
    <div className="flex justify-between text-xs text-muted-foreground mt-2 border-t pt-2">
        <div className="flex flex-col items-center">
            <span className="font-bold">{protein?.toFixed(1) || 0}g</span>
            <span>Protein</span>
        </div>
        <div className="flex flex-col items-center">
            <span className="font-bold">{carbs?.toFixed(1) || 0}g</span>
            <span>Karbo</span>
        </div>
        <div className="flex flex-col items-center">
            <span className="font-bold">{fat?.toFixed(1) || 0}g</span>
            <span>Lemak</span>
        </div>
    </div>
);

export default function FoodDatabasePage() {
    const { foods, foodsLoading, deleteFood } = useFoodContext();
    const { setFoodToEdit } = useUIStateContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [sort, setSort] = useState({ key: 'usage_count', order: 'desc' });
    const [activeCategories, setActiveCategories] = useState(new Set());

    const handleAddNew = () => setFoodToEdit({ isNew: true });
    const handleEdit = (food) => setFoodToEdit({ ...food, isNew: false });
    const handleDelete = (food) => deleteFood(food);

    const categories = useMemo(() => {
        const uniqueCategories = new Set(foods.map(f => f.category).filter(Boolean));
        return Array.from(uniqueCategories).sort();
    }, [foods]);

    const filteredAndSortedFoods = useMemo(() => {
        let processedFoods = [...foods];
        if (searchTerm) {
            processedFoods = processedFoods.filter(food => food.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (activeCategories.size > 0) {
            processedFoods = processedFoods.filter(food => activeCategories.has(food.category));
        }
        processedFoods.sort((a, b) => {
            const valA = a[sort.key];
            const valB = b[sort.key];
            let comparison = 0;
            if (sort.key === 'name') {
                comparison = (valA || '').localeCompare(valB || '');
            } else {
                if (valA > valB) comparison = 1;
                else if (valA < valB) comparison = -1;
            }
            return sort.order === 'desc' ? comparison * -1 : comparison;
        });
        return processedFoods;
    }, [foods, searchTerm, sort, activeCategories]);

    const renderContent = () => {
        if (foodsLoading) {
            return <SkeletonList count={8} />;
        }
        if (filteredAndSortedFoods.length === 0) {
            return (
                <EmptyState 
                    icon={<Apple className="h-20 w-20" />} 
                    title={searchTerm || activeCategories.size > 0 ? "Bahan Tidak Ditemukan" : "Database Kosong"} 
                    description={searchTerm || activeCategories.size > 0 ? "Tidak ada bahan yang cocok dengan filter Anda." : "Mulai dengan menambahkan bahan pertama Anda."}
                >
                    <Button onClick={handleAddNew}>
                        <PlusCircle size={18} className="mr-2" /> Tambah Bahan
                    </Button>
                </EmptyState>
            );
        }

        if (viewMode === 'table') {
            return (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
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
                            {filteredAndSortedFoods.map((food, index) => (
                                <TableRow 
                                    key={food.id} 
                                    className="animate-fade-in-up" 
                                    style={{ animationDelay: `${index * 30}ms` }}
                                >
                                    <TableCell className="font-medium">{food.name}</TableCell>
                                    <TableCell><Badge variant="outline">{food.category || '-'}</Badge></TableCell>
                                    <TableCell>{food.calories_kcal} kkal</TableCell>
                                    <TableCell>{food.protein_g} g</TableCell>
                                    <TableCell>{food.carbs_g} g</TableCell>
                                    <TableCell>{food.fat_g} g</TableCell>
                                    <TableCell>{formatCurrency(food.price_per_100g)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onSelect={() => handleEdit(food)}><Edit size={14} className="mr-2" /> Edit</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleDelete(food)} className="text-destructive focus:text-destructive"><Trash2 size={14} className="mr-2" /> Hapus</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedFoods.map((food, index) => (
                    <Card 
                        key={food.id} 
                        className="flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg animate-fade-in-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="pr-2">{food.name}</CardTitle>
                                {food.category && <Badge variant="secondary">{food.category}</Badge>}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-3 text-sm">
                            <div className="flex items-center text-muted-foreground"><Flame className="h-4 w-4 mr-2 text-red-500" /><span>{food.calories_kcal} kkal per 100g</span></div>
                            <div className="flex items-center text-muted-foreground"><Tag className="h-4 w-4 mr-2 text-green-500" /><span>{formatCurrency(food.price_per_100g)} per 100g</span></div>
                            <MacroSummary protein={food.protein_g} carbs={food.carbs_g} fat={food.fat_g} />
                        </CardContent>
                        <CardFooter className="p-4 pt-2">
                             <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(food)}><Edit size={14} className="mr-2" /> Kelola</Button>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="ml-2"><MoreHorizontal size={16} /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onSelect={() => handleDelete(food)} className="text-destructive focus:text-destructive"><Trash2 size={14} className="mr-2" /> Hapus</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <div className="p-6 lg:p-8 h-full flex flex-col">
            <header className="flex-shrink-0 flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Database Bahan</h1>
                    <p className="text-muted-foreground">Kelola semua bahan dan harganya di sini.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filter</Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Filter Kategori</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {categories.length > 0 ? categories.map(cat => (
                                <DropdownMenuCheckboxItem key={cat} checked={activeCategories.has(cat)} onCheckedChange={() => {
                                    const newSet = new Set(activeCategories);
                                    if (newSet.has(cat)) newSet.delete(cat);
                                    else newSet.add(cat);
                                    setActiveCategories(newSet);
                                }}>{cat}</DropdownMenuCheckboxItem>
                            )) : <DropdownMenuItem disabled>Tidak ada kategori</DropdownMenuItem>}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="outline"><ArrowUpDown className="h-4 w-4 mr-2" /> Urutkan</Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setSort({ key: 'usage_count', order: 'desc' })}>Paling Sering Digunakan</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSort({ key: 'name', order: 'asc' })}>Nama (A-Z)</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSort({ key: 'price_per_100g', order: 'asc' })}>Harga Termurah</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSort({ key: 'price_per_100g', order: 'desc' })}>Harga Termahal</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSort({ key: 'calories_kcal', order: 'asc' })}>Kalori Terendah</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="flex items-center gap-1">
                        <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4" /></Button>
                        <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('table')}><List className="h-4 w-4" /></Button>
                    </div>
                    <div className="relative flex-grow md:flex-grow-0"><Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Cari bahan..." className="pl-8 w-full md:w-[200px]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                    <Button onClick={handleAddNew}><PlusCircle size={18} className="mr-2" /> Tambah</Button>
                </div>
            </header>
            <div className="flex-grow overflow-y-auto pr-2 -mr-4">{renderContent()}</div>
        </div>
    );
}
