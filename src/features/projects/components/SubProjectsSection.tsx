'use client';

import { useEffect, useState } from 'react';
import { FolderGit2, Plus, X, Check, Pencil, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type SubProjectStatus = 'Pendiente' | 'En Progreso' | 'Completado';

interface SubProject {
    id: string;
    project_id: string;
    name: string;
    description: string | null;
    status: SubProjectStatus;
    created_at: string;
}

interface AddFormState {
    name: string;
    description: string;
    status: SubProjectStatus;
}

interface EditFormState {
    name: string;
    description: string;
    status: SubProjectStatus;
}

interface SubProjectsSectionProps {
    projectId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: SubProjectStatus[] = ['Pendiente', 'En Progreso', 'Completado'];

const STATUS_STYLES: Record<SubProjectStatus, string> = {
    'Pendiente':   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
    'En Progreso': 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20',
    'Completado':  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INPUT_CLASS =
    'text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50';

// ─── Sub-component: Status Badge ──────────────────────────────────────────────

function StatusBadge({ status }: { status: SubProjectStatus }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0 ${STATUS_STYLES[status]}`}>
            {status}
        </span>
    );
}

// ─── Sub-component: Row ───────────────────────────────────────────────────────

interface RowProps {
    sp: SubProject;
    onDelete: (id: string) => Promise<void>;
    onUpdate: (id: string, data: EditFormState) => Promise<void>;
    deleting: boolean;
    saving: boolean;
}

function SubProjectRow({ sp, onDelete, onUpdate, deleting, saving }: RowProps) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<EditFormState>({
        name: sp.name,
        description: sp.description ?? '',
        status: sp.status as SubProjectStatus,
    });

    const handleSave = async () => {
        const trimmedName = form.name.trim();
        if (!trimmedName) return;
        await onUpdate(sp.id, { ...form, name: trimmedName, description: form.description.trim() });
        setEditing(false);
    };

    const handleCancel = () => {
        setForm({ name: sp.name, description: sp.description ?? '', status: sp.status as SubProjectStatus });
        setEditing(false);
    };

    if (editing) {
        return (
            <li className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Nombre del sub-proyecto..."
                        maxLength={200}
                        disabled={saving}
                        className={`${INPUT_CLASS} w-full font-semibold`}
                        aria-label="Nombre del sub-proyecto"
                        autoFocus
                    />
                    <textarea
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Descripcion (opcional)..."
                        rows={2}
                        maxLength={500}
                        disabled={saving}
                        className={`${INPUT_CLASS} w-full resize-none`}
                        aria-label="Descripcion del sub-proyecto"
                    />
                    <div className="flex items-center gap-2">
                        <select
                            value={form.status}
                            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as SubProjectStatus }))}
                            disabled={saving}
                            className={`${INPUT_CLASS} flex-1`}
                            aria-label="Estado del sub-proyecto"
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleSave}
                            disabled={saving || !form.name.trim()}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                            aria-label="Guardar cambios"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Guardar
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 flex-shrink-0"
                            aria-label="Cancelar edicion"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </li>
        );
    }

    return (
        <li className="group flex items-start gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-sm dark:hover:shadow-slate-900/50 transition-shadow">
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                    <button
                        onClick={() => setEditing(true)}
                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded text-left truncate"
                        title="Hacer clic para editar"
                        aria-label={`Editar sub-proyecto: ${sp.name}`}
                    >
                        {sp.name}
                    </button>
                    <StatusBadge status={sp.status as SubProjectStatus} />
                </div>
                {sp.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{sp.description}</p>
                )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                    onClick={() => setEditing(true)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-primary hover:bg-primary/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`Editar sub-proyecto: ${sp.name}`}
                >
                    <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => onDelete(sp.id)}
                    disabled={deleting}
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Eliminar sub-proyecto: ${sp.name}`}
                >
                    {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                </button>
            </div>
        </li>
    );
}

// ─── Sub-component: Add Form ──────────────────────────────────────────────────

interface AddFormProps {
    onAdd: (data: AddFormState) => Promise<void>;
    saving: boolean;
}

function AddSubProjectForm({ onAdd, saving }: AddFormProps) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<AddFormState>({ name: '', description: '', status: 'Pendiente' });
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const trimmedName = form.name.trim();
        if (!trimmedName) {
            setError('El nombre es requerido.');
            return;
        }
        await onAdd({ ...form, name: trimmedName, description: form.description.trim() });
        setForm({ name: '', description: '', status: 'Pendiente' });
        setOpen(false);
    };

    if (!open) {
        return (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-sm text-muted-foreground hover:text-foreground hover:border-primary hover:bg-primary/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Agregar nuevo sub-proyecto"
                >
                    <Plus className="w-4 h-4" />
                    Agregar sub-proyecto
                </button>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3"
            aria-label="Formulario agregar sub-proyecto"
        >
            {error && (
                <p className="text-xs text-red-600 dark:text-red-400" role="alert">{error}</p>
            )}
            <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del sub-proyecto..."
                maxLength={200}
                disabled={saving}
                className={`${INPUT_CLASS} w-full`}
                aria-label="Nombre del nuevo sub-proyecto"
                autoFocus
            />
            <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descripcion (opcional)..."
                rows={2}
                maxLength={500}
                disabled={saving}
                className={`${INPUT_CLASS} w-full resize-none`}
                aria-label="Descripcion del nuevo sub-proyecto"
            />
            <div className="flex flex-col sm:flex-row gap-2">
                <select
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as SubProjectStatus }))}
                    disabled={saving}
                    className={`${INPUT_CLASS} flex-1`}
                    aria-label="Estado del nuevo sub-proyecto"
                >
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <button
                    type="submit"
                    disabled={saving || !form.name.trim()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Agregar
                </button>
                <button
                    type="button"
                    onClick={() => { setOpen(false); setError(null); setForm({ name: '', description: '', status: 'Pendiente' }); }}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SubProjectsSection({ projectId }: SubProjectsSectionProps) {
    const [subProjects, setSubProjects] = useState<SubProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
    const [adding, setAdding] = useState(false);

    const supabase = createClient();

    // ── Fetch ──
    const fetchSubProjects = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const { data, error } = await supabase
                .from('sub_projects')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setSubProjects((data ?? []) as SubProject[]);
        } catch {
            setFetchError('No se pudieron cargar los sub-proyectos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) fetchSubProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    // ── Add ──
    const handleAdd = async (data: AddFormState) => {
        setAdding(true);
        try {
            const { data: inserted, error } = await supabase
                .from('sub_projects')
                .insert({
                    project_id: projectId,
                    name: data.name,
                    description: data.description || null,
                    status: data.status,
                })
                .select()
                .single();

            if (error) throw error;
            if (inserted) setSubProjects((prev) => [...prev, inserted as SubProject]);
        } finally {
            setAdding(false);
        }
    };

    // ── Update ──
    const handleUpdate = async (id: string, data: EditFormState) => {
        setUpdatingIds((prev) => new Set(prev).add(id));
        try {
            const { error } = await supabase
                .from('sub_projects')
                .update({
                    name: data.name,
                    description: data.description || null,
                    status: data.status,
                })
                .eq('id', id);

            if (error) throw error;
            setSubProjects((prev) =>
                prev.map((sp) =>
                    sp.id === id
                        ? { ...sp, name: data.name, description: data.description || null, status: data.status }
                        : sp
                )
            );
        } finally {
            setUpdatingIds((prev) => {
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
                .from('sub_projects')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setSubProjects((prev) => prev.filter((sp) => sp.id !== id));
        } finally {
            setDeletingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    // ── Render states ──
    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Cargando sub-proyectos...</span>
                </div>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">{fetchError}</p>
                <button
                    onClick={fetchSubProjects}
                    className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            {subProjects.length === 0 ? (
                <div className="text-center py-4 mb-2">
                    <FolderGit2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Sin sub-proyectos aun. Agrega el primero.</p>
                </div>
            ) : (
                <ul className="space-y-3 mb-0" aria-label="Lista de sub-proyectos">
                    {subProjects.map((sp) => (
                        <SubProjectRow
                            key={sp.id}
                            sp={sp}
                            onDelete={handleDelete}
                            onUpdate={handleUpdate}
                            deleting={deletingIds.has(sp.id)}
                            saving={updatingIds.has(sp.id)}
                        />
                    ))}
                </ul>
            )}
            <AddSubProjectForm onAdd={handleAdd} saving={adding} />
        </div>
    );
}
