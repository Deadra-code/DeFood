// Lokasi file: src/components/ui/UndoToast.jsx
// Deskripsi: Menghapus impor 'X' yang tidak terpakai untuk membersihkan peringatan.

import React from 'react';
import { toast } from 'react-hot-toast';
import { Button } from './button';
// PERBAIKAN: Menghapus impor 'X' yang tidak digunakan
// import { X } from 'lucide-react';

export default function UndoToast({ t, message, onUndo }) {
    return (
        <div
            className={`${
                t.visible ? 'animate-fade-in-up' : 'animate-out fade-out'
            } max-w-md w-full bg-card shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-border`}
        >
            <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-card-foreground">
                            {message}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex border-l border-border">
                <Button
                    variant="ghost"
                    onClick={() => {
                        onUndo();
                        toast.dismiss(t.id);
                    }}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    Undo
                </Button>
            </div>
        </div>
    );
}
