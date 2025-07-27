// Lokasi file: src/features/Settings/SettingsPage.js
// Deskripsi: Halaman UI untuk mengelola pengaturan bisnis.

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useSettingsContext } from '../../context/SettingsContext';
import { useNotifier } from '../../hooks/useNotifier';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
    const { settings, saveSettings, loading } = useSettingsContext();
    const { notify } = useNotifier();
    const [formState, setFormState] = useState(settings);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormState(settings);
    }, [settings]);

    const handleChange = (key, value) => {
        setFormState(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveSettings(formState);
            notify.success("Pengaturan berhasil disimpan.");
        } catch (err) {
            notify.error("Gagal menyimpan pengaturan.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="p-6 lg:p-8 h-full flex flex-col items-center">
            <div className="w-full max-w-2xl">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold">Pengaturan</h1>
                    <p className="text-muted-foreground">Kelola preferensi dan parameter bisnis Anda di sini.</p>
                </header>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Kalkulasi Biaya & Harga Jual</CardTitle>
                        <CardDescription>
                            Parameter ini akan digunakan sebagai dasar untuk menghitung harga jual yang direkomendasikan untuk setiap resep.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="margin">Margin Keuntungan Default (%)</Label>
                            <Input
                                id="margin"
                                type="number"
                                value={formState.margin}
                                onChange={(e) => handleChange('margin', e.target.value)}
                                placeholder="Contoh: 70"
                            />
                            <p className="text-sm text-muted-foreground">
                                Persentase keuntungan yang Anda inginkan dari total biaya modal.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="operationalCost">Biaya Operasional per Porsi (Rp)</Label>
                            <Input
                                id="operationalCost"
                                type="number"
                                value={formState.operationalCost}
                                onChange={(e) => handleChange('operationalCost', e.target.value)}
                                placeholder="Contoh: 2500"
                            />
                             <p className="text-sm text-muted-foreground">
                                Total biaya untuk kemasan, gas, listrik, stiker, dll. untuk satu porsi.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="laborCost">Biaya Tenaga Kerja per Porsi (Rp)</Label>
                            <Input
                                id="laborCost"
                                type="number"
                                value={formState.laborCost}
                                onChange={(e) => handleChange('laborCost', e.target.value)}
                                placeholder="Contoh: 1500"
                            />
                             <p className="text-sm text-muted-foreground">
                                Biaya opsional untuk tenaga kerja yang dialokasikan ke setiap porsi.
                            </p>
                        </div>
                        <div className="flex justify-end">
                             <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan Pengaturan
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
