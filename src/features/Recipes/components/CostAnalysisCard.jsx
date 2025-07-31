// Lokasi file: src/features/Recipes/components/CostAnalysisCard.jsx
// Deskripsi: Menambahkan logika untuk menangani dan memformat input numerik
//            agar tidak bisa diawali dengan angka nol yang tidak perlu (leading zeros).

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Slider } from '../../../components/ui/slider';
import { HelpCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { cn } from '../../../lib/utils';

// ... (fungsi formatCurrency dan convertToGrams tetap sama) ...
const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
};

function convertToGrams(food, quantity, unit) {
    if (!food || typeof quantity !== 'number' || !unit) return 0;
    const lowerCaseUnit = unit.toLowerCase();
    if (lowerCaseUnit === 'g' || lowerCaseUnit === 'gram' || lowerCaseUnit === 'gr') {
        return quantity;
    }
    try {
        const conversions = JSON.parse(food.unit_conversions || '{}');
        const conversionRate = conversions[unit];
        if (typeof conversionRate === 'number') return quantity * conversionRate;
    } catch (e) { console.error("Error parsing unit conversions:", e); }
    return 0;
}

const HppDetailsPopover = ({ ingredients = [], servings }) => {
    // ... (isi komponen HppDetailsPopover tetap sama) ...
    const safeServings = servings > 0 ? servings : 1;
    const totalHpp = React.useMemo(() => {
        if (!Array.isArray(ingredients)) return 0;
        return ingredients.reduce((acc, ing) => {
            const quantityInGrams = convertToGrams(ing.food, ing.quantity, ing.unit);
            const multiplier = quantityInGrams / 100;
            const cost = (ing.food.price_per_100g || 0) * multiplier;
            return acc + (cost / safeServings);
        }, 0);
    }, [ingredients, safeServings]);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
                    <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none">Rincian HPP per Porsi</h4>
                    <p className="text-sm text-muted-foreground">Biaya bahan baku dibagi dengan jumlah porsi.</p>
                </div>
                <ScrollArea className={cn("mt-4", ingredients.length > 5 ? "h-72" : "")}>
                    <Table className="relative">{/*
                     */}<TableHeader className="sticky top-0 bg-popover z-10">
                            <TableRow>
                                <TableHead>Bahan</TableHead>
                                <TableHead className="text-right">Biaya</TableHead>
                            </TableRow>
                        </TableHeader>{/*
                     */}<TableBody>
                            {Array.isArray(ingredients) && ingredients.map(ing => {
                                const quantityInGrams = convertToGrams(ing.food, ing.quantity, ing.unit);
                                const multiplier = quantityInGrams / 100;
                                const costPerIngredient = (ing.food.price_per_100g || 0) * multiplier;
                                const costPerPortion = costPerIngredient / safeServings;
                                return (
                                    <TableRow key={ing.id}>
                                        <TableCell className="truncate">{ing.food.name}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(costPerPortion)}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>{/*
                     */}<TableFooter className="sticky bottom-0 bg-popover z-10">
                            <TableRow className="bg-primary text-primary-foreground hover:bg-primary/90">
                                <TableCell className="font-bold">Total</TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(totalHpp)}</TableCell>
                            </TableRow>
                        </TableFooter>{/*
                 */}</Table>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};


export default function CostAnalysisCard({ 
    hppPerPortion, 
    ingredients, 
    servings,
    operationalCost,
    laborCost,
    margin,
    onCostChange,
}) {
    // --- PENINGKATAN UX: Fungsi untuk menangani input numerik ---
    const handleNumericInputChange = (field, value) => {
        // Mengonversi nilai ke angka, menghilangkan leading zeros, lalu kembali ke string
        // Jika input kosong atau hanya "0", biarkan seperti itu.
        const parsedValue = value === '' ? '' : parseInt(value, 10).toString();
        onCostChange(field, parsedValue);
    };

    const opCost = parseFloat(operationalCost) || 0;
    const labCost = parseFloat(laborCost) || 0;
    const currentMargin = margin === undefined ? 50 : parseFloat(margin);
    
    const totalModalCost = hppPerPortion + opCost + labCost;
    const profitPerPortion = totalModalCost * (currentMargin / 100);
    const sellingPrice = totalModalCost + profitPerPortion;
    const roundedSellingPrice = Math.ceil(sellingPrice / 500) * 500;

    return (
        <TooltipProvider>
            <Card>
                <CardHeader>
                    <CardTitle>Analisis Biaya & Harga Jual</CardTitle>
                    <CardDescription>Kalkulator untuk menentukan harga jual per porsi.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="flex items-center">HPP Bahan Baku / Porsi <HppDetailsPopover ingredients={ingredients} servings={servings} /></span> 
                            <span>{formatCurrency(hppPerPortion)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <Label htmlFor="opCost-input">Biaya Operasional / Porsi</Label>
                            <Input 
                                id="opCost-input" 
                                type="number" 
                                value={operationalCost} // Gunakan state asli untuk value
                                onChange={e => handleNumericInputChange('cost_operational_recipe', e.target.value)} 
                                className="w-28 h-8 text-right"
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <Label htmlFor="laborCost-input">Biaya Tenaga Kerja / Porsi</Label>
                            <Input 
                                id="laborCost-input" 
                                type="number" 
                                value={laborCost} // Gunakan state asli untuk value
                                onChange={e => handleNumericInputChange('cost_labor_recipe', e.target.value)} 
                                className="w-28 h-8 text-right"
                            />
                        </div>
                        <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Total Biaya Modal / Porsi</span> <span>{formatCurrency(totalModalCost)}</span></div>
                    </div>
                    <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="margin-input" className="flex items-center">
                                Margin Keuntungan (%)
                                <Tooltip><TooltipTrigger asChild><HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Sesuaikan margin untuk resep ini.</p></TooltipContent></Tooltip>
                            </Label>
                            <Input 
                                id="margin-input" 
                                type="number" 
                                value={currentMargin} 
                                onChange={e => handleNumericInputChange('margin_percent', e.target.value)} 
                                className="w-20 h-8 text-right" 
                            />
                        </div>
                        <Slider 
                            value={[currentMargin]} 
                            onValueChange={(value) => onCostChange('margin_percent', value[0])} 
                            max={200} 
                            step={1} 
                        />
                    </div>
                    <div className="space-y-2 text-sm">
                         <div className="flex justify-between"><span>Profit / Porsi</span> <span>{formatCurrency(profitPerPortion)}</span></div>
                         <div className="flex justify-between items-center font-bold text-lg text-primary">
                            <span>Rekomendasi Harga Jual</span> 
                            <span>{formatCurrency(roundedSellingPrice)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}
