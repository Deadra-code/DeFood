// Lokasi file: src/components/TitleBar.jsx
// Deskripsi: Komponen React untuk kontrol jendela kustom (minimize, maximize, close).

import React from 'react';
import { Button } from './ui/button';
import { Minus, Square, X } from 'lucide-react';
import * as api from '../api/electronAPI';

export default function TitleBar() {
    return (
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={api.minimize}>
                <Minus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={api.maximize}>
                <Square className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/90 hover:text-destructive-foreground" onClick={api.close}>
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}
