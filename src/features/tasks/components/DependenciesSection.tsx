'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link, Unlink, Plus, X, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TaskStatus } from '../types';

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

type DependencyType = 'blocks' | 'related';

interface TaskDependency {
    id: string;
    task_id: string;
    depends_on_task_id: string;
    dependency_type: DependencyType;
    created_at: string;
}

interface TaskSummary {
    id: string;
    title: string;
    status: TaskStatus;
    project_id: string | null;
}

interface ResolvedDependency {
    dependencyId: string;
    task: TaskSummary;
    dependency_type: DependencyType;
}

export interface DependenciesSectionProps {
    taskId: string;
    projectId: string | null;
}

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

const STATUS_STYLES: Record<TaskStatus, string> = {
    'Pendiente': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    'En Progreso': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'Revisión': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'Completado': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

function StatusBadge({ status }: { status: TaskStatus }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${STATUS_STYLES[status] ?? STATUS_STYLES['Pendiente']}`}>
            {status}
        </span>
    );
}

// -------------------------------------------------------------------------
// DependencyRow
// -------------------------------------------------------------------------

interface DependencyRowProps {
    dep: ResolvedDependency;
    isBlocked: boolean;
    onRemove: (depId: string) => void;
    removing: boolean;
}

function DependencyRow({ dep, isBlocked, onRemove, removing }: DependencyRowProps) {
    const rowBg = isBlocked
        ? 'bg-red-50/60 dark:bg-red-950/30 border-red-200/70 dark:border-red-800/50'
        : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/40';

    return (
        <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${rowBg} group transition-colors`}
            role="listitem"
        >
            <ArrowRight
                className={`w-3.5 h-3.5 flex-shrink-0 ${isBlocked ? 'text-red-500' : 'text-amber-500'}`}
                aria-hidden="true"
            />
            <span className="flex-1 text-sm font-medium text-foreground truncate" title={dep.task.title}>
                {dep.task.title}
            </span>
            <StatusBadge status={dep.task.status} />
            <button
                type="button"
                onClick={() => onRemove(dep.dependencyId)}
                disabled={removing}
                aria-label={`Eliminar dependencia con "${dep.task.title}"`}
                className="flex-shrink-0 p-1 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
                {removing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <X className="w-3.5 h-3.5" />
                )}
            </button>
        </div>
    );
}

// -------------------------------------------------------------------------
// DependenciesSection
// -------------------------------------------------------------------------

export function DependenciesSection({ taskId, projectId }: DependenciesSectionProps) {
    const [blockedBy, setBlockedBy] = useState<ResolvedDependency[]>([]);
    const [blocks, setBlocks] = useState<ResolvedDependency[]>([]);
    const [availableTasks, setAvailableTasks] = useState<TaskSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Add-dependency form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const [selectedType, setSelectedType] = useState<DependencyType>('blocks');
    const [adding, setAdding] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);

    // -----------------------------------------------------------------------
    // Fetch
    // -----------------------------------------------------------------------

    const fetchDependencies = useCallback(async () => {
        setLoading(true);
        setError(null);
        const supabase = createClient();

        try {
            // 1. Load all dependency rows where this task is involved
            const { data: rawDeps, error: depsError } = await supabase
                .from('task_dependencies')
                .select('id, task_id, depends_on_task_id, dependency_type, created_at')
                .or(`task_id.eq.${taskId},depends_on_task_id.eq.${taskId}`);

            if (depsError) throw depsError;
            if (!rawDeps || rawDeps.length === 0) {
                setBlockedBy([]);
                setBlocks([]);
                return;
            }

            // 2. Collect unique related task IDs to fetch titles & statuses
            const relatedIds = new Set<string>();
            (rawDeps as TaskDependency[]).forEach((dep) => {
                if (dep.task_id !== taskId) relatedIds.add(dep.task_id);
                if (dep.depends_on_task_id !== taskId) relatedIds.add(dep.depends_on_task_id);
            });

            const { data: relatedTasks, error: tasksError } = await supabase
                .from('tasks')
                .select('id, title, status, project_id')
                .in('id', Array.from(relatedIds));

            if (tasksError) throw tasksError;

            const taskMap = new Map<string, TaskSummary>(
                (relatedTasks ?? []).map((t: TaskSummary) => [t.id, t])
            );

            // 3. Classify into blockedBy / blocks
            const newBlockedBy: ResolvedDependency[] = [];
            const newBlocks: ResolvedDependency[] = [];

            (rawDeps as TaskDependency[]).forEach((dep) => {
                // "Bloqueado por": task_id = this task, depends_on_task_id = other
                if (dep.task_id === taskId) {
                    const other = taskMap.get(dep.depends_on_task_id);
                    if (other) {
                        newBlockedBy.push({ dependencyId: dep.id, task: other, dependency_type: dep.dependency_type });
                    }
                }
                // "Bloquea a": depends_on_task_id = this task, task_id = other
                if (dep.depends_on_task_id === taskId) {
                    const other = taskMap.get(dep.task_id);
                    if (other) {
                        newBlocks.push({ dependencyId: dep.id, task: other, dependency_type: dep.dependency_type });
                    }
                }
            });

            setBlockedBy(newBlockedBy);
            setBlocks(newBlocks);
        } catch (err) {
            console.error('Error fetching dependencies:', err);
            setError('No se pudieron cargar las dependencias.');
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    const fetchAvailableTasks = useCallback(async () => {
        const supabase = createClient();
        let query = supabase
            .from('tasks')
            .select('id, title, status, project_id')
            .neq('id', taskId)
            .order('title');

        if (projectId) {
            query = query.eq('project_id', projectId);
        }

        const { data } = await query;
        setAvailableTasks((data ?? []) as TaskSummary[]);
    }, [taskId, projectId]);

    useEffect(() => {
        fetchDependencies();
    }, [fetchDependencies]);

    useEffect(() => {
        fetchAvailableTasks();
    }, [fetchAvailableTasks]);

    // -----------------------------------------------------------------------
    // Actions
    // -----------------------------------------------------------------------

    const handleAdd = async () => {
        if (!selectedTaskId) return;
        setAdding(true);

        const supabase = createClient();
        const { error: insertError } = await supabase
            .from('task_dependencies')
            .insert({
                task_id: taskId,
                depends_on_task_id: selectedTaskId,
                dependency_type: selectedType,
            });

        if (insertError) {
            console.error('Error adding dependency:', insertError);
        } else {
            setShowAddForm(false);
            setSelectedTaskId('');
            setSelectedType('blocks');
            await fetchDependencies();
        }

        setAdding(false);
    };

    const handleRemove = async (depId: string) => {
        setRemovingId(depId);
        const supabase = createClient();
        const { error: deleteError } = await supabase
            .from('task_dependencies')
            .delete()
            .eq('id', depId);

        if (deleteError) {
            console.error('Error removing dependency:', deleteError);
        } else {
            await fetchDependencies();
        }
        setRemovingId(null);
    };

    // -----------------------------------------------------------------------
    // Derived: filter already-linked tasks from dropdown
    // -----------------------------------------------------------------------
    const linkedIds = new Set([
        ...blockedBy.map((d) => d.task.id),
        ...blocks.map((d) => d.task.id),
    ]);
    const filteredAvailable = availableTasks.filter((t) => !linkedIds.has(t.id));

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <section
            aria-label="Dependencias de la tarea"
            className="flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800"
        >
            {/* Header */}
            <div className="px-4 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link className="w-4 h-4 text-primary" aria-hidden="true" />
                    <h4 className="text-sm font-bold text-foreground">Dependencias</h4>
                    {!loading && (
                        <span className="text-xs font-bold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full text-muted-foreground">
                            {blockedBy.length + blocks.length}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setShowAddForm((v) => !v)}
                    aria-expanded={showAddForm}
                    aria-label="Agregar dependencia"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    {showAddForm ? (
                        <X className="w-3.5 h-3.5" />
                    ) : (
                        <Plus className="w-3.5 h-3.5" />
                    )}
                    {showAddForm ? 'Cancelar' : 'Agregar'}
                </button>
            </div>

            {/* Body */}
            <div className="px-4 pb-4 flex flex-col gap-4">
                {/* Error state */}
                {error && (
                    <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800/50" role="alert">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        {error}
                    </div>
                )}

                {/* Loading skeleton */}
                {loading ? (
                    <div className="space-y-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-10 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* --- Bloqueado por --- */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                                <Unlink className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
                                <span className="text-[10px] font-black uppercase tracking-wider text-red-500">
                                    Bloqueado por
                                </span>
                            </div>
                            {blockedBy.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic pl-5">Sin bloqueos</p>
                            ) : (
                                <ul className="space-y-1.5" role="list" aria-label="Tareas que bloquean esta tarea">
                                    {blockedBy.map((dep) => (
                                        <li key={dep.dependencyId}>
                                            <DependencyRow
                                                dep={dep}
                                                isBlocked={true}
                                                onRemove={handleRemove}
                                                removing={removingId === dep.dependencyId}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* --- Bloquea a --- */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                                <Link className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">
                                    Bloquea a
                                </span>
                            </div>
                            {blocks.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic pl-5">No bloquea ninguna tarea</p>
                            ) : (
                                <ul className="space-y-1.5" role="list" aria-label="Tareas que esta tarea bloquea">
                                    {blocks.map((dep) => (
                                        <li key={dep.dependencyId}>
                                            <DependencyRow
                                                dep={dep}
                                                isBlocked={false}
                                                onRemove={handleRemove}
                                                removing={removingId === dep.dependencyId}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </>
                )}

                {/* --- Add Form --- */}
                {showAddForm && (
                    <div
                        className="flex flex-col gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-200"
                        role="form"
                        aria-label="Formulario de nueva dependencia"
                    >
                        <p className="text-[10px] font-black uppercase tracking-wider text-primary">
                            Nueva dependencia
                        </p>

                        {/* Task selector */}
                        <div className="flex flex-col gap-1">
                            <label htmlFor="dep-task-select" className="text-xs font-semibold text-muted-foreground">
                                Tarea
                            </label>
                            <select
                                id="dep-task-select"
                                value={selectedTaskId}
                                onChange={(e) => setSelectedTaskId(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-primary transition-colors"
                            >
                                <option value="">Seleccionar tarea...</option>
                                {filteredAvailable.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.title}
                                    </option>
                                ))}
                            </select>
                            {filteredAvailable.length === 0 && (
                                <p className="text-[10px] text-muted-foreground">
                                    No hay tareas disponibles{projectId ? ' en este proyecto' : ''}.
                                </p>
                            )}
                        </div>

                        {/* Type selector */}
                        <div className="flex flex-col gap-1">
                            <label htmlFor="dep-type-select" className="text-xs font-semibold text-muted-foreground">
                                Tipo de dependencia
                            </label>
                            <select
                                id="dep-type-select"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value as DependencyType)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-primary transition-colors"
                            >
                                <option value="blocks">Bloquea (esta tarea depende de la seleccionada)</option>
                                <option value="related">Relacionada</option>
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setSelectedTaskId('');
                                    setSelectedType('blocks');
                                }}
                                className="flex-1 px-3 py-2 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleAdd}
                                disabled={!selectedTaskId || adding}
                                className="flex-1 px-3 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                            >
                                {adding ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                                ) : (
                                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                                )}
                                {adding ? 'Guardando...' : 'Agregar'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
