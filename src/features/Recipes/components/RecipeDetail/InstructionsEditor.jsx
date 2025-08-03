// Lokasi file: src/features/Recipes/components/RecipeDetail/InstructionsEditor.jsx
// Deskripsi: Komponen terpisah untuk menampilkan dan mengedit instruksi resep.

import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { Textarea } from '../../../../components/ui/textarea';
import { GripVertical, Trash2, PlusCircle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '../../../../lib/utils';
import { AiButton } from './AiButton';

// Helper functions
const parseInstructions = (text) => {
    if (!text || typeof text !== 'string') return [];
    return text.split(/\n?\d+\.\s?/).filter(step => step.trim() !== '').map((stepText, index) => ({
        id: `step-${index}-${Date.now()}`,
        text: stepText.trim(),
    }));
};

const joinInstructions = (steps) => {
    return steps.map((step, index) => `${index + 1}. ${step.text}`).join('\n');
};

export const InstructionsEditor = ({ initialInstructions, onInstructionsChange, onAiGenerate, isAiLoading }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [steps, setSteps] = useState([]);

    useEffect(() => {
        setSteps(parseInstructions(initialInstructions));
    }, [initialInstructions]);

    const handleStepsChange = (newSteps) => {
        setSteps(newSteps);
        onInstructionsChange('instructions', joinInstructions(newSteps));
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        const items = Array.from(steps);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        handleStepsChange(items);
    };

    const handleTextChange = (id, newText) => {
        handleStepsChange(steps.map(step => (step.id === id ? { ...step, text: newText } : step)));
    };

    const addStep = () => {
        handleStepsChange([...steps, { id: `step-${steps.length}-${Date.now()}`, text: '' }]);
    };

    const deleteStep = (idToDelete) => {
        handleStepsChange(steps.filter(step => step.id !== idToDelete));
    };

    return (
        <div>
            <div className="flex justify-between items-center gap-2 mb-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Instruksi</h2>
                    <AiButton 
                        onClick={onAiGenerate} 
                        isLoading={isAiLoading} 
                        tooltipContent="Buat draf instruksi dengan AI" 
                    />
                </div>
                {!isEditing && (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Instruksi</Button>
                )}
            </div>

            {!isEditing ? (
                <div className="space-y-2">
                    {steps.length > 0 ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ol>
                                {steps.map((step) => <li key={step.id}>{step.text}</li>)}
                            </ol>
                        </div>
                    ) : (
                        <p className="text-muted-foreground italic">Belum ada instruksi.</p>
                    )}
                </div>
            ) : (
                <Card className="p-4 bg-muted/30">
                    <CardContent className="p-0">
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="instructions">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                        {steps.map((step, index) => (
                                            <Draggable key={step.id} draggableId={step.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div ref={provided.innerRef} {...provided.draggableProps} className={cn("flex items-start gap-2 p-2 rounded-lg bg-background border", snapshot.isDragging && "shadow-lg")}>
                                                        <div {...provided.dragHandleProps} className="pt-2 cursor-grab">
                                                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                        <span className="font-semibold text-lg pt-1">{index + 1}.</span>
                                                        <Textarea value={step.text} onChange={(e) => handleTextChange(step.id, e.target.value)} placeholder="Tulis langkah di sini..." rows={2} className="flex-1" />
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
                        <div className="flex justify-between items-center mt-4">
                            <Button variant="outline" size="sm" onClick={addStep}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Tambah Langkah
                            </Button>
                            <Button variant="secondary" onClick={() => setIsEditing(false)}>Selesai Mengedit</Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
