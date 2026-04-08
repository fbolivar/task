'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './Toast';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function QuickAddTask() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-focus input when form opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Close on ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                handleClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setTitle('');
    }, []);

    const handleSave = useCallback(async () => {
        const trimmed = title.trim();
        if (!trimmed) return;
        if (!user?.id) {
            toast('No se encontró la sesión de usuario', 'error');
            return;
        }

        setSaving(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.from('tasks').insert({
                title: trimmed,
                status: 'Pendiente',
                priority: 'Media',
                sub_status: 'En Tiempo',
                created_by: user.id,
                assigned_to: user.id,
                project_id: null,
                notes: null,
                end_date: null,
                evidence_link: null,
                estimated_hours: 0,
                actual_hours: 0,
            });

            if (error) throw error;

            toast(`Tarea "${trimmed}" creada`, 'success');
            setTitle('');
            inputRef.current?.focus();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al crear la tarea';
            toast(message, 'error');
        } finally {
            setSaving(false);
        }
    }, [title, user, toast]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <div
            ref={containerRef}
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
        >
            {/* Inline card form — appears above the FAB */}
            {isOpen && (
                <div
                    role="dialog"
                    aria-label="Agregar tarea rápida"
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 w-80 animate-in slide-in-from-bottom-4 fade-in duration-200"
                >
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-primary">
                            Nueva tarea
                        </p>
                        <button
                            type="button"
                            aria-label="Cerrar"
                            onClick={handleClose}
                            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Nombre de la tarea..."
                            maxLength={200}
                            aria-label="Titulo de la tarea"
                            className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || !title.trim()}
                            aria-label="Crear tarea"
                            className="shrink-0 px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors flex items-center gap-1.5"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                            ) : (
                                'Crear'
                            )}
                        </button>
                    </div>

                    <p className="text-[10px] text-muted-foreground mt-2">
                        Enter para guardar &middot; Esc para cerrar
                    </p>
                </div>
            )}

            {/* Floating action button */}
            <button
                type="button"
                aria-label={isOpen ? 'Cerrar formulario de tarea rapida' : 'Agregar tarea rapida'}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((prev) => !prev)}
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/50 ${
                    isOpen
                        ? 'bg-slate-700 hover:bg-slate-600 rotate-45 scale-100'
                        : 'bg-primary hover:bg-primary/90 hover:scale-110'
                }`}
            >
                <Plus className="w-7 h-7 text-white transition-transform duration-200" aria-hidden="true" />
            </button>
        </div>
    );
}
