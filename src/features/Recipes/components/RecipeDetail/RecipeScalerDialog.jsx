// Lokasi file: src/features/Recipes/components/RecipeDetail/RecipeScalerDialog.jsx
// Deskripsi: Komponen dialog baru untuk menghitung skala resep berdasarkan jumlah porsi.

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { calculateRecipeTotals } from '../../../../utils/nutritionCalculator';

// Helper untuk format angka dan mata uang
const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(value || 0);

export const RecipeScalerDialog = ({ isOpen, onOpenChange, recipe }) => {
    const originalServings = useMemo(() => recipe?.servings > 0 ? recipe.servings : 1, [recipe]);
    const [targetServings, setTargetServings] = useState(originalServings);

    // Kalkulasi skala resep menggunakan useMemo untuk efisiensi
    const scaledData = useMemo(() => {
        if (!recipe || !Array.isArray(recipe.ingredients)) {
            return { scaledIngredients: [], scaledTotals: {}, hpp: 0, operationalCost: 0, laborCost: 0 };
        }

        const safeTargetServings = targetServings > 0 ? targetServings : 1;
        const scalingFactor = safeTargetServings / originalServings;

        const scaledIngredients = recipe.ingredients.map(ing => ({
            ...ing,
            originalQuantity: ing.quantity,
            scaledQuantity: ing.quantity * scalingFactor,
        }));

        const tempRecipeForCalc = { ...recipe, ingredients: scaledIngredients.map(ing => ({...ing, quantity: ing.scaledQuantity})) };
        const scaledTotals = calculateRecipeTotals(tempRecipeForCalc.ingredients);

        const operationalCost = (recipe.cost_operational_recipe || 0) * scalingFactor;
        const laborCost = (recipe.cost_labor_recipe || 0) * scalingFactor;
        
        return { scaledIngredients, scaledTotals, operationalCost, laborCost };

    }, [recipe, targetServings, originalServings]);

    const { scaledIngredients, scaledTotals, operationalCost, laborCost } = scaledData;

    const totalModalCost = scaledTotals.price + operationalCost + laborCost;
    const margin = recipe.margin_percent === undefined ? 50 : parseFloat(recipe.margin_percent);
    const profit = totalModalCost * (margin / 100);
    const sellingPrice = totalModalCost + profit;
    const roundedSellingPrice = Math.ceil(sellingPrice / 500) * 500;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Kalkulator Skala Resep: {recipe.name}</DialogTitle>
                    <DialogDescription>
                        Hitung kebutuhan bahan, biaya, dan nutrisi untuk jumlah porsi yang berbeda.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Kolom Kiri: Input & Ringkasan */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="target-servings" className="text-base font-semibold">Target Jumlah Porsi</Label>
                            <Input
                                id="target-servings"
                                type="number"
                                min="1"
                                value={targetServings}
                                onChange={(e) => setTargetServings(Number(e.target.value))}
                                className="w-32 text-lg h-12"
                            />
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Ringkasan untuk {formatNumber(targetServings)} Porsi</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Total HPP Bahan Baku</span> <span className="font-medium">{formatCurrency(scaledTotals.price)}</span></div>
                                <div className="flex justify-between"><span>Total Biaya Operasional</span> <span className="font-medium">{formatCurrency(operationalCost)}</span></div>
                                <div className="flex justify-between"><span>Total Biaya Tenaga Kerja</span> <span className="font-medium">{formatCurrency(laborCost)}</span></div>
                                <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Total Biaya Modal</span> <span>{formatCurrency(totalModalCost)}</span></div>
                                <div className="flex justify-between font-bold text-primary text-base pt-2 mt-2"><span>Rekomendasi Harga Jual Total</span> <span>{formatCurrency(roundedSellingPrice)}</span></div>
                                <div className="flex justify-between text-muted-foreground text-xs"><span>Total Kalori</span> <span>{formatNumber(scaledTotals.calories)} kkal</span></div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Kolom Kanan: Rincian Bahan */}
                    <div className="space-y-4">
                         <h3 className="text-lg font-semibold">Rincian Kebutuhan Bahan</h3>
                         <ScrollArea className="h-80 border rounded-md">
                            <Table>
                                <TableHeader className="sticky top-0 bg-card">
                                    <TableRow>
                                        <TableHead>Nama Bahan</TableHead>
                                        <TableHead className="text-right">Jumlah Asli</TableHead>
                                        <TableHead className="text-right font-bold">Jumlah Baru</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {scaledIngredients.map(ing => (
                                        <TableRow key={ing.id}>
                                            <TableCell>{ing.food.name}</TableCell>
                                            <TableCell className="text-right text-muted-foreground">{formatNumber(ing.originalQuantity)} {ing.unit}</TableCell>
                                            <TableCell className="text-right font-bold">{ing.scaledQuantity.toFixed(2)} {ing.unit}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </ScrollArea>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Tutup</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
