'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Wrench,
    Plus,
    Trash2,
    CheckCircle2,
    Clock,
    DollarSign,
    User,
    Calendar,
    ChevronDown,
    Loader2,
    AlertTriangle,
} from 'lucide-react';

type MaintenanceType = 'preventivo' | 'correctivo' | 'mejora';

interface MaintenanceRecord {
    id: string;
    asset_id: string;
    type: MaintenanceType;
    description: string;
    provider: string | null;
    cost: number | null;
    scheduled_date: string | null;
    completed_date: string | null;
    created_at: string;
}

interface MaintenanceSectionProps {
    assetId: string;
}

const TYPE_BADGE: Record<MaintenanceType, string> = {
    preventivo: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    correctivo: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    mejora: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
};

const TYPE_LABELS: Record<MaintenanceType, string> = {
    preventivo: 'Preventivo',
    correctivo: 'Correctivo',
    mejora: 'Mejora',
};

const EMPTY_FORM = {
    type: 'preventivo' as MaintenanceType,
    description: '',
    provider: '',
    cost: '',
    scheduled_date: '',
};

export function MaintenanceSection({ assetId }: MaintenanceSectionProps) {
    const [records, setRecords] = useState<MaintenanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const supabase = createClient();

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await supabase
            .from('asset_maintenance')
            .select('*')
            .eq('asset_id', assetId)
            .order('scheduled_date', { ascending: false });

        if (fetchError) {
            setError('Error al cargar los registros de mantenimiento');
        } else {
            setRecords(data ?? []);
        }
        setLoading(false);
    }, [assetId]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.description.trim()) return;
        setSubmitting(true);
        const { error: insertError } = await supabase.from('asset_maintenance').insert({
            asset_id: assetId,
            type: form.type,
            description: form.description.trim(),
            provider: form.provider.trim() || null,
            cost: form.cost ? Number(form.cost) : null,
            scheduled_date: form.scheduled_date || null,
            completed_date: null,
        });
        setSubmitting(false);
        if (insertError) {
            setError('Error al guardar el mantenimiento');
        } else {
            setForm(EMPTY_FORM);
            setShowForm(false);
            await fetchRecords();
        }
    };

    const handleToggleComplete = async (record: MaintenanceRecord) => {
        setTogglingId(record.id);
        const newDate = record.completed_date ? null : new Date().toISOString().slice(0, 10);
        const { error: updateError } = await supabase
            .from('asset_maintenance')
            .update({ completed_date: newDate })
            .eq('id', record.id);
        setTogglingId(null);
        if (!updateError) {
            setRecords((prev) =>
                prev.map((r) => (r.id === record.id ? { ...r, completed_date: newDate } : r))
            );
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Eliminar este registro de mantenimiento?')) return;
        setDeletingId(id);
        const { error: deleteError } = await supabase
            .from('asset_maintenance')
            .delete()
            .eq('id', id);
        setDeletingId(null);
        if (!deleteError) {
            setRecords((prev) => prev.filter((r) => r.id !== id));
        }
    };

    return (
        <section aria-labelledby="maintenance-heading" className="space-y-4">
            {/* Section header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-muted-foreground" />
                    <h3
                        id="maintenance-heading"
                        className="text-sm font-black uppercase tracking-widest text-foreground"
                    >
                        Mantenimiento
                    </h3>
                    {records.length > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            {records.length}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setShowForm((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                    aria-expanded={showForm}
                    aria-controls="maintenance-form"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Nuevo
                    <ChevronDown
                        className={`w-3 h-3 transition-transform duration-200 ${showForm ? 'rotate-180' : ''}`}
                    />
                </button>
            </div>

            {/* Add form */}
            {showForm && (
                <form
                    id="maintenance-form"
                    onSubmit={handleSubmit}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 space-y-3"
                    aria-label="Agregar mantenimiento"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Type */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Tipo
                            </label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as MaintenanceType }))}
                                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            >
                                <option value="preventivo">Preventivo</option>
                                <option value="correctivo">Correctivo</option>
                                <option value="mejora">Mejora</option>
                            </select>
                        </div>

                        {/* Scheduled date */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Fecha programada
                            </label>
                            <input
                                type="date"
                                value={form.scheduled_date}
                                onChange={(e) => setForm((f) => ({ ...f, scheduled_date: e.target.value }))}
                                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Descripción <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            placeholder="Descripción del mantenimiento..."
                            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Provider */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Proveedor
                            </label>
                            <input
                                type="text"
                                value={form.provider}
                                onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                                placeholder="Nombre del proveedor..."
                                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>

                        {/* Cost */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Costo
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.cost}
                                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                                placeholder="0.00"
                                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Form actions */}
                    <div className="flex items-center gap-2 pt-1">
                        <button
                            type="submit"
                            disabled={submitting || !form.description.trim()}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {submitting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Plus className="w-3.5 h-3.5" />
                            )}
                            Guardar
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                            className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Error state */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Loading state */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
            )}

            {/* Empty state */}
            {!loading && !error && records.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3">
                        <Wrench className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                        Sin registros de mantenimiento
                    </p>
                </div>
            )}

            {/* Records list */}
            {!loading && records.length > 0 && (
                <ul className="space-y-3" aria-label="Registros de mantenimiento">
                    {records.map((record) => (
                        <li
                            key={record.id}
                            className={`group relative p-4 rounded-2xl border transition-all duration-300 ${
                                record.completed_date
                                    ? 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-white/5 opacity-70'
                                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-white/10 hover:border-primary/30'
                            }`}
                        >
                            {/* Top row: type badge + date + actions */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${TYPE_BADGE[record.type]}`}
                                    >
                                        {TYPE_LABELS[record.type]}
                                    </span>
                                    {record.completed_date && (
                                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Completado
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {/* Toggle complete */}
                                    <button
                                        type="button"
                                        onClick={() => handleToggleComplete(record)}
                                        disabled={togglingId === record.id}
                                        className={`p-1.5 rounded-lg text-[10px] transition-all ${
                                            record.completed_date
                                                ? 'text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10'
                                                : 'text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10'
                                        }`}
                                        aria-label={record.completed_date ? 'Marcar como pendiente' : 'Marcar como completado'}
                                        title={record.completed_date ? 'Marcar como pendiente' : 'Marcar como completado'}
                                    >
                                        {togglingId === record.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4" />
                                        )}
                                    </button>
                                    {/* Delete */}
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(record.id)}
                                        disabled={deletingId === record.id}
                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                                        aria-label="Eliminar registro"
                                        title="Eliminar registro"
                                    >
                                        {deletingId === record.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm font-medium text-foreground mb-3 leading-relaxed">
                                {record.description}
                            </p>

                            {/* Meta row */}
                            <div className="flex flex-wrap items-center gap-3">
                                {record.provider && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <User className="w-3.5 h-3.5 shrink-0" />
                                        <span className="font-medium">{record.provider}</span>
                                    </div>
                                )}
                                {record.cost != null && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <DollarSign className="w-3.5 h-3.5 shrink-0" />
                                        <span className="font-medium">
                                            {record.cost.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                )}
                                {record.scheduled_date && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Clock className="w-3.5 h-3.5 shrink-0" />
                                        <span className="font-medium">
                                            Programado: {new Date(record.scheduled_date).toLocaleDateString('es-CO')}
                                        </span>
                                    </div>
                                )}
                                {record.completed_date && (
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                                        <span className="font-medium">
                                            Completado: {new Date(record.completed_date).toLocaleDateString('es-CO')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
