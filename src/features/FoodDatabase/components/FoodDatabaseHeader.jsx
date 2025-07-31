// Lokasi file: src/features/FoodDatabase/components/FoodDatabaseHeader.jsx
// Deskripsi: Komponen header untuk halaman database bahan.

import React from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '../../../components/ui/dropdown-menu';
import { PlusCircle, Search, LayoutGrid, List, Filter, ArrowUpDown, X } from 'lucide-react';

const FoodDatabaseHeader = ({
    viewMode,
    onViewModeChange,
    onAddNew,
    categories,
    filterProps,
    sortProps
}) => {
    const { searchTerm, setSearchTerm, activeCategories, setActiveCategories, isFilterActive, handleResetFilters } = filterProps;
    const { sort, setSort, sortLabels } = sortProps;

    return (
        <header className="flex-shrink-0 flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
            <div>
                <h1 className="text-3xl font-bold">Database Bahan</h1>
                <p className="text-muted-foreground">Kelola semua bahan dan harganya di sini.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto items-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Filter Kategori</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {categories.length > 0 ? categories.map(cat => (
                            <DropdownMenuCheckboxItem
                                key={cat}
                                checked={activeCategories.has(cat)}
                                onCheckedChange={() => {
                                    const newSet = new Set(activeCategories);
                                    if (newSet.has(cat)) newSet.delete(cat);
                                    else newSet.add(cat);
                                    setActiveCategories(newSet);
                                }}
                            >
                                {cat}
                            </DropdownMenuCheckboxItem>
                        )) : <DropdownMenuItem disabled>Tidak ada kategori</DropdownMenuItem>}
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-[180px] justify-start text-left">
                            <ArrowUpDown className="h-4 w-4 mr-2" /> {sortLabels[`${sort.key}-${sort.order}`] || 'Urutkan'}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {Object.entries(sortLabels).map(([key, label]) => {
                            const [sortKey, sortOrder] = key.split('-');
                            return <DropdownMenuItem key={key} onClick={() => setSort({ key: sortKey, order: sortOrder })}>{label}</DropdownMenuItem>;
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
                {isFilterActive && <Button variant="ghost" size="icon" onClick={handleResetFilters}><X className="h-4 w-4" /></Button>}
                <div className="flex items-center gap-1">
                    <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => onViewModeChange('grid')}><LayoutGrid className="h-4 w-4" /></Button>
                    <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" onClick={() => onViewModeChange('table')}><List className="h-4 w-4" /></Button>
                </div>
                <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Cari bahan..." className="pl-8 w-full md:w-[200px]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <Button onClick={onAddNew}><PlusCircle size={18} className="mr-2" /> Tambah</Button>
            </div>
        </header>
    );
};

export default FoodDatabaseHeader;
