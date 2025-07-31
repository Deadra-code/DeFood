// Lokasi file: src/features/FoodDatabase/components/FoodGrid.jsx
// Deskripsi: Komponen untuk merender tampilan grid dari kartu makanan.

import React from 'react';
import FoodCard from './FoodCard';

const FoodGrid = ({ foods, onEdit, onDelete }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {foods.map((food, index) => (
                <FoodCard
                    key={food.id}
                    food={food}
                    onEdit={() => onEdit(food)}
                    onDelete={() => onDelete(food)}
                    style={{ animationDelay: `${index * 50}ms` }}
                />
            ))}
        </div>
    );
};

export default FoodGrid;
