// Lokasi file: src/features/Recipes/components/RecipeDetail/RecipeHeader.jsx
// Deskripsi: Menambahkan tombol baru "Kalkulator Skala" di header.

import React, { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../../../components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui/popover';
import { Save, MoreVertical, Loader2, Download, Copy, Trash2, Pencil, Calculator } from 'lucide-react'; // BARU: Impor Calculator
import { AiButton } from './AiButton';

export const RecipeHeader = ({
    details,
    isDifferent,
    isSaving,
    aiLoading,
    nameSuggestions,
    isSuggestionPopoverOpen,
    setIsSuggestionPopoverOpen,
    handleDetailChange,
    handleSaveDetails,
    handleSuggestNames,
    handleExportPDF,
    handleDuplicateRecipe,
    setIsDeleteDialogOpen,
    onOpenScaler // BARU: Prop untuk membuka dialog kalkulator
}) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    return (
        <header className="flex justify-between items-start gap-4">
            <div className="flex-1 flex items-center gap-2 group">
                {isEditingTitle ? (
                    <Input
                        value={details.name}
                        onChange={e => handleDetailChange('name', e.target.value)}
                        className="text-4xl font-bold h-auto p-0 border-none shadow-none focus-visible:ring-0 tracking-tight"
                        autoFocus
                        onBlur={() => setIsEditingTitle(false)}
                        onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingTitle(false); }}
                    />
                ) : (
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsEditingTitle(true)}>
                        <h1 className="text-4xl font-bold tracking-tight group-hover:bg-muted rounded-md px-1 -mx-1">
                            {details.name} {isDifferent && <span className="text-destructive">*</span>}
                        </h1>
                        <Pencil className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                )}
                <Popover open={isSuggestionPopoverOpen} onOpenChange={setIsSuggestionPopoverOpen}>
                    <PopoverTrigger asChild>
                        <div>
                           <AiButton onClick={handleSuggestNames} isLoading={aiLoading.title} tooltipContent="Sarankan nama resep" />
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Saran Nama Resep</h4>
                            <p className="text-sm text-muted-foreground">
                                Klik nama untuk menerapkannya.
                            </p>
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                            {nameSuggestions.length > 0 ? (
                                nameSuggestions.map((name, index) => (
                                    <Button
                                        key={index}
                                        variant="ghost"
                                        className="justify-start"
                                        onClick={() => {
                                            handleDetailChange('name', name);
                                            setIsSuggestionPopoverOpen(false);
                                        }}
                                    >
                                        {name}
                                    </Button>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center">Tidak ada saran ditemukan.</p>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex items-center gap-2">
                {/* --- BARU: Tombol Kalkulator Skala --- */}
                <Button variant="outline" onClick={onOpenScaler}><Calculator className="mr-2 h-4 w-4" /> Skala</Button>
                <Button variant="outline" onClick={handleExportPDF}><Download className="mr-2 h-4 w-4" /> Ekspor</Button>
                <Button onClick={handleSaveDetails} disabled={!isDifferent || isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isDifferent ? 'Simpan' : 'Tersimpan'}
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={handleDuplicateRecipe}><Copy className="mr-2 h-4 w-4" /> Duplikat</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setIsDeleteDialogOpen(true)}><Trash2 className="mr-2 h-4 w-4" /> Hapus Resep</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};
