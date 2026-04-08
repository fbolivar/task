'use client';

import { useState } from 'react';
import { FileText, Pencil, Save, X, Loader2, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectNotesProps {
    projectId: string;
    initialDescription: string | null;
    updatedAt?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(ts: string | null | undefined): string {
    if (!ts) return '';
    try {
        return format(parseISO(ts), "d MMM yyyy 'a las' HH:mm", { locale: es });
    } catch {
        return '';
    }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProjectNotes({ projectId, initialDescription, updatedAt }: ProjectNotesProps) {
    const [editing, setEditing] = useState(false);
    const [description, setDescription] = useState(initialDescription ?? '');
    const [draft, setDraft] = useState(initialDescription ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(updatedAt ?? null);

    const supabase = createClient();

    const handleEdit = () => {
        setDraft(description);
        setError(null);
        setEditing(true);
    };

    const handleCancel = () => {
        setDraft(description);
        setError(null);
        setEditing(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const now = new Date().toISOString();
            const { error: supabaseError } = await supabase
                .from('projects')
                .update({ description: draft.trim() || null, updated_at: now })
                .eq('id', projectId);

            if (supabaseError) throw supabaseError;

            setDescription(draft.trim());
            setLastUpdated(now);
            setEditing(false);
        } catch {
            setError('No se pudo guardar. Intenta nuevamente.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        Notas del proyecto
                    </h2>
                </div>
                {!editing && (
                    <button
                        onClick={handleEdit}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label="Editar notas del proyecto"
                    >
                        <Pencil className="w-3 h-3" />
                        Editar
                    </button>
                )}
            </div>

            {/* Content */}
            {editing ? (
                <div className="space-y-3">
                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Agrega notas, contexto o descripcion del proyecto..."
                        rows={6}
                        maxLength={3000}
                        disabled={saving}
                        className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 resize-none leading-relaxed"
                        aria-label="Notas del proyecto"
                        autoFocus
                    />
                    {error && (
                        <p className="text-xs text-red-600 dark:text-red-400" role="alert">{error}</p>
                    )}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Guardar notas"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Guardar
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                            aria-label="Cancelar edicion"
                        >
                            <X className="w-4 h-4" />
                            Cancelar
                        </button>
                        <span className="text-[11px] text-muted-foreground/70 ml-auto">
                            {draft.length}/3000
                        </span>
                    </div>
                </div>
            ) : (
                <div>
                    {description ? (
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                            {description}
                        </p>
                    ) : (
                        <button
                            onClick={handleEdit}
                            className="w-full text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-primary hover:bg-primary/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label="Agregar notas al proyecto"
                        >
                            <FileText className="w-6 h-6 mx-auto mb-1 opacity-40" aria-hidden="true" />
                            Haz clic para agregar notas al proyecto
                        </button>
                    )}

                    {lastUpdated && (
                        <div className="flex items-center gap-1 mt-3 text-[11px] text-muted-foreground/70">
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            <span>Ultima edicion: {formatTimestamp(lastUpdated)}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
