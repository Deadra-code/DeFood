// Lokasi file: src/features/Settings/SettingsDialog.jsx
// Deskripsi: (DIPERBARUI) Input untuk "Margin Keuntungan Default" telah
//            dihapus karena sekarang dikelola per resep.

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { useSettingsContext } from '../../context/SettingsContext';
import { useNotifier } from '../../hooks/useNotifier';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import * as api from '../../api/electronAPI';

export default function SettingsDialog({ isOpen, onOpenChange }) {
    const { settings, saveSettings, loading } = useSettingsContext();
    const { notify } = useNotifier();
    const [formState, setFormState] = useState(settings);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setFormState(settings);
            setTestStatus(null);
        }
    }, [settings, isOpen]);

    const handleChange = (key, value) => {
        setFormState(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        const { margin, ...settingsToSave } = formState;
        setIsSaving(true);
        try {
            await saveSettings(settingsToSave);
            notify.success("Pengaturan berhasil disimpan.");
            onOpenChange(false);
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
            await api.saveSettings(formState);
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

    if (loading) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Pengaturan Aplikasi</DialogTitle>
                    <DialogDescription>
                        Kelola integrasi untuk aplikasi DeFood.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold">Integrasi AI</h3>
                        <div className="space-y-2">
                            <Label htmlFor="googleApiKey">Google AI API Key</Label>
                            <Input id="googleApiKey" type="password" value={formState.googleApiKey || ''} onChange={(e) => handleChange('googleApiKey', e.target.value)} />
                        </div>
                        <div className="flex justify-end items-center gap-2">
                            {testStatus === 'success' && <CheckCircle className="text-green-500" />}
                            {testStatus === 'error' && <XCircle className="text-destructive" />}
                            <Button onClick={handleTestApiKey} variant="outline" size="sm" disabled={isTesting}>
                                {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Uji Koneksi
                            </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Pengaturan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
