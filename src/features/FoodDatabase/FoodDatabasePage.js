// Lokasi file: src/features/FoodDatabase/FoodDatabasePage.js
// Deskripsi: (DIPERBARUI) Menambahkan fungsionalitas "sticky header" pada
//            tampilan tabel agar bar aksi dan header tabel tetap terlihat saat scroll.

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PlusCircle, Edit, Trash2, Apple, Flame, Search, Tag, LayoutGrid, List, Filter, ArrowUpDown, MoreHorizontal, X } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from '../../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '../../components/ui/dropdown-menu';
import { Badge } from '../../components/ui/badge';
import { SkeletonList } from '../../components/ui/SkeletonCard';
import EmptyState from '../../components/ui/EmptyState';
import { useFoodContext } from '../../context/FoodContext';
import { useUIStateContext } from '../../context/UIStateContext';
import { useNotifier } from '../../hooks/useNotifier';
import { toast } from 'react-hot-toast';
import UndoToast from '../../components/ui/UndoToast';
import { Checkbox } from '../../components/ui/checkbox';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../../components/ui/alert-dialog';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../lib/utils'; // BARU: Impor cn untuk kelas kondisional

const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
};

const MacroSummary = ({ protein, carbs, fat }) => (
    <div className="flex justify-between text-xs text-muted-foreground mt-2 border-t pt-2">
        <div className="flex flex-col items-center"><span className="font-bold">{protein?.toFixed(1) || 0}g</span><span>Protein</span></div>
        <div className="flex flex-col items-center"><span className="font-bold">{carbs?.toFixed(1) || 0}g</span><span>Karbo</span></div>
        <div className="flex flex-col items-center"><span className="font-bold">{fat?.toFixed(1) || 0}g</span><span>Lemak</span></div>
    </div>
);

const sortLabels = {
    'usage_count-desc': 'Paling Sering',
    'name-asc': 'Nama (A-Z)',
    'price_per_100g-asc': 'Harga Termurah',
    'price_per_100g-desc': 'Harga Termahal',
    'calories_kcal-asc': 'Kalori Terendah',
};

export default function FoodDatabasePage() {
    const { foods, foodsLoading, deleteFood, deleteFoodsBulk, addFoodBulk } = useFoodContext();
    const { setFoodToEdit } = useUIStateContext();
    const { notify } = useNotifier();

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [viewMode, setViewMode] = useState('table'); // Default ke table view
    const [sort, setSort] = useState({ key: 'usage_count', order: 'desc' });
    const [activeCategories, setActiveCategories] = useState(new Set());
    
    const [pendingSingleDeletions, setPendingSingleDeletions] = useState(new Map());
    const [pendingBulkDeletions, setPendingBulkDeletions] = useState(new Map());

    const [selectedFoods, setSelectedFoods] = useState(new Set());
    const [isConfirmBulkDeleteDialogOpen, setIsConfirmBulkDeleteDialogOpen] = useState(false);

    useEffect(() => {
        return () => {
            pendingSingleDeletions.forEach(timerId => clearTimeout(timerId));
            pendingBulkDeletions.forEach(timerId => clearTimeout(timerId));
        };
    }, [pendingSingleDeletions, pendingBulkDeletions]);
    
    useEffect(() => {
        setSelectedFoods(new Set());
    }, [foods, viewMode, debouncedSearchTerm]);

    const handleAddNew = () => setFoodToEdit({ isNew: true });
    const handleEdit = (food) => setFoodToEdit({ ...food, isNew: false });

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

        setPendingSingleDeletions(prev => new Map(prev).set(foodToDelete.id, foodToDelete));

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
            const foodToRestore = pendingSingleDeletions.get(foodId);
            addFoodBulk([foodToRestore]);
            
            clearTimeout(pendingSingleDeletions.get(foodId)?.timerId);
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
            setSelectedFoods(new Set());

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

    const categories = useMemo(() => {
        const uniqueCategories = new Set(foods.map(f => f.category).filter(Boolean));
        return Array.from(uniqueCategories).sort();
    }, [foods]);

    const filteredAndSortedFoods = useMemo(() => {
        let processedFoods = [...foods];

        if (debouncedSearchTerm) {
            processedFoods = processedFoods.filter(food => food.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
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
    }, [foods, debouncedSearchTerm, sort, activeCategories]);
    
    const handleSelectFood = (foodId) => {
        setSelectedFoods(prev => {
            const newSet = new Set(prev);
            if (newSet.has(foodId)) {
                newSet.delete(foodId);
            } else {
                newSet.add(foodId);
            }
            return newSet;
        });
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedFoods(new Set(filteredAndSortedFoods.map(f => f.id)));
        } else {
            setSelectedFoods(new Set());
        }
    };
    
    const isAllSelected = filteredAndSortedFoods.length > 0 && selectedFoods.size === filteredAndSortedFoods.length;

    const isFilterActive = searchTerm || activeCategories.size > 0;
    const handleResetFilters = () => {
        setSearchTerm('');
        setActiveCategories(new Set());
    };
    
    const renderContent = () => {
        if (foodsLoading) return <SkeletonList count={8} />;
        if (filteredAndSortedFoods.length === 0 && !isFilterActive) {
            return <EmptyState icon={<Apple className="h-20 w-20" />} title="Database Kosong" description="Mulai dengan menambahkan bahan pertama Anda."><Button onClick={handleAddNew}><PlusCircle size={18} className="mr-2" /> Tambah Bahan</Button></EmptyState>;
        }
        if (filteredAndSortedFoods.length === 0 && isFilterActive) {
            return <EmptyState icon={<Search className="h-20 w-20" />} title="Bahan Tidak Ditemukan" description="Tidak ada bahan yang cocok dengan filter Anda."><Button variant="outline" onClick={handleResetFilters}>Reset Filter</Button></EmptyState>;
        }

        if (viewMode === 'table') {
            return (
                <Card>
                    {/* --- PERBAIKAN: Bar aksi dibuat sticky --- */}
                    {selectedFoods.size > 0 && (
                        <div className="sticky top-0 z-10 p-4 border-b flex items-center justify-between bg-card">
                            <span className="text-sm font-medium">{selectedFoods.size} bahan terpilih</span>
                            <Button variant="destructive" size="sm" onClick={() => setIsConfirmBulkDeleteDialogOpen(true)}>
                                <Trash2 className="mr-2 h-4 w-4"/> Hapus Terpilih
                            </Button>
                        </div>
                    )}
                    <Table>
                        {/* --- PERBAIKAN: Header tabel dibuat sticky dengan posisi kondisional --- */}
                        <TableHeader className={cn(
                            "sticky z-10 bg-card",
                            selectedFoods.size > 0 ? "top-[65px]" : "top-0" // Posisi top disesuaikan
                        )}>
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
                            {filteredAndSortedFoods.map((food, index) => (
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
                                                <DropdownMenuItem onSelect={() => handleEdit(food)}><Edit size={14} className="mr-2" /> Edit</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleDeleteRequest(food)} className="text-destructive focus:text-destructive"><Trash2 size={14} className="mr-2" /> Hapus</DropdownMenuItem>
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
                    <Card key={food.id} className="flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                        <CardHeader><div className="flex justify-between items-start"><CardTitle className="pr-2">{food.name}</CardTitle>{food.category && <Badge variant="secondary">{food.category}</Badge>}</div></CardHeader>
                        <CardContent className="flex-grow space-y-3 text-sm">
                            <div className="flex items-center text-muted-foreground"><Flame className="h-4 w-4 mr-2 text-red-500" /><span>{food.calories_kcal} kkal per 100g</span></div>
                            <div className="flex items-center text-muted-foreground"><Tag className="h-4 w-4 mr-2 text-green-500" /><span>{formatCurrency(food.price_per_100g)} per 100g</span></div>
                            <MacroSummary protein={food.protein_g} carbs={food.carbs_g} fat={food.fat_g} />
                        </CardContent>
                        <CardFooter className="p-4 pt-2">
                            <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(food)}><Edit size={14} className="mr-2" /> Kelola</Button>
                            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="ml-2"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onSelect={() => handleDeleteRequest(food)} className="text-destructive focus:text-destructive"><Trash2 size={14} className="mr-2" /> Hapus</DropdownMenuItem>
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
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filter</Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Filter Kategori</DropdownMenuLabel><DropdownMenuSeparator />
                            {categories.length > 0 ? categories.map(cat => (<DropdownMenuCheckboxItem key={cat} checked={activeCategories.has(cat)} onCheckedChange={() => {const newSet = new Set(activeCategories); if (newSet.has(cat)) newSet.delete(cat); else newSet.add(cat); setActiveCategories(newSet);}}>{cat}</DropdownMenuCheckboxItem>)) : <DropdownMenuItem disabled>Tidak ada kategori</DropdownMenuItem>}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu><DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-[180px] justify-start text-left"><ArrowUpDown className="h-4 w-4 mr-2" /> {sortLabels[`${sort.key}-${sort.order}`] || 'Urutkan'}</Button>
                    </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {Object.entries(sortLabels).map(([key, label]) => {
                                const [sortKey, sortOrder] = key.split('-');
                                return <DropdownMenuItem key={key} onClick={() => setSort({ key: sortKey, order: sortOrder })}>{label}</DropdownMenuItem>
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {isFilterActive && <Button variant="ghost" size="icon" onClick={handleResetFilters}><X className="h-4 w-4" /></Button>}
                    <div className="flex items-center gap-1">
                        <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4" /></Button>
                        <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('table')}><List className="h-4 w-4" /></Button>
                    </div>
                    <div className="relative flex-grow md:flex-grow-0"><Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Cari bahan..." className="pl-8 w-full md:w-[200px]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                    <Button onClick={handleAddNew}><PlusCircle size={18} className="mr-2" /> Tambah</Button>
                </div>
            </header>
            <div className="flex-grow overflow-y-auto pr-2 -mr-4">
                {renderContent()}
            </div>
            
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
        </div>
    );
}
