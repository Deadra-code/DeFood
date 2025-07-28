// Lokasi file: src/features/Recipes/components/RecipeDetail/InstructionsEditor.jsx
// Deskripsi: Komponen baru untuk editor instruksi yang terstruktur dengan drag-and-drop.

import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '../../../../components/ui/button';
import { Textarea } from '../../../../components/ui/textarea';
import { GripVertical, Trash2, PlusCircle, Save, X } from 'lucide-react';
import { Card, CardContent } from '../../../../components/ui/card';
import { cn } from '../../../../lib/utils';

// Fungsi untuk mengubah blok teks menjadi array langkah-langkah
const parseInstructions = (text) => {
    if (!text || typeof text !== 'string') return [];
    // Memisahkan berdasarkan pola "nomor." dan membersihkan spasi
    return text.split(/\n?\d+\.\s?/).filter(step => step.trim() !== '').map((stepText, index) => ({
        id: `step-${index}-${Date.now()}`, // ID unik untuk drag-and-drop
        text: stepText.trim(),
    }));
};

// Fungsi untuk menggabungkan array langkah-langkah menjadi satu blok teks
const joinInstructions = (steps) => {
    return steps.map((step, index) => `${index + 1}. ${step.text}`).join('\n');
};

export const InstructionsEditor = ({ initialValue, onSave, onCancel, onDirtyChange }) => {
    const [steps, setSteps] = useState([]);
    const [isEditing, setIsEditing] = useState(false);

    // Efek untuk mem-parsing nilai awal saat komponen dimuat atau nilai berubah
    useEffect(() => {
        setSteps(parseInstructions(initialValue));
    }, [initialValue]);
    
    // Efek untuk memberitahu parent jika ada perubahan
    useEffect(() => {
        if(onDirtyChange) {
            const originalText = joinInstructions(parseInstructions(initialValue));
            const currentText = joinInstructions(steps);
            onDirtyChange(originalText !== currentText);
        }
    }, [steps, initialValue, onDirtyChange]);


    const handleOnDragEnd = (result) => {
        if (!result.destination) return;
        const items = Array.from(steps);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setSteps(items);
    };

    const handleTextChange = (id, newText) => {
        setSteps(steps.map(step => (step.id === id ? { ...step, text: newText } : step)));
    };

    const addStep = () => {
        const newStep = { id: `step-${steps.length}-${Date.now()}`, text: '' };
        setSteps([...steps, newStep]);
    };

    const deleteStep = (idToDelete) => {
        setSteps(steps.filter(step => step.id !== idToDelete));
    };

    const handleSave = () => {
        onSave(joinInstructions(steps));
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        // Panggil onCancel dari prop jika ada, atau reset state secara lokal
        if (onCancel) {
            onCancel();
        } else {
            setSteps(parseInstructions(initialValue));
        }
        setIsEditing(false);
    };

    if (!isEditing) {
        return (
            <div className="space-y-2">
                {steps.length > 0 ? (
                    steps.map((step, index) => (
                        <div key={step.id} className="flex items-start gap-3">
                            <span className="font-semibold text-lg text-primary">{index + 1}.</span>
                            <p className="flex-1 pt-0.5 text-base leading-relaxed">{step.text}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-muted-foreground italic">Belum ada instruksi.</p>
                )}
                <Button variant="outline" onClick={() => setIsEditing(true)} className="mt-4">Edit Instruksi</Button>
            </div>
        );
    }

    return (
        <Card className="p-4 bg-muted/30">
            <CardContent className="p-0">
                <DragDropContext onDragEnd={handleOnDragEnd}>
                    <Droppable droppableId="instructions">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                {steps.map((step, index) => (
                                    <Draggable key={step.id} draggableId={step.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={cn(
                                                    "flex items-start gap-2 p-2 rounded-lg bg-background border",
                                                    snapshot.isDragging && "shadow-lg"
                                                )}
                                            >
                                                <div {...provided.dragHandleProps} className="pt-2 cursor-grab">
                                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <span className="font-semibold text-lg pt-1">{index + 1}.</span>
                                                <Textarea
                                                    value={step.text}
                                                    onChange={(e) => handleTextChange(step.id, e.target.value)}
                                                    placeholder="Tulis langkah di sini..."
                                                    rows={2}
                                                    className="flex-1"
                                                />
                                                <Button variant="ghost" size="icon" onClick={() => deleteStep(step.id)} className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                <Button variant="outline" size="sm" onClick={addStep} className="mt-4">
                    <PlusCircle className="mr-2 h-4 w-4" /> Tambah Langkah
                </Button>
            </CardContent>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button variant="ghost" onClick={handleCancelEdit}><X className="mr-2 h-4 w-4"/> Batal</Button>
                <Button onClick={handleSave}><Save className="mr-2 h-4 w-4"/> Simpan Instruksi</Button>
            </div>
        </Card>
    );
};
