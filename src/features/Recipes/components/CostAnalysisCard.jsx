// Lokasi file: src/features/Recipes/components/CostAnalysisCard.jsx
// Deskripsi: Panel interaktif untuk analisis biaya dan kalkulasi harga jual.

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Slider } from '../../../components/ui/slider'; // Perlu diimpor/dibuat
import { useSettingsContext } from '../../../context/SettingsContext';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
};

// Komponen Slider perlu dibuat jika belum ada.
// Untuk sementara, kita akan gunakan Input saja. Jika Anda punya komponen Slider,
// ganti <Input type="range"> dengan <Slider>.
const SliderComponent = ({ value, onValueChange }) => (
    <Input type="range" min="0" max="200" value={value} onChange={e => onValueChange([Number(e.target.value)])} />
);


export default function CostAnalysisCard({ hppPerPortion }) {
    const { settings, loading } = useSettingsContext();
    const [margin, setMargin] = useState(parseFloat(settings.margin) || 70);

    useEffect(() => {
        if (!loading) {
            setMargin(parseFloat(settings.margin) || 70);
        }
    }, [settings, loading]);

    const opCost = parseFloat(settings.operationalCost) || 0;
    const laborCost = parseFloat(settings.laborCost) || 0;

    const totalModalCost = hppPerPortion + opCost + laborCost;
    const profitPerPortion = totalModalCost * (margin / 100);
    const sellingPrice = totalModalCost + profitPerPortion;

    // Pembulatan harga jual ke atas ke 500 terdekat
    const roundedSellingPrice = Math.ceil(sellingPrice / 500) * 500;

    if (loading) {
        return <Card><CardHeader><CardTitle>Memuat Analisis Biaya...</CardTitle></CardHeader></Card>;
    }

    return (
        <TooltipProvider>
            <Card>
                <CardHeader>
                    <CardTitle>Analisis Biaya & Harga Jual</CardTitle>
                    <CardDescription>Kalkulator untuk menentukan harga jual produk Anda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Rincian Biaya */}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>HPP Bahan Baku</span> <span>{formatCurrency(hppPerPortion)}</span></div>
                        <div className="flex justify-between"><span>Biaya Operasional</span> <span>{formatCurrency(opCost)}</span></div>
                        <div className="flex justify-between"><span>Biaya Tenaga Kerja</span> <span>{formatCurrency(laborCost)}</span></div>
                        <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Total Biaya Modal / Porsi</span> <span>{formatCurrency(totalModalCost)}</span></div>
                    </div>

                    {/* Kalkulator Interaktif */}
                    <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="margin-input" className="flex items-center">
                                Margin Keuntungan
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 ml-1.5 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Sesuaikan margin untuk resep ini. Nilai awal diambil dari pengaturan default.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </Label>
                            <Input
                                id="margin-input"
                                type="number"
                                value={margin}
                                onChange={e => setMargin(Number(e.target.value))}
                                className="w-20 h-8 text-right"
                            />
                        </div>
                        <SliderComponent value={[margin]} onValueChange={(value) => setMargin(value[0])} />
                    </div>

                    {/* Hasil Akhir */}
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
