// Lokasi file: src/components/ui/EmptyState.jsx
// Deskripsi: (BARU) Komponen reusable untuk menampilkan state kosong yang informatif.

import React from 'react';

/**
 * Komponen untuk menampilkan pesan saat tidak ada data.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.icon - Ikon yang akan ditampilkan (komponen Lucide-React).
 * @param {string} props.title - Judul utama.
 * @param {string} props.description - Teks deskripsi.
 * @param {React.ReactNode} props.children - Tombol atau elemen call-to-action.
 */
const EmptyState = ({ icon, title, description, children }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full text-center p-8 bg-muted/40 rounded-lg">
            <div className="mb-4 text-primary">
                {icon}
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
            <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
            <div>
                {children}
            </div>
        </div>
    );
};

export default EmptyState;
