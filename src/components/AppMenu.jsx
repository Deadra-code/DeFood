// Lokasi file: src/components/AppMenu.jsx
// Deskripsi: Komponen menu dropdown yang telah disempurnakan dengan pengelompokan logis,
//            umpan balik status visual, dan dialog konfirmasi keluar.

import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuShortcut,
} from './ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { MoreVertical, Info, LogOut, RefreshCw, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'; 
import * as api from '../api/electronAPI';
import AboutDialog from './AboutDialog';

// Komponen helper untuk menampilkan ikon status pembaruan
const UpdateStatusIcon = ({ status }) => {
    if (status.startsWith('Memeriksa') || status.startsWith('Mengunduh')) {
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    if (status === 'Versi terbaru') {
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (status.includes('tersedia') || status.includes('siap')) {
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    return <RefreshCw className="mr-2 h-4 w-4" />;
};


export default function AppMenu() {
    const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
    const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false); // State untuk dialog keluar
    const [updateStatus, setUpdateStatus] = useState('Siap memeriksa');
    const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);

    useEffect(() => {
        const removeListener = api.onUpdateStatus((status) => {
            setUpdateStatus(status);
            setIsCheckingForUpdates(false); // Hentikan animasi loading saat status diterima
        });
        
        // Cleanup listener
        return () => {
            if (typeof removeListener === 'function') {
                removeListener();
            }
        };
    }, []);

    const handleCheckForUpdates = () => {
        setUpdateStatus('Memeriksa pembaruan...');
        setIsCheckingForUpdates(true);
        api.checkForUpdates();
    };

    return (
        <>
            <AboutDialog isOpen={isAboutDialogOpen} onOpenChange={setIsAboutDialogOpen} />
            <AlertDialog open={isExitConfirmOpen} onOpenChange={setIsExitConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Anda yakin ingin keluar?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Pastikan semua pekerjaan Anda telah disimpan sebelum keluar dari aplikasi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={api.quit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Keluar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div style={{ WebkitAppRegion: 'no-drag' }}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                        {/* Grup 1: Pembaruan & Diagnostik */}
                        <DropdownMenuLabel>Pembaruan & Diagnostik</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={handleCheckForUpdates} disabled={isCheckingForUpdates}>
                            {isCheckingForUpdates ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            <span>Periksa Pembaruan</span>
                        </DropdownMenuItem>
                        <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center">
                            <UpdateStatusIcon status={updateStatus} />
                            <span className="ml-2">Status: {updateStatus}</span>
                        </div>
                        <DropdownMenuItem onSelect={api.openLogs}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Buka Log Aplikasi</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {/* Grup 2: Bantuan & Informasi */}
                        <DropdownMenuItem onSelect={() => setIsAboutDialogOpen(true)}>
                            <Info className="mr-2 h-4 w-4" />
                            <span>Tentang DeFood</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {/* Grup 3: Aksi Aplikasi */}
                        <DropdownMenuItem onSelect={() => setIsExitConfirmOpen(true)} className="text-destructive focus:text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Keluar</span>
                            <DropdownMenuShortcut>Alt+F4</DropdownMenuShortcut>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    );
}
