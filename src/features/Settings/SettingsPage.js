// Lokasi file: src/features/Settings/SettingsPage.js
// Deskripsi: Mengembalikan UI AI dan memperbarui fungsi tes koneksi.

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { useSettingsContext } from '../../context/SettingsContext';
import { useNotifier } from '../../hooks/useNotifier';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import * as api from '../../api/electronAPI';

export default function SettingsPage() {
    const { settings, saveSettings, loading } = useSettingsContext();
    const { notify } = useNotifier();
    const [formState, setFormState] = useState(settings);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState(null);

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

    const handleTestApiKey = async () => {
        setIsTesting(true);
        setTestStatus(null);
        try {
            await saveSettings(formState); // Simpan dulu kunci terbaru
            await api.testAIConnection();
            setTestStatus('success');
            notify.success("Koneksi API berhasil!");
        } catch (error) {
            setTestStatus('error');
            notify.error(`Tes koneksi gagal: ${error.message}`);
        } finally {
            setIsTesting(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="p-6 lg:p-8 h-full flex flex-col items-center overflow-y-auto">
            <div className="w-full max-w-2xl space-y-8">
                <header>
                    <h1 className="text-3xl font-bold">Pengaturan</h1>
                    <p className="text-muted-foreground">Kelola preferensi dan parameter bisnis Anda di sini.</p>
                </header>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Kalkulasi Biaya & Harga Jual</CardTitle>
                        <CardDescription>
                            Parameter ini akan digunakan sebagai dasar untuk menghitung harga jual.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="margin">Margin Keuntungan Default (%)</Label>
                            <Input id="margin" type="number" value={formState.margin} onChange={(e) => handleChange('margin', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="operationalCost">Biaya Operasional per Porsi (Rp)</Label>
                            <Input id="operationalCost" type="number" value={formState.operationalCost} onChange={(e) => handleChange('operationalCost', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="laborCost">Biaya Tenaga Kerja per Porsi (Rp)</Label>
                            <Input id="laborCost" type="number" value={formState.laborCost} onChange={(e) => handleChange('laborCost', e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Integrasi AI</CardTitle>
                        <CardDescription>
                            Masukkan kunci API Google AI Anda untuk fitur pengisian data nutrisi otomatis.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="googleApiKey">Google AI API Key</Label>
                            <Input id="googleApiKey" type="password" value={formState.googleApiKey || ''} onChange={(e) => handleChange('googleApiKey', e.target.value)} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end items-center gap-4">
                         {testStatus === 'success' && <CheckCircle className="text-green-500" />}
                         {testStatus === 'error' && <XCircle className="text-destructive" />}
                         <Button onClick={handleTestApiKey} variant="outline" disabled={isTesting}>
                            {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Uji Koneksi
                        </Button>
                         <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Pengaturan
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
