// Lokasi file: src/components/ui/UndoToast.jsx
// Deskripsi: (BARU) Komponen notifikasi kustom untuk fitur "Undo".

import React from 'react';
import { toast } from 'react-hot-toast';
import { Undo2, X } from 'lucide-react';
import { Button } from './button';

/**
 * Komponen Toast untuk menampilkan pesan dengan opsi Undo.
 * @param {object} props
 * @param {object} props.t - Objek toast dari react-hot-toast.
 * @param {string} props.message - Pesan yang akan ditampilkan.
 * @param {function} props.onUndo - Callback yang dijalankan saat tombol Undo diklik.
 */
const UndoToast = ({ t, message, onUndo }) => {
    const handleUndo = () => {
        onUndo();
        toast.dismiss(t.id);
    };

    return (
        <div
            className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-card shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-border`}
        >
            <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-foreground">
                            {message}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex border-l border-border">
                <Button
                    onClick={handleUndo}
                    variant="ghost"
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <Undo2 className="h-5 w-5 mr-2" />
                    Urungkan
                </Button>
            </div>
        </div>
    );
};

export default UndoToast;
