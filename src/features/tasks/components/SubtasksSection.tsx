'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckSquare, Square, Plus, Trash2, ListChecks } from 'lucide-react';

interface SubtaskItem {
    id: string;
    title: string;
    completed: boolean;
    createdAt: number;
}

interface SubtasksSectionProps {
    taskId: string;
}

const STORAGE_KEY_PREFIX = 'task_subtasks_';

function loadSubtasks(taskId: string): SubtaskItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${taskId}`);
        if (!raw) return [];
        return JSON.parse(raw) as SubtaskItem[];
    } catch {
        return [];
    }
}

function saveSubtasks(taskId: string, items: SubtaskItem[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${taskId}`, JSON.stringify(items));
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function SubtasksSection({ taskId }: SubtasksSectionProps) {
    const [items, setItems] = useState<SubtaskItem[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load from localStorage on mount / taskId change
    useEffect(() => {
        setItems(loadSubtasks(taskId));
    }, [taskId]);

    // Persist on every change
    useEffect(() => {
        saveSubtasks(taskId, items);
    }, [taskId, items]);

    // Focus input when add row becomes visible
    useEffect(() => {
        if (isAdding) {
            inputRef.current?.focus();
        }
    }, [isAdding]);

    const completedCount = items.filter((i) => i.completed).length;
    const total = items.length;
    const progressPct = total === 0 ? 0 : Math.round((completedCount / total) * 100);

    const handleToggle = (id: string) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, completed: !item.completed } : item
            )
        );
    };

    const handleDelete = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const handleAddConfirm = () => {
        const trimmed = newTitle.trim();
        if (!trimmed) {
            setIsAdding(false);
            return;
        }
        const newItem: SubtaskItem = {
            id: generateId(),
            title: trimmed,
            completed: false,
            createdAt: Date.now(),
        };
        setItems((prev) => [...prev, newItem]);
        setNewTitle('');
        // Keep the input open so user can quickly add more items
        inputRef.current?.focus();
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddConfirm();
        }
        if (e.key === 'Escape') {
            setNewTitle('');
            setIsAdding(false);
        }
    };

    return (
        <section aria-label="Lista de subtareas" className="space-y-3">
            {/* Section header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-primary" aria-hidden="true" />
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Subtareas
                    </span>
                    {total > 0 && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            {completedCount}/{total}
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    aria-label="Agregar subtarea"
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
                >
                    <Plus className="w-3 h-3" aria-hidden="true" />
                    Agregar
                </button>
            </div>

            {/* Progress bar — only visible when there are items */}
            {total > 0 && (
                <div
                    className="space-y-1"
                    role="progressbar"
                    aria-valuenow={progressPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progreso de subtareas: ${progressPct}%`}
                >
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                progressPct === 100
                                    ? 'bg-emerald-500'
                                    : progressPct >= 60
                                    ? 'bg-blue-500'
                                    : 'bg-amber-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Items list */}
            {items.length > 0 && (
                <ul className="space-y-1" aria-label="Subtareas">
                    {items.map((item) => (
                        <li
                            key={item.id}
                            className="group flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                            <button
                                type="button"
                                onClick={() => handleToggle(item.id)}
                                aria-label={
                                    item.completed
                                        ? `Marcar "${item.title}" como pendiente`
                                        : `Completar "${item.title}"`
                                }
                                className="shrink-0 text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                            >
                                {item.completed ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                                ) : (
                                    <Square className="w-4 h-4" aria-hidden="true" />
                                )}
                            </button>

                            <span
                                className={`flex-1 text-sm font-medium transition-colors ${
                                    item.completed
                                        ? 'line-through text-muted-foreground/40'
                                        : 'text-foreground'
                                }`}
                            >
                                {item.title}
                            </span>

                            <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                aria-label={`Eliminar subtarea "${item.title}"`}
                                className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-red-500 transition-all focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
                            >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* Inline add row */}
            {isAdding && (
                <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg border border-primary/30 bg-primary/5">
                    <Square className="w-4 h-4 text-muted-foreground/40 shrink-0" aria-hidden="true" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        onBlur={() => {
                            // Small delay so click on confirm still fires
                            setTimeout(() => {
                                if (newTitle.trim()) {
                                    handleAddConfirm();
                                } else {
                                    setIsAdding(false);
                                }
                            }, 150);
                        }}
                        placeholder="Nombre de la subtarea... (Enter para guardar, Esc para cancelar)"
                        className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                        aria-label="Nueva subtarea"
                    />
                </div>
            )}

            {/* Empty state when no items and not adding */}
            {total === 0 && !isAdding && (
                <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-muted-foreground/40 hover:text-muted-foreground hover:border-slate-300 dark:hover:border-slate-700 transition-all text-xs font-bold uppercase tracking-widest"
                    aria-label="Agregar primera subtarea"
                >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    Agregar subtarea
                </button>
            )}
        </section>
    );
}
