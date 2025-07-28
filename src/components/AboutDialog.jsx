// Lokasi file: src/components/AboutDialog.jsx
// Deskripsi: Komponen dialog baru untuk menampilkan informasi "Tentang Aplikasi".

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { BookOpen } from 'lucide-react'; // PERBAIKAN: Menghapus impor 'Button' dan 'Info' yang tidak digunakan
import * as api from '../api/electronAPI';

export default function AboutDialog({ isOpen, onOpenChange }) {
    const [appVersion, setAppVersion] = useState('...');

    useEffect(() => {
        if (isOpen) {
            api.getAppVersion().then(version => {
                setAppVersion(version);
            });
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="flex flex-col items-center text-center">
                    <div className="p-3 bg-primary/10 rounded-full mb-3">
                        <BookOpen className="h-10 w-10 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl">DeFood</DialogTitle>
                    <DialogDescription>Versi {appVersion}</DialogDescription>
                </DialogHeader>
                <div className="py-4 text-center text-sm text-muted-foreground">
                    <p>Aplikasi kalkulator resep dengan asisten AI.</p>
                    <p className="mt-4">Dibuat dengan ❤️ oleh Tim DeFood.</p>
                </div>
                <DialogFooter className="justify-center">
                    <p className="text-xs text-muted-foreground">
                        Hak Cipta © {new Date().getFullYear()} DeFood. Semua Hak Dilindungi.
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
