// Lokasi file: src/features/Recipes/hooks/useRecipeAI.js
// Deskripsi: Custom hook untuk mengelola semua interaksi AI pada halaman detail resep.

import { useState } from 'react';
import { useNotifier } from '../../../hooks/useNotifier';
import * as api from '../../../api/electronAPI';

export const useRecipeAI = (onDataUpdate) => {
    const { notify } = useNotifier();
    const [aiLoading, setAiLoading] = useState({ title: false, description: false, instructions: false });
    const [nameSuggestions, setNameSuggestions] = useState([]);
    const [isSuggestionPopoverOpen, setIsSuggestionPopoverOpen] = useState(false);

    const handleAiAction = async (action, field, payload, instructionCallback) => {
        setAiLoading(prev => ({ ...prev, [field]: true }));
        try {
            const result = await action(payload);
            if (field === 'name') {
                setNameSuggestions(Array.isArray(result) ? result : []);
                setIsSuggestionPopoverOpen(true);
            } else {
                onDataUpdate(field, result);
                if (field === 'instructions' && typeof instructionCallback === 'function') {
                    instructionCallback(result);
                }
                notify.success(`AI berhasil memperbarui ${field}.`);
            }
        } catch (err) {
            notify.error(`Aksi AI gagal: ${err.message}`);
        } finally {
            setAiLoading(prev => ({ ...prev, [field]: false }));
        }
    };

    return {
        aiLoading,
        nameSuggestions,
        isSuggestionPopoverOpen,
        setIsSuggestionPopoverOpen,
        handleAiAction
    };
};
