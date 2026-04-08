'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    Calendar,
    Clock,
    User as UserIcon,
    Briefcase,
    Flag,
    ExternalLink,
    Repeat,
    CheckCircle2,
    Info,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Task, TaskStatus, TaskSubStatus, TaskPriority } from '@/features/tasks/types';
import { TrackingSection } from '@/features/tasks/components/TrackingSection';
import { CommentsSection } from '@/features/tasks/components/CommentsSection';
import { DependenciesSection } from '@/features/tasks/components/DependenciesSection';
import { ScheduleMeeting } from '@/shared/components/ScheduleMeeting';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Project {
    id: string;
    name: string;
    entity_id?: string;
}

interface UserOption {
    id: string;
    full_name: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusColor(status: TaskStatus): string {
    switch (status) {
        case 'Completado': return 'text-emerald-600 dark:text-emerald-400';
        case 'En Progreso': return 'text-blue-600 dark:text-blue-400';
        case 'Revisión': return 'text-amber-600 dark:text-amber-400';
        default: return 'text-slate-500 dark:text-slate-400';
    }
}

function priorityColor(priority: TaskPriority): string {
    switch (priority) {
        case 'Alta': return 'text-orange-600 dark:text-orange-400';
        case 'Media': return 'text-blue-600 dark:text-blue-400';
        default: return 'text-slate-500 dark:text-slate-400';
    }
}

function subStatusColor(sub: TaskSubStatus): string {
    switch (sub) {
        case 'Demorado': return 'text-red-600 dark:text-red-400';
        case 'En Riesgo': return 'text-amber-600 dark:text-amber-400';
        case 'Bloqueado': return 'text-rose-700 dark:text-rose-400';
        default: return 'text-emerald-600 dark:text-emerald-400';
    }
}

const RECURRENCE_LABELS: Record<string, string> = {
    daily: 'Diario',
    weekly: 'Semanal',
    biweekly: 'Quincenal',
    monthly: 'Mensual',
};

// ---------------------------------------------------------------------------
// SidebarField
// ---------------------------------------------------------------------------

interface SidebarFieldProps {
    label: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

function SidebarField({ label, icon, children }: SidebarFieldProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                {icon}
                {label}
            </label>
            {children}
        </div>
    );
}

// ---------------------------------------------------------------------------
// HoursBar
// ---------------------------------------------------------------------------

function HoursBar({ actual, estimated }: { actual: number; estimated: number }) {
    if (estimated <= 0) return null;
    const pct = Math.min((actual / estimated) * 100, 100);
    const over = actual > estimated;
    const warn = pct >= 80;
    const barColor = over ? 'bg-red-500' : warn ? 'bg-amber-500' : 'bg-emerald-500';
    const textColor = over ? 'text-red-500' : warn ? 'text-amber-500' : 'text-emerald-500';
    return (
        <div className="space-y-1 mt-1">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Progreso de horas</span>
                <span className={`text-[10px] font-black ${textColor}`}>
                    {actual}h / {estimated}h ({Math.round(pct)}%)
                </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface PageParams {
    id: string;
}

export default function TaskDetailPage({ params }: { params: Promise<PageParams> }) {
    const { id } = use(params);
    const router = useRouter();

    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<UserOption[]>([]);

    // Editable title / notes local state
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const titleRef = useRef<HTMLInputElement>(null);

    // ---------------------------------------------------------------------------
    // Fetch
    // ---------------------------------------------------------------------------

    const fetchTask = useCallback(async () => {
        setLoading(true);
        setError(null);
        const supabase = createClient();

        const { data, error: fetchError } = await supabase
            .from('tasks')
            .select('*, project:projects(id, name, entity_id), assignee:profiles!tasks_assigned_to_fkey(id, full_name)')
            .eq('id', id)
            .single();

        if (fetchError || !data) {
            setError('No se pudo cargar la tarea. Verifica que el ID sea correcto.');
            setLoading(false);
            return;
        }

        const taskData = data as unknown as Task;
        setTask(taskData);
        setTitle(taskData.title);
        setNotes(taskData.notes ?? '');
        setLoading(false);
    }, [id]);

    const fetchLists = useCallback(async () => {
        const supabase = createClient();
        const [projectsRes, usersRes] = await Promise.all([
            supabase.from('projects').select('id, name, entity_id').order('name'),
            supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name'),
        ]);
        if (projectsRes.data) setProjects(projectsRes.data as Project[]);
        if (usersRes.data) setUsers(usersRes.data as UserOption[]);
    }, []);

    useEffect(() => {
        fetchTask();
        fetchLists();
    }, [fetchTask, fetchLists]);

    // ---------------------------------------------------------------------------
    // Auto-save helpers
    // ---------------------------------------------------------------------------

    const saveField = useCallback(async (field: string, value: unknown) => {
        if (!task) return;
        const supabase = createClient();
        const { data, error: updateError } = await supabase
            .from('tasks')
            .update({ [field]: value })
            .eq('id', task.id)
            .select('*, project:projects(id, name, entity_id), assignee:profiles!tasks_assigned_to_fkey(id, full_name)')
            .single();

        if (!updateError && data) {
            const updated = data as unknown as Task;
            setTask(updated);
            setTitle(updated.title);
            setNotes(updated.notes ?? '');
        } else if (updateError) {
            console.error('Error saving field:', updateError);
        }
    }, [task]);

    const handleTitleBlur = () => {
        const trimmed = title.trim();
        if (trimmed && trimmed !== task?.title) {
            saveField('title', trimmed);
        } else {
            setTitle(task?.title ?? '');
        }
    };

    const handleNotesBlur = () => {
        if (notes !== (task?.notes ?? '')) {
            saveField('notes', notes || null);
        }
    };

    // ---------------------------------------------------------------------------
    // Loading / error states
    // ---------------------------------------------------------------------------

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Cargando tarea...</p>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="w-10 h-10 text-red-500" />
                <p className="text-sm font-bold text-foreground">{error ?? 'Tarea no encontrada'}</p>
                <button
                    type="button"
                    onClick={() => router.push('/tareas')}
                    className="btn-primary mt-2"
                >
                    Volver a Tareas
                </button>
            </div>
        );
    }

    const createdDate = new Date(task.created_at).toLocaleDateString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric',
    });

    return (
        <main className="max-w-7xl mx-auto pb-24 px-4 lg:px-0">
            {/* Back navigation */}
            <div className="pt-4 pb-6">
                <button
                    type="button"
                    onClick={() => router.push('/tareas')}
                    className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group"
                    aria-label="Volver a lista de tareas"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Volver a Tareas
                </button>
            </div>

            {/* Two-column layout */}
            <div className="flex flex-col lg:flex-row gap-8">

                {/* ----------------------------------------------------------------
                    LEFT COLUMN  (2/3)
                ---------------------------------------------------------------- */}
                <div className="flex-1 min-w-0 flex flex-col gap-8">

                    {/* Title */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground sr-only">
                            Título de la tarea
                        </label>
                        <input
                            ref={titleRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            className="w-full text-3xl font-black text-foreground bg-transparent border-b-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary focus:outline-none transition-colors pb-1 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                            placeholder="Sin título"
                            aria-label="Título de la tarea"
                        />
                    </div>

                    {/* Notes / Description */}
                    <section aria-label="Descripción y notas">
                        <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">Descripcion / Notas</h2>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            onBlur={handleNotesBlur}
                            rows={6}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:outline-none focus:border-primary transition-all text-sm leading-relaxed resize-y min-h-[120px]"
                            placeholder="Instrucciones, contexto o detalles de la tarea..."
                            aria-label="Notas de la tarea"
                        />
                    </section>

                    {/* Tracking */}
                    <section
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6"
                        aria-label="Bitacora de seguimiento"
                    >
                        <TrackingSection taskId={task.id} />
                    </section>

                    {/* Comments */}
                    <section aria-label="Comentarios">
                        <CommentsSection taskId={task.id} />
                    </section>

                    {/* Dependencies */}
                    <section aria-label="Dependencias">
                        <DependenciesSection taskId={task.id} projectId={task.project_id} />
                    </section>

                    {/* Meeting Scheduler */}
                    <section aria-label="Reuniones de seguimiento">
                        <ScheduleMeeting
                            entityType="task"
                            entityId={id}
                            entityTitle={task.title}
                        />
                    </section>
                </div>

                {/* ----------------------------------------------------------------
                    RIGHT SIDEBAR  (1/3)
                ---------------------------------------------------------------- */}
                <aside
                    className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-5"
                    aria-label="Detalles de la tarea"
                >
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5 flex flex-col gap-5">

                        {/* Status */}
                        <SidebarField
                            label="Estado"
                            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                            <select
                                value={task.status}
                                onChange={(e) => saveField('status', e.target.value)}
                                className={`w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-sm font-bold appearance-none ${statusColor(task.status)}`}
                                aria-label="Estado de la tarea"
                            >
                                <option value="Pendiente">Pendiente</option>
                                <option value="En Progreso">En Progreso</option>
                                <option value="Revisión">Revision</option>
                                <option value="Completado">Completado</option>
                            </select>
                        </SidebarField>

                        {/* Priority */}
                        <SidebarField
                            label="Prioridad"
                            icon={<Flag className="w-3.5 h-3.5" />}
                        >
                            <select
                                value={task.priority}
                                onChange={(e) => saveField('priority', e.target.value)}
                                className={`w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-sm font-bold appearance-none ${priorityColor(task.priority)}`}
                                aria-label="Prioridad de la tarea"
                            >
                                <option value="Baja">Baja</option>
                                <option value="Media">Media</option>
                                <option value="Alta">Alta</option>
                            </select>
                        </SidebarField>

                        {/* Sub-status */}
                        <SidebarField
                            label="Sub-estado / Riesgo"
                            icon={<AlertCircle className="w-3.5 h-3.5" />}
                        >
                            <select
                                value={task.sub_status}
                                onChange={(e) => saveField('sub_status', e.target.value)}
                                className={`w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-sm font-bold appearance-none ${subStatusColor(task.sub_status)}`}
                                aria-label="Sub-estado de la tarea"
                            >
                                <option value="En Tiempo">En Tiempo</option>
                                <option value="En Riesgo">En Riesgo</option>
                                <option value="Demorado">Demorado</option>
                                <option value="Bloqueado">Bloqueado</option>
                            </select>
                        </SidebarField>

                        <div className="border-t border-slate-100 dark:border-slate-800" />

                        {/* Assignee */}
                        <SidebarField
                            label="Responsable"
                            icon={<UserIcon className="w-3.5 h-3.5" />}
                        >
                            <select
                                value={task.assigned_to ?? ''}
                                onChange={(e) => saveField('assigned_to', e.target.value || null)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-sm font-medium appearance-none"
                                aria-label="Responsable de la tarea"
                            >
                                <option value="">Sin asignar</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>{u.full_name}</option>
                                ))}
                            </select>
                        </SidebarField>

                        {/* Project */}
                        <SidebarField
                            label="Proyecto"
                            icon={<Briefcase className="w-3.5 h-3.5" />}
                        >
                            <select
                                value={task.project_id ?? ''}
                                onChange={(e) => saveField('project_id', e.target.value || null)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-sm font-medium appearance-none"
                                aria-label="Proyecto de la tarea"
                            >
                                <option value="">Sin proyecto</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </SidebarField>

                        <div className="border-t border-slate-100 dark:border-slate-800" />

                        {/* Due date */}
                        <SidebarField
                            label="Fecha limite"
                            icon={<Calendar className="w-3.5 h-3.5" />}
                        >
                            <input
                                type="date"
                                value={task.end_date ?? ''}
                                onChange={(e) => saveField('end_date', e.target.value || null)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-sm font-medium"
                                aria-label="Fecha limite de la tarea"
                            />
                        </SidebarField>

                        {/* Hours */}
                        <SidebarField
                            label="Horas"
                            icon={<Clock className="w-3.5 h-3.5" />}
                        >
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground font-bold">Estimadas</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={task.estimated_hours ?? 0}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            setTask(prev => prev ? { ...prev, estimated_hours: val } : prev);
                                        }}
                                        onBlur={(e) => saveField('estimated_hours', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-sm font-medium"
                                        aria-label="Horas estimadas"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground font-bold">Reales</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={task.actual_hours ?? 0}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            setTask(prev => prev ? { ...prev, actual_hours: val } : prev);
                                        }}
                                        onBlur={(e) => saveField('actual_hours', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-sm font-medium"
                                        aria-label="Horas reales"
                                    />
                                </div>
                            </div>
                            <HoursBar actual={task.actual_hours ?? 0} estimated={task.estimated_hours ?? 0} />
                        </SidebarField>

                        {/* Evidence link */}
                        <SidebarField
                            label="Evidencia"
                            icon={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                            <div className="flex items-center gap-2">
                                <input
                                    type="url"
                                    value={task.evidence_link ?? ''}
                                    onChange={(e) => setTask(prev => prev ? { ...prev, evidence_link: e.target.value || null } : prev)}
                                    onBlur={(e) => saveField('evidence_link', e.target.value || null)}
                                    className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-sm font-medium"
                                    placeholder="https://..."
                                    aria-label="Enlace de evidencia"
                                />
                                {task.evidence_link && (
                                    <a
                                        href={task.evidence_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                        aria-label="Abrir enlace de evidencia"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </SidebarField>

                        {/* Recurrence info */}
                        {task.is_recurring && (
                            <>
                                <div className="border-t border-slate-100 dark:border-slate-800" />
                                <SidebarField
                                    label="Recurrencia"
                                    icon={<Repeat className="w-3.5 h-3.5 text-indigo-500" />}
                                >
                                    <div className="flex flex-col gap-1 px-3 py-2 rounded-xl border border-indigo-200/60 dark:border-indigo-800/40 bg-indigo-50/50 dark:bg-indigo-950/20">
                                        <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                                            {RECURRENCE_LABELS[task.recurrence_pattern ?? ''] ?? task.recurrence_pattern}
                                        </span>
                                        {task.recurrence_end_date && (
                                            <span className="text-xs text-muted-foreground">
                                                Hasta: {new Date(task.recurrence_end_date).toLocaleDateString('es-CO')}
                                            </span>
                                        )}
                                    </div>
                                </SidebarField>
                            </>
                        )}

                        <div className="border-t border-slate-100 dark:border-slate-800" />

                        {/* Created at */}
                        <SidebarField
                            label="Creado el"
                            icon={<Info className="w-3.5 h-3.5" />}
                        >
                            <span className="text-sm text-muted-foreground font-medium px-1">{createdDate}</span>
                        </SidebarField>
                    </div>
                </aside>
            </div>
        </main>
    );
}
