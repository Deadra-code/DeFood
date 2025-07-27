// Lokasi file: src/hooks/useNotifier.js
// Deskripsi: Custom hook untuk menampilkan notifikasi toast.

import { toast } from 'react-hot-toast';
import { useMemo } from 'react';

export const useNotifier = () => {
    const notify = useMemo(() => ({
        success: (message) => {
            toast.success(message);
        },
        error: (message) => {
            toast.error(message);
        },
        info: (message, options) => {
            toast(message, {
                ...options,
                icon: '🔔',
            });
        }
    }), []);

    return { notify };
};
