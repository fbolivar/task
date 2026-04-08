'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, AlertCircle, X, Plus, Flag, Loader2 } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Milestone {
    id: string;
    project_id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    is_completed: boolean;
    completed_at: string | null;
    sort_order: number;
    created_at: string;
}

interface MilestonesSectionProps {
    projectId: string;
    editable?: boolean;
}

interface AddFormState {
    title: string;
    due_date: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    try {
        return format(parseISO(dateStr), 'd MMM yyyy', { locale: es });
    } catch {
        return dateStr;
    }
}

function getMilestoneStatus(milestone: Milestone): 'completed' | 'overdue' | 'upcoming' {
    if (milestone.is_completed) return 'completed';
    if (milestone.due_date && isPast(parseISO(milestone.due_date))) return 'overdue';
    return 'upcoming';
}

// ─── Milestone Node ───────────────────────────────────────────────────────────

interface MilestoneNodeProps {
    milestone: Milestone;
    isLast: boolean;
    editable: boolean;
    onToggle: (id: string, current: boolean) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    toggling: boolean;
    deleting: boolean;
}

function MilestoneNode({
    milestone,
    isLast,
    editable,
    onToggle,
    onDelete,
    toggling,
    deleting,
}: MilestoneNodeProps) {
    const status = getMilestoneStatus(milestone);

    const nodeButton: Record<'completed' | 'overdue' | 'upcoming', string> = {
        completed: 'text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300',
        overdue:   'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300',
        upcoming:  'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300',
    };

    const lineColor: Record<'completed' | 'overdue' | 'upcoming', string> = {
        completed: 'bg-emerald-200 dark:bg-emerald-800',
        overdue:   'bg-red-200 dark:bg-red-900',
        upcoming:  'bg-slate-200 dark:bg-slate-700',
    };

    return (
        <li className="relative flex gap-4 group">
            {/* Vertical line */}
            {!isLast && (
                <div
                    className={`absolute left-[15px] top-8 w-0.5 bottom-0 -mb-4 ${lineColor[status]}`}
                    aria-hidden="true"
                />
            )}

            {/* Circle toggle button */}
            <div className="flex-shrink-0 mt-0.5">
                {editable ? (
                    <button
                        onClick={() => onToggle(milestone.id, milestone.is_completed)}
                        disabled={toggling}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${nodeButton[status]} disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label={milestone.is_completed ? 'Marcar incompleto' : 'Marcar completado'}
                        title={milestone.is_completed ? 'Marcar como incompleto' : 'Marcar como completado'}
                    >
                        {toggling ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5" />
                        ) : status === 'overdue' ? (
                            <AlertCircle className="w-5 h-5" />
                        ) : (
                            <Circle className="w-5 h-5" />
                        )}
                    </button>
                ) : (
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full ${nodeButton[status]}`} aria-hidden="true">
                        {status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5" />
                        ) : status === 'overdue' ? (
                            <AlertCircle className="w-5 h-5" />
                        ) : (
                            <Circle className="w-5 h-5" />
                        )}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-6 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p
                            className={`text-sm font-semibold leading-tight ${
                                milestone.is_completed
                                    ? 'line-through text-muted-foreground'
                                    : 'text-foreground'
                            }`}
                        >
                            {milestone.title}
                        </p>

                        {milestone.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {milestone.description}
                            </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {milestone.due_date && (
                                <span
                                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                        status === 'completed'
                                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                            : status === 'overdue'
                                            ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}
                                >
                                    {formatDate(milestone.due_date)}
                                    {status === 'overdue' && ' · Vencido'}
                                </span>
                            )}
                            {milestone.is_completed && milestone.completed_at && (
                                <span className="text-[11px] text-muted-foreground/70">
                                    Completado {formatDate(milestone.completed_at)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Delete button */}
                    {editable && (
                        <button
                            onClick={() => onDelete(milestone.id)}
                            disabled={deleting}
                            className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded-md text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-all focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={`Eliminar hito: ${milestone.title}`}
                        >
                            {deleting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <X className="w-3.5 h-3.5" />
                            )}
                        </button>
                    )}
                </div>
            </div>
        </li>
    );
}

// ─── Add Form ─────────────────────────────────────────────────────────────────

interface AddMilestoneFormProps {
    onAdd: (data: AddFormState) => Promise<void>;
    saving: boolean;
}

function AddMilestoneForm({ onAdd, saving }: AddMilestoneFormProps) {
    const [form, setForm] = useState<AddFormState>({ title: '', due_date: '' });
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const trimmed = form.title.trim();
        if (!trimmed) {
            setError('El titulo es requerido.');
            return;
        }

        await onAdd({ title: trimmed, due_date: form.due_date });
        setForm({ title: '', due_date: '' });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
            aria-label="Agregar nuevo hito"
        >
            {error && (
                <p className="mb-2 text-xs text-red-600 dark:text-red-400" role="alert">
                    {error}
                </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Titulo del hito..."
                    maxLength={200}
                    disabled={saving}
                    className="flex-1 min-w-0 text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    aria-label="Titulo del hito"
                />
                <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
                    disabled={saving}
                    className="text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 w-full sm:w-auto"
                    aria-label="Fecha limite del hito"
                />
                <button
                    type="submit"
                    disabled={saving || !form.title.trim()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Plus className="w-4 h-4" />
                    )}
                    Agregar
                </button>
            </div>
        </form>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MilestonesSection({ projectId, editable = true }: MilestonesSectionProps) {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Per-item loading state: milestoneId -> boolean
    const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);

    const supabase = createClient();

    // ── Fetch ──
    const fetchMilestones = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const { data, error } = await supabase
                .from('project_milestones')
                .select('*')
                .eq('project_id', projectId)
                .order('sort_order', { ascending: true })
                .order('due_date', { ascending: true });

            if (error) throw error;
            setMilestones((data ?? []) as Milestone[]);
        } catch {
            setFetchError('No se pudieron cargar los hitos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) fetchMilestones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    // ── Toggle complete ──
    const handleToggle = async (id: string, current: boolean) => {
        setTogglingIds((prev) => new Set(prev).add(id));
        try {
            const now = new Date().toISOString();
            const { error } = await supabase
                .from('project_milestones')
                .update({
                    is_completed: !current,
                    completed_at: !current ? now : null,
                })
                .eq('id', id);

            if (error) throw error;

            setMilestones((prev) =>
                prev.map((m) =>
                    m.id === id
                        ? { ...m, is_completed: !current, completed_at: !current ? now : null }
                        : m
                )
            );
        } finally {
            setTogglingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    // ── Delete ──
    const handleDelete = async (id: string) => {
        setDeletingIds((prev) => new Set(prev).add(id));
        try {
            const { error } = await supabase
                .from('project_milestones')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setMilestones((prev) => prev.filter((m) => m.id !== id));
        } finally {
            setDeletingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    // ── Add ──
    const handleAdd = async ({ title, due_date }: AddFormState) => {
        setSaving(true);
        try {
            const maxOrder = milestones.reduce((max, m) => Math.max(max, m.sort_order ?? 0), 0);
            const { data, error } = await supabase
                .from('project_milestones')
                .insert({
                    project_id: projectId,
                    title,
                    due_date: due_date || null,
                    sort_order: maxOrder + 1,
                    is_completed: false,
                })
                .select()
                .single();

            if (error) throw error;
            if (data) setMilestones((prev) => [...prev, data as Milestone]);
        } finally {
            setSaving(false);
        }
    };

    // ── Render states ──
    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Cargando hitos...</span>
                </div>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{fetchError}</p>
                <button
                    onClick={fetchMilestones}
                    className="mt-3 text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    const isEmpty = milestones.length === 0;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            {isEmpty && !editable ? (
                <div className="text-center py-4">
                    <Flag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Sin hitos registrados para este proyecto.</p>
                </div>
            ) : (
                <>
                    {isEmpty ? (
                        <div className="text-center py-4">
                            <Flag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Aun no hay hitos. Agrega el primero.</p>
                        </div>
                    ) : (
                        <ol aria-label="Cronograma de hitos" className="list-none">
                            {milestones.map((milestone, index) => (
                                <MilestoneNode
                                    key={milestone.id}
                                    milestone={milestone}
                                    isLast={index === milestones.length - 1}
                                    editable={editable}
                                    onToggle={handleToggle}
                                    onDelete={handleDelete}
                                    toggling={togglingIds.has(milestone.id)}
                                    deleting={deletingIds.has(milestone.id)}
                                />
                            ))}
                        </ol>
                    )}

                    {editable && (
                        <AddMilestoneForm onAdd={handleAdd} saving={saving} />
                    )}
                </>
            )}
        </div>
    );
}
