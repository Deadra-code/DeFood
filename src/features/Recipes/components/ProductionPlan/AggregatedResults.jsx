// Lokasi file: src/features/Recipes/components/ProductionPlan/AggregatedResults.jsx
// Deskripsi: (DIPERBARUI) Panel C sekarang menampilkan analisis biaya yang lengkap,
//            termasuk rata-rata margin, profit, dan rekomendasi harga jual total.

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip';


const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(value || 0);

export default function AggregatedResults({ aggregatedData }) {
    const { shoppingList, totalCost, totalNutrition } = aggregatedData;

    return (
        <Card className="flex flex-col min-h-0">
            <CardHeader>
                <CardTitle>3. Hasil Kalkulasi Gabungan</CardTitle>
                <CardDescription>Total kebutuhan bahan, biaya, dan nutrisi untuk rencana produksi Anda.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
                <Tabs defaultValue="shopping-list" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="shopping-list">Daftar Belanja</TabsTrigger>
                        <TabsTrigger value="cost-analysis">Analisis Biaya</TabsTrigger>
                        <TabsTrigger value="nutrition-summary">Ringkasan Nutrisi</TabsTrigger>
                    </TabsList>
                    <div className="flex-grow mt-4 overflow-hidden">
                        <TabsContent value="shopping-list" className="h-full m-0">
                            <ScrollArea className="h-full border rounded-md">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-card">
                                        <TableRow>
                                            <TableHead>Bahan</TableHead>
                                            <TableHead className="text-right">Jumlah</TableHead>
                                            <TableHead>Satuan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {shoppingList.length > 0 ? (
                                            shoppingList.map(item => (
                                                <TableRow key={`${item.food.id}-${item.unit}`}>
                                                    <TableCell>{item.food.name}</TableCell>
                                                    <TableCell className="text-right font-medium">{item.quantity.toFixed(2)}</TableCell>
                                                    <TableCell>{item.unit}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="h-24 text-center">Tidak ada data untuk ditampilkan.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="cost-analysis" className="h-full m-0">
                             <TooltipProvider>
                                <div className="p-4 space-y-2 text-sm border rounded-md">
                                    <div className="flex justify-between"><span>Total HPP Bahan Baku</span> <span className="font-medium">{formatCurrency(totalCost.hpp)}</span></div>
                                    <div className="flex justify-between"><span>Total Biaya Operasional</span> <span className="font-medium">{formatCurrency(totalCost.operational)}</span></div>
                                    <div className="flex justify-between"><span>Total Biaya Tenaga Kerja</span> <span className="font-medium">{formatCurrency(totalCost.labor)}</span></div>
                                    <div className="flex justify-between font-bold border-t pt-2 mt-2 text-base"><span>TOTAL BIAYA MODAL</span> <span>{formatCurrency(totalCost.totalModal)}</span></div>
                                    
                                    {/* --- BARU: Menampilkan Rata-rata Margin, Profit, dan Harga Jual --- */}
                                    <div className="flex justify-between items-center pt-4 border-t mt-4">
                                        <span className="flex items-center">
                                            Rata-rata Margin
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Ini adalah rata-rata dari persentase margin<br/>semua resep yang Anda pilih.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </span>
                                        <span className="font-medium">{totalCost.averageMargin.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between"><span>Profit</span> <span className="font-medium">{formatCurrency(totalCost.profit)}</span></div>
                                    <div className="flex justify-between items-center font-bold text-lg text-primary pt-2 mt-2">
                                        <span>Rekomendasi Harga Jual Total</span>
                                        <span>{formatCurrency(totalCost.sellingPrice)}</span>
                                    </div>
                                </div>
                             </TooltipProvider>
                        </TabsContent>
                        <TabsContent value="nutrition-summary" className="h-full m-0">
                            <div className="p-4 space-y-2 text-sm border rounded-md">
                                <div className="flex justify-between"><span>Total Kalori</span> <span className="font-medium">{formatNumber(totalNutrition.calories)} kkal</span></div>
                                <div className="flex justify-between"><span>Total Protein</span> <span className="font-medium">{formatNumber(totalNutrition.protein)} g</span></div>
                                <div className="flex justify-between"><span>Total Karbohidrat</span> <span className="font-medium">{formatNumber(totalNutrition.carbs)} g</span></div>
                                <div className="flex justify-between"><span>Total Lemak</span> <span className="font-medium">{formatNumber(totalNutrition.fat)} g</span></div>
                                <div className="flex justify-between"><span>Total Serat</span> <span className="font-medium">{formatNumber(totalNutrition.fiber)} g</span></div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    );
}
