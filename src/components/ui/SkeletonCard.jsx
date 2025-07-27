// Lokasi file: src/components/ui/SkeletonCard.jsx
// Deskripsi: Komponen baru untuk menampilkan placeholder saat data sedang dimuat.

import React from 'react';
import { cn } from '../../lib/utils';

const SkeletonCard = ({ className }) => {
    return (
        <div className={cn("p-4 rounded-lg border bg-card shadow-sm animate-pulse", className)}>
            <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-muted rounded-full"></div>
                <div className="space-y-2 flex-grow">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
            </div>
        </div>
    );
};

export const SkeletonList = ({ count = 3, className }) => (
    <div className={cn("space-y-3", className)}>
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} />
        ))}
    </div>
);

export default SkeletonCard;
