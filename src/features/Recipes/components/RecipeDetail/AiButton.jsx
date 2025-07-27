// Lokasi file: src/features/Recipes/components/RecipeDetail/AiButton.jsx
// Deskripsi: Tidak ada perubahan. Komponen ini sudah benar dengan mengharapkan TooltipProvider dari induk.

import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../components/ui/tooltip';
import { Loader2, Sparkles } from 'lucide-react';

export const AiButton = ({ onClick, isLoading, tooltipContent }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" onClick={onClick} disabled={isLoading} className="h-7 w-7">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
            </Button>
        </TooltipTrigger>
        <TooltipContent><p>{tooltipContent}</p></TooltipContent>
    </Tooltip>
);
