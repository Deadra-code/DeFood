// Lokasi file: src/components/ui/UnitCombobox.jsx
// Deskripsi: (FILE BARU) Komponen UnitCombobox yang diekstrak ke filenya sendiri
//            agar dapat digunakan kembali di seluruh aplikasi.

import React, { useState } from 'react';
import { Button } from './button';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from './command';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export const UnitCombobox = ({ value, onChange, options, placeholder = "Pilih satuan..." }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filteredOptions = options.filter(option => option.toLowerCase().includes(search.toLowerCase()));
    const showCreateOption = search && !filteredOptions.some(option => option.toLowerCase() === search.toLowerCase());

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                    {value || placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Cari/buat satuan..." value={search} onValueChange={setSearch} />
                    <CommandList>
                        <CommandEmpty>
                            {showCreateOption ? 'Tekan Enter untuk membuat.' : 'Satuan tidak ditemukan.'}
                        </CommandEmpty>
                        <CommandGroup>
                            {filteredOptions.map((option) => (
                                <CommandItem key={option} value={option} onSelect={(currentValue) => { onChange(currentValue === value ? "" : currentValue); setOpen(false); }}>
                                    <Check className={cn("mr-2 h-4 w-4", value === option ? "opacity-100" : "opacity-0")} />
                                    {option}
                                </CommandItem>
                            ))}
                            {showCreateOption && (
                                <CommandItem onSelect={() => { onChange(search); setOpen(false); }}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Buat "{search}"
                                </CommandItem>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
