'use client';

import { useState, useRef } from 'react';
import { Calendar, Flag, User as UserIcon, Layers } from 'lucide-react';
import { Task, TaskStatus } from '../types';

interface KanbanBoardProps {
    tasks: Task[];
    onStatusChange: (task: Task, newStatus: string) => void;
    onEdit: (task: Task) => void;
}

interface Column {
    status: TaskStatus;
    label: string;
    color: {
        header: string;
        dot: string;
        count: string;
        dropActive: string;
        border: string;
    };
}

const COLUMNS: Column[] = [
    {
        status: 'Pendiente',
        label: 'Pendiente',
        color: {
            header: 'text-slate-600 dark:text-slate-300',
            dot: 'bg-slate-400',
            count: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
            dropActive: 'bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600',
            border: 'border-slate-200 dark:border-slate-700/60',
        },
    },
    {
        status: 'En Progreso',
        label: 'En Progreso',
        color: {
            header: 'text-blue-600 dark:text-blue-400',
            dot: 'bg-blue-500',
            count: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
            dropActive: 'bg-blue-50/60 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600',
            border: 'border-blue-200 dark:border-blue-800/60',
        },
    },
    {
        status: 'Revisión',
        label: 'Revisión',
        color: {
            header: 'text-amber-600 dark:text-amber-400',
            dot: 'bg-amber-500',
            count: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
            dropActive: 'bg-amber-50/60 dark:bg-amber-900/20 border-amber-400 dark:border-amber-600',
            border: 'border-amber-200 dark:border-amber-800/60',
        },
    },
    {
        status: 'Completado',
        label: 'Completado',
        color: {
            header: 'text-emerald-600 dark:text-emerald-400',
            dot: 'bg-emerald-500',
            count: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
            dropActive: 'bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-600',
            border: 'border-emerald-200 dark:border-emerald-800/60',
        },
    },
];

const PRIORITY_BADGE: Record<string, string> = {
    Alta: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    Media: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    Baja: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
};

// ─── Drag state shared via ref ───────────────────────────────────────────────
interface DragState {
    task: Task | null;
}

// ─── KanbanCard ──────────────────────────────────────────────────────────────

interface KanbanCardProps {
    task: Task;
    onEdit: (task: Task) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, task: Task) => void;
}

function KanbanCard({ task, onEdit, onDragStart }: KanbanCardProps) {
    const isOverdue =
        task.end_date &&
        new Date(task.end_date) < new Date() &&
        task.status !== 'Completado';

    const formattedDate = task.end_date
        ? new Date(task.end_date).toLocaleDateString('es-CO', {
              month: 'short',
              day: 'numeric',
          })
        : null;

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task)}
            onClick={() => onEdit(task)}
            role="button"
            tabIndex={0}
            aria-label={`Tarea: ${task.title}. Prioridad: ${task.priority}. Haz clic para editar o arrastra para mover.`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onEdit(task);
                }
            }}
            className={`
                group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/8
                rounded-2xl p-4 shadow-sm cursor-grab active:cursor-grabbing
                hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-white/15
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                transition-all duration-200 select-none
                ${task.status === 'Completado' ? 'opacity-70' : ''}
            `}
        >
            {/* Title */}
            <h4
                className={`text-sm font-bold leading-snug tracking-tight mb-3 transition-colors group-hover:text-primary ${
                    task.status === 'Completado'
                        ? 'line-through text-muted-foreground/50'
                        : 'text-foreground'
                }`}
            >
                {task.title}
            </h4>

            {/* Project */}
            {task.project?.name && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-3 truncate">
                    {task.project.name}
                </p>
            )}

            {/* Priority badge */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
                <span
                    className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                        PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE['Baja']
                    }`}
                >
                    <Flag className="w-2.5 h-2.5 fill-current" aria-hidden="true" />
                    {task.priority}
                </span>
            </div>

            {/* Footer: assignee + date */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                {/* Assignee */}
                <div className="flex items-center gap-2 min-w-0">
                    <div
                        className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0"
                        aria-hidden="true"
                    >
                        <UserIcon className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight truncate max-w-[80px]">
                        {task.assignee?.full_name?.split(' ')[0] ?? 'Sin asignar'}
                    </span>
                </div>

                {/* Due date */}
                {formattedDate && (
                    <div
                        className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg ${
                            isOverdue
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
                                : 'bg-slate-100 dark:bg-white/5 text-muted-foreground'
                        }`}
                    >
                        <Calendar className="w-2.5 h-2.5" aria-hidden="true" />
                        {formattedDate}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

interface KanbanColumnProps {
    column: Column;
    tasks: Task[];
    onEdit: (task: Task) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, task: Task) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    isDragOver: boolean;
    compact?: boolean;
}

function KanbanColumn({
    column,
    tasks,
    onEdit,
    onDragStart,
    onDrop,
    onDragOver,
    onDragLeave,
    isDragOver,
    compact = false,
}: KanbanColumnProps) {
    return (
        <div className={`flex flex-col ${compact ? 'min-w-[200px]' : 'min-w-[260px]'} flex-1`}>
            {/* Column header */}
            <div
                className="flex items-center gap-2 px-1 mb-3"
                aria-label={`Columna ${column.label}`}
            >
                <span
                    className={`w-2.5 h-2.5 rounded-full ${column.color.dot} shrink-0`}
                    aria-hidden="true"
                />
                <h3 className={`text-sm font-black uppercase tracking-widest ${column.color.header}`}>
                    {column.label}
                </h3>
                <span
                    className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full ${column.color.count}`}
                    aria-label={`${tasks.length} tareas`}
                >
                    {tasks.length}
                </span>
            </div>

            {/* Drop zone */}
            <div
                role="region"
                aria-label={`Zona de destino: ${column.label}`}
                onDrop={(e) => onDrop(e, column.status)}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`
                    flex-1 ${compact ? 'min-h-[160px]' : 'min-h-[500px]'} rounded-2xl border-2 border-dashed p-3
                    flex flex-col gap-3 overflow-y-auto
                    transition-all duration-200
                    ${
                        isDragOver
                            ? `${column.color.dropActive} border-solid scale-[1.01]`
                            : `border-transparent bg-slate-50/50 dark:bg-white/[0.02]`
                    }
                `}
            >
                {tasks.length === 0 && (
                    <div
                        className="flex-1 flex items-center justify-center"
                        aria-label="Columna vacía"
                    >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">
                            Sin tareas
                        </p>
                    </div>
                )}

                {tasks.map((task) => (
                    <KanbanCard
                        key={task.id}
                        task={task}
                        onEdit={onEdit}
                        onDragStart={onDragStart}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Swimlane row ─────────────────────────────────────────────────────────────

interface SwimlaneRowProps {
    assigneeName: string;
    assigneeInitials: string;
    tasks: Task[];
    dragOverKey: string | null;
    onEdit: (task: Task) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, task: Task) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, status: TaskStatus, swimlaneKey: string) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>, status: TaskStatus, swimlaneKey: string) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    swimlaneKey: string;
}

function SwimlaneRow({
    assigneeName,
    assigneeInitials,
    tasks,
    dragOverKey,
    onEdit,
    onDragStart,
    onDrop,
    onDragOver,
    onDragLeave,
    swimlaneKey,
}: SwimlaneRowProps) {
    const tasksByStatus = COLUMNS.reduce<Record<TaskStatus, Task[]>>(
        (acc, col) => {
            acc[col.status] = tasks.filter((t) => t.status === col.status);
            return acc;
        },
        { Pendiente: [], 'En Progreso': [], Revisión: [], Completado: [] }
    );

    return (
        <div className="mb-6">
            {/* Swimlane header */}
            <div className="flex items-center gap-3 mb-3 px-1">
                <div
                    className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"
                    aria-hidden="true"
                >
                    <span className="text-[10px] font-black text-primary uppercase">
                        {assigneeInitials}
                    </span>
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest truncate">
                        {assigneeName}
                    </h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground shrink-0">
                        {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}
                    </span>
                </div>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
            </div>

            {/* Status columns inside this swimlane */}
            <div className="flex gap-4 min-w-max">
                {COLUMNS.map((column) => {
                    const dropKey = `${swimlaneKey}-${column.status}`;
                    return (
                        <KanbanColumn
                            key={column.status}
                            column={column}
                            tasks={tasksByStatus[column.status]}
                            onEdit={onEdit}
                            onDragStart={onDragStart}
                            onDrop={(e) => onDrop(e, column.status, swimlaneKey)}
                            onDragOver={(e) => onDragOver(e, column.status, swimlaneKey)}
                            onDragLeave={onDragLeave}
                            isDragOver={dragOverKey === dropKey}
                            compact
                        />
                    );
                })}
            </div>
        </div>
    );
}

// ─── KanbanBoard (main export) ────────────────────────────────────────────────

export function KanbanBoard({ tasks, onStatusChange, onEdit }: KanbanBoardProps) {
    const [showSwimlanes, setShowSwimlanes] = useState(false);
    const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
    const [dragOverSwimKey, setDragOverSwimKey] = useState<string | null>(null);
    const draggingTask = useRef<DragState>({ task: null });

    // ── Flat board helpers ──────────────────────────────────────────────────
    const tasksByStatus = COLUMNS.reduce<Record<TaskStatus, Task[]>>(
        (acc, col) => {
            acc[col.status] = tasks.filter((t) => t.status === col.status);
            return acc;
        },
        { Pendiente: [], 'En Progreso': [], Revisión: [], Completado: [] }
    );

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
        draggingTask.current.task = task;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id);
    };

    // Flat board drag handlers
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(status);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverColumn(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
        e.preventDefault();
        setDragOverColumn(null);
        const task = draggingTask.current.task;
        draggingTask.current.task = null;
        if (!task || task.status === status) return;
        onStatusChange(task, status);
    };

    // Swimlane drag handlers
    const handleSwimDragOver = (
        e: React.DragEvent<HTMLDivElement>,
        status: TaskStatus,
        swimKey: string
    ) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverSwimKey(`${swimKey}-${status}`);
    };

    const handleSwimDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverSwimKey(null);
        }
    };

    const handleSwimDrop = (
        e: React.DragEvent<HTMLDivElement>,
        status: TaskStatus,
        _swimKey: string
    ) => {
        e.preventDefault();
        setDragOverSwimKey(null);
        const task = draggingTask.current.task;
        draggingTask.current.task = null;
        if (!task || task.status === status) return;
        onStatusChange(task, status);
    };

    // ── Swimlane grouping ───────────────────────────────────────────────────
    type SwimlaneGroup = { key: string; name: string; initials: string; tasks: Task[] };

    const swimlaneGroups: SwimlaneGroup[] = (() => {
        const map = new Map<string, SwimlaneGroup>();

        tasks.forEach((task) => {
            const key = task.assigned_to ?? '__unassigned__';
            const name = task.assignee?.full_name ?? 'Sin Asignar';
            const initials =
                key === '__unassigned__'
                    ? '?'
                    : name
                          .split(' ')
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase();

            if (!map.has(key)) {
                map.set(key, { key, name, initials, tasks: [] });
            }
            map.get(key)!.tasks.push(task);
        });

        // Sort: assigned users first alphabetically, unassigned last
        return Array.from(map.values()).sort((a, b) => {
            if (a.key === '__unassigned__') return 1;
            if (b.key === '__unassigned__') return -1;
            return a.name.localeCompare(b.name);
        });
    })();

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <section aria-label="Tablero Kanban de tareas" className="w-full">
            {/* Toolbar */}
            <div className="flex items-center justify-end mb-4 px-1">
                <button
                    type="button"
                    onClick={() => setShowSwimlanes((v) => !v)}
                    aria-pressed={showSwimlanes ? 'true' : 'false'}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${
                        showSwimlanes
                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                    <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                    Agrupar por Responsable
                </button>
            </div>

            {/* ── Flat board ─────────────────────────────────────────────── */}
            {!showSwimlanes && (
                <div className="overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-max px-1 py-1">
                        {COLUMNS.map((column) => (
                            <KanbanColumn
                                key={column.status}
                                column={column}
                                tasks={tasksByStatus[column.status]}
                                onEdit={onEdit}
                                onDragStart={handleDragStart}
                                onDrop={handleDrop}
                                onDragOver={(e) => handleDragOver(e, column.status)}
                                onDragLeave={handleDragLeave}
                                isDragOver={dragOverColumn === column.status}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Swimlane view ───────────────────────────────────────────── */}
            {showSwimlanes && (
                <div className="overflow-x-auto pb-4">
                    {swimlaneGroups.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-12">
                            No hay tareas para mostrar.
                        </p>
                    ) : (
                        <div className="min-w-max px-1 py-1 space-y-2">
                            {swimlaneGroups.map((group) => (
                                <SwimlaneRow
                                    key={group.key}
                                    swimlaneKey={group.key}
                                    assigneeName={group.name}
                                    assigneeInitials={group.initials}
                                    tasks={group.tasks}
                                    dragOverKey={dragOverSwimKey}
                                    onEdit={onEdit}
                                    onDragStart={handleDragStart}
                                    onDrop={handleSwimDrop}
                                    onDragOver={handleSwimDragOver}
                                    onDragLeave={handleSwimDragLeave}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
