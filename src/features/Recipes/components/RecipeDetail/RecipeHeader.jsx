// Lokasi file: src/features/Recipes/components/RecipeDetail/RecipeHeader.jsx
// Deskripsi: Komponen untuk header halaman detail resep.

import React, { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../../../components/ui/dropdown-menu';
import { Save, MoreVertical, Loader2, Download, Copy, Trash2 } from 'lucide-react';
import { AiButton } from './AiButton'; // Kita akan buat AiButton sebagai komponen terpisah

export const RecipeHeader = ({
    details,
    isDifferent,
    isSaving,
    aiLoading,
    handleDetailChange,
    handleSaveDetails,
    handleSuggestNames,
    handleExportPDF,
    handleDuplicateRecipe,
    setIsDeleteDialogOpen
}) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    return (
        <header className="flex justify-between items-start gap-4">
            <div className="flex-1 flex items-center gap-2">
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
                    <h1 className="text-4xl font-bold tracking-tight cursor-pointer hover:bg-muted rounded-md px-1 -mx-1" onClick={() => setIsEditingTitle(true)}>
                        {details.name} {isDifferent && <span className="text-destructive">*</span>}
                    </h1>
                )}
                <AiButton onClick={handleSuggestNames} isLoading={aiLoading.title} tooltipContent="Sarankan nama resep" />
            </div>
            <div className="flex items-center gap-2">
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
