// Lokasi file: src/features/FoodDatabase/components/FoodCard.jsx
// Deskripsi: Komponen untuk menampilkan satu item makanan dalam format kartu.

import React from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { Badge } from '../../../components/ui/badge';
import { Edit, Trash2, Flame, Tag, MoreHorizontal } from 'lucide-react';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
};

const MacroSummary = ({ protein, carbs, fat }) => (
    <div className="flex justify-between text-xs text-muted-foreground mt-2 border-t pt-2">
        <div className="flex flex-col items-center"><span className="font-bold">{protein?.toFixed(1) || 0}g</span><span>Protein</span></div>
        <div className="flex flex-col items-center"><span className="font-bold">{carbs?.toFixed(1) || 0}g</span><span>Karbo</span></div>
        <div className="flex flex-col items-center"><span className="font-bold">{fat?.toFixed(1) || 0}g</span><span>Lemak</span></div>
    </div>
);


const FoodCard = ({ food, onEdit, onDelete, style }) => {
    return (
        <Card style={style} className="flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg animate-fade-in-up">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="pr-2">{food.name}</CardTitle>
                    {food.category && <Badge variant="secondary">{food.category}</Badge>}
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-3 text-sm">
                <div className="flex items-center text-muted-foreground">
                    <Flame className="h-4 w-4 mr-2 text-red-500" />
                    <span>{food.calories_kcal} kkal per 100g</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                    <Tag className="h-4 w-4 mr-2 text-green-500" />
                    <span>{formatCurrency(food.price_per_100g)} per 100g</span>
                </div>
                <MacroSummary protein={food.protein_g} carbs={food.carbs_g} fat={food.fat_g} />
            </CardContent>
            <CardFooter className="p-4 pt-2">
                <Button variant="outline" size="sm" className="w-full" onClick={onEdit}>
                    <Edit size={14} className="mr-2" /> Kelola
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-2">
                            <MoreHorizontal size={16} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                            <Trash2 size={14} className="mr-2" /> Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
    );
};

export default FoodCard;
