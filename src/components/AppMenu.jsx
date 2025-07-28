// Lokasi file: src/components/AppMenu.jsx
// Deskripsi: Komponen menu dropdown terintegrasi untuk aksi level aplikasi.

import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
// PERBAIKAN: Menghapus impor 'ExternalLink' yang tidak digunakan
import { MoreVertical, Info, LogOut, RefreshCw, FileText } from 'lucide-react'; 
import * as api from '../api/electronAPI';
import AboutDialog from './AboutDialog';

export default function AppMenu() {
    const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
    const [updateStatus, setUpdateStatus] = useState('Memeriksa pembaruan...');

    useEffect(() => {
        const removeListener = api.onUpdateStatus((status) => {
            setUpdateStatus(status);
        });
        // Cleanup listener
        return () => {
            if (typeof removeListener === 'function') {
                removeListener();
            }
        };
    }, []);

    const handleCheckForUpdates = () => {
        setUpdateStatus('Memeriksa...');
        api.checkForUpdates();
    };

    return (
        <>
            <AboutDialog isOpen={isAboutDialogOpen} onOpenChange={setIsAboutDialogOpen} />
            <div style={{ WebkitAppRegion: 'no-drag' }}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Status: {updateStatus}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={handleCheckForUpdates}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            <span>Periksa Pembaruan</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={api.openLogs}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Buka Log Aplikasi</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setIsAboutDialogOpen(true)}>
                            <Info className="mr-2 h-4 w-4" />
                            <span>Tentang DeFood</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={api.quit} className="text-destructive focus:text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Keluar</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    );
}
