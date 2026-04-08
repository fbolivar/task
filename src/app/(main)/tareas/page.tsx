'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { TaskHeader } from '@/features/tasks/components/TaskHeader';
import { TaskCard } from '@/features/tasks/components/TaskCard';
import { TaskModal } from '@/features/tasks/components/TaskModal';
import { BulkActionBar } from '@/features/tasks/components/BulkActionBar';
import { KanbanBoard } from '@/features/tasks/components/KanbanBoard';
import { CalendarView } from '@/features/tasks/components/CalendarView';
import { Task, TaskFormData } from '@/features/tasks/types';
import { useToast } from '@/shared/components/Toast';
import { Loader2, CheckSquare, Plus, Sparkles, LayoutGrid, Columns, Calendar, List, ChevronUp, ChevronDown } from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { createClient } from '@/lib/supabase/client';

interface ProjectOption {
    id: string;
    name: string;
}

// ---------------------------------------------------------------------------
// Compact table view helpers
// ---------------------------------------------------------------------------

const STATUS_DOT: Record<string, string> = {
    'Pendiente':    'bg-slate-400',
    'En Progreso':  'bg-blue-500',
    'Revisión':     'bg-amber-500',
    'Completado':   'bg-emerald-500',
};

const STATUS_LABEL: Record<string, string> = {
    'Pendiente':   'text-muted-foreground',
    'En Progreso': 'text-blue-600 dark:text-blue-400',
    'Revisión':    'text-amber-600 dark:text-amber-400',
    'Completado':  'text-emerald-600 dark:text-emerald-400',
};

const PRIORITY_DOT: Record<string, string> = {
    'Alta':  'bg-orange-500',
    'Media': 'bg-blue-500',
    'Baja':  'bg-slate-300',
};

const PRIORITY_LABEL: Record<string, string> = {
    'Alta':  'text-orange-600 dark:text-orange-400',
    'Media': 'text-blue-600 dark:text-blue-400',
    'Baja':  'text-muted-foreground',
};

interface TableViewProps {
    tasks: Task[];
    sortCol: string;
    sortAsc: boolean;
    onSort: (col: string) => void;
    onEdit: (task: Task) => void;
}

function SortIcon({ col, sortCol, sortAsc }: { col: string; sortCol: string; sortAsc: boolean }) {
    if (sortCol !== col) {
        return <ChevronUp className="w-3 h-3 opacity-20" aria-hidden="true" />;
    }
    return sortAsc
        ? <ChevronUp className="w-3 h-3 text-primary" aria-hidden="true" />
        : <ChevronDown className="w-3 h-3 text-primary" aria-hidden="true" />;
}

function TableView({ tasks, sortCol, sortAsc, onSort, onEdit }: TableViewProps) {
    const columns: { key: string; label: string; className?: string }[] = [
        { key: 'title',           label: 'Titulo',       className: 'min-w-[180px]' },
        { key: 'project',         label: 'Proyecto',     className: 'min-w-[120px]' },
        { key: 'status',          label: 'Estado',       className: 'w-32' },
        { key: 'priority',        label: 'Prioridad',    className: 'w-28' },
        { key: 'assignee',        label: 'Responsable',  className: 'min-w-[120px]' },
        { key: 'end_date',        label: 'Fecha limite', className: 'w-32' },
        { key: 'estimated_hours', label: 'Horas',        className: 'w-20 text-right' },
    ];

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm">
                No hay tareas para mostrar.
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm animate-reveal">
            <div className="overflow-x-auto">
                <table className="w-full text-sm" role="grid" aria-label="Tabla de tareas">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-white/10">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    scope="col"
                                    className={`px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground select-none ${col.className ?? ''}`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => onSort(col.key)}
                                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                                        aria-label={`Ordenar por ${col.label}`}
                                    >
                                        {col.label}
                                        <SortIcon col={col.key} sortCol={sortCol} sortAsc={sortAsc} />
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map((task, idx) => {
                            const isOverdue = task.end_date && new Date(task.end_date) < new Date() && task.status !== 'Completado';
                            return (
                                <tr
                                    key={task.id}
                                    onClick={() => onEdit(task)}
                                    tabIndex={0}
                                    role="row"
                                    aria-label={`Editar tarea: ${task.title}`}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onEdit(task); }}
                                    className={`border-b border-slate-100 dark:border-white/5 cursor-pointer transition-colors duration-100
                                        hover:bg-primary/5 focus:outline-none focus:bg-primary/5
                                        ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}
                                >
                                    {/* Title */}
                                    <td className="px-4 py-2 max-w-xs">
                                        <span
                                            className={`font-medium line-clamp-1 ${task.status === 'Completado' ? 'line-through text-muted-foreground/60' : 'text-foreground'}`}
                                            title={task.title}
                                        >
                                            {task.title}
                                        </span>
                                    </td>

                                    {/* Project */}
                                    <td className="px-4 py-2">
                                        <span className="text-muted-foreground truncate block max-w-[140px]" title={task.project?.name}>
                                            {task.project?.name ?? <span className="opacity-30">—</span>}
                                        </span>
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-2">
                                        <span className={`flex items-center gap-1.5 font-medium ${STATUS_LABEL[task.status] ?? 'text-muted-foreground'}`}>
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[task.status] ?? 'bg-slate-300'}`} aria-hidden="true" />
                                            {task.status}
                                        </span>
                                    </td>

                                    {/* Priority */}
                                    <td className="px-4 py-2">
                                        <span className={`flex items-center gap-1.5 font-medium ${PRIORITY_LABEL[task.priority] ?? 'text-muted-foreground'}`}>
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] ?? 'bg-slate-300'}`} aria-hidden="true" />
                                            {task.priority}
                                        </span>
                                    </td>

                                    {/* Assignee */}
                                    <td className="px-4 py-2">
                                        <span className="text-muted-foreground truncate block max-w-[140px]" title={task.assignee?.full_name}>
                                            {task.assignee?.full_name ?? <span className="opacity-30">—</span>}
                                        </span>
                                    </td>

                                    {/* Due date */}
                                    <td className="px-4 py-2">
                                        {task.end_date ? (
                                            <span className={`font-mono text-xs ${isOverdue ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                                                {new Date(task.end_date + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground/30">—</span>
                                        )}
                                    </td>

                                    {/* Hours */}
                                    <td className="px-4 py-2 text-right">
                                        <span className="text-muted-foreground font-mono text-xs">
                                            {task.estimated_hours > 0 ? `${task.estimated_hours}h` : <span className="opacity-30">—</span>}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Row count footer */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    {tasks.length} tarea{tasks.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground italic">
                    Clic en una fila para editar
                </p>
            </div>
        </div>
    );
}

export default function TareasPage() {
    const { t } = useSettings();
    const { toast } = useToast();
    const { tasks, loading, createTask, updateTask, archiveTask } = useTasks();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [projectFilter, setProjectFilter] = useState('all');
    const [subStatusFilter, setSubStatusFilter] = useState('all');
    const [sortAsc, setSortAsc] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'kanban' | 'calendar' | 'table'>('grid');
    const [tableSort, setTableSort] = useState<{ col: string; asc: boolean }>({ col: 'end_date', asc: true });
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [usersList, setUsersList] = useState<{ id: string; full_name: string }[]>([]);

    useEffect(() => {
        const supabase = createClient();

        supabase
            .from('projects')
            .select('id, name')
            .order('name')
            .then(({ data }: { data: ProjectOption[] | null }) => {
                if (data) setProjects(data);
            });

        supabase
            .from('profiles')
            .select('id, full_name')
            .eq('is_active', true)
            .order('full_name')
            .then(({ data }: { data: { id: string; full_name: string }[] | null }) => {
                if (data) setUsersList(data);
            });
    }, []);

    const filteredTasks = useMemo(() => {
        const filtered = tasks
            .filter(task => !task.archived)
            .filter(task => {
                const matchesSearch =
                    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (task.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                    (task.project?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                    (task.assignee?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

                const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
                const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
                const matchesProject = projectFilter === 'all' || task.project_id === projectFilter;
                const matchesSubStatus = subStatusFilter === 'all' || task.sub_status === subStatusFilter;

                return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesSubStatus;
            });

        return filtered.sort((a, b) => {
            const aDate = a.end_date ? new Date(a.end_date).getTime() : null;
            const bDate = b.end_date ? new Date(b.end_date).getTime() : null;

            if (aDate === null && bDate === null) return 0;
            if (aDate === null) return 1;
            if (bDate === null) return -1;

            return sortAsc ? aDate - bDate : bDate - aDate;
        });
    }, [tasks, searchQuery, statusFilter, priorityFilter, projectFilter, subStatusFilter, sortAsc]);

    const handleOpenCreateModal = () => {
        setEditingTask(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (task: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleSave = async (data: TaskFormData) => {
        if (editingTask) {
            await updateTask(editingTask.id, data);
        } else {
            await createTask(data);
        }
    };

    const handleArchive = async (id: string) => {
        if (window.confirm('¿Estás seguro de que deseas archivar esta tarea?')) {
            await archiveTask(id);
        }
    };

    const handleStatusChange = async (task: Task, newStatus: string) => {
        await updateTask(task.id, { status: newStatus as any });
    };

    const handleCloneTask = useCallback(async (task: Task) => {
        const cloneData: TaskFormData = {
            project_id: task.project_id,
            title: `[COPIA] ${task.title}`,
            notes: task.notes,
            status: 'Pendiente',
            sub_status: task.sub_status,
            priority: task.priority,
            end_date: task.end_date,
            assigned_to: task.assigned_to,
            evidence_link: task.evidence_link,
            estimated_hours: task.estimated_hours,
            actual_hours: 0,
        };
        await createTask(cloneData);
        toast(`Tarea duplicada: "${cloneData.title}"`, 'success');
    }, [createTask, toast]);

    const handleToggleSelect = useCallback((id: string) => {
        setSelectedTasks(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const handleClearSelection = useCallback(() => {
        setSelectedTasks(new Set());
    }, []);

    const handleBulkStatusChange = useCallback(async (status: string) => {
        const count = selectedTasks.size;
        await Promise.all(
            Array.from(selectedTasks).map(id => updateTask(id, { status: status as any }))
        );
        setSelectedTasks(new Set());
        toast(`Estado actualizado en ${count} tarea${count !== 1 ? 's' : ''}`, 'success');
    }, [selectedTasks, updateTask, toast]);

    const handleBulkPriorityChange = useCallback(async (priority: string) => {
        const count = selectedTasks.size;
        await Promise.all(
            Array.from(selectedTasks).map(id => updateTask(id, { priority: priority as any }))
        );
        setSelectedTasks(new Set());
        toast(`Prioridad actualizada en ${count} tarea${count !== 1 ? 's' : ''}`, 'success');
    }, [selectedTasks, updateTask, toast]);

    const handleBulkArchive = useCallback(async () => {
        const count = selectedTasks.size;
        if (!window.confirm(`¿Estás seguro de que deseas archivar ${count} tarea${count !== 1 ? 's' : ''}?`)) return;
        await Promise.all(
            Array.from(selectedTasks).map(id => archiveTask(id))
        );
        setSelectedTasks(new Set());
        toast(`${count} tarea${count !== 1 ? 's archivadas' : ' archivada'}`, 'success');
    }, [selectedTasks, archiveTask, toast]);

    const handleBulkAssign = useCallback(async (userId: string) => {
        await Promise.all(
            Array.from(selectedTasks).map(id => updateTask(id, { assigned_to: userId }))
        );
        setSelectedTasks(new Set());
    }, [selectedTasks, updateTask]);

    const handleTableSort = useCallback((col: string) => {
        setTableSort(prev => prev.col === col ? { col, asc: !prev.asc } : { col, asc: true });
    }, []);

    const tableSortedTasks = useMemo(() => {
        if (viewMode !== 'table') return filteredTasks;
        return [...filteredTasks].sort((a, b) => {
            let valA: string | number | null = null;
            let valB: string | number | null = null;

            switch (tableSort.col) {
                case 'title':
                    valA = a.title.toLowerCase();
                    valB = b.title.toLowerCase();
                    break;
                case 'project':
                    valA = (a.project?.name ?? '').toLowerCase();
                    valB = (b.project?.name ?? '').toLowerCase();
                    break;
                case 'status':
                    valA = a.status;
                    valB = b.status;
                    break;
                case 'priority': {
                    const order = { Alta: 0, Media: 1, Baja: 2 } as const;
                    valA = order[a.priority as keyof typeof order] ?? 99;
                    valB = order[b.priority as keyof typeof order] ?? 99;
                    break;
                }
                case 'assignee':
                    valA = (a.assignee?.full_name ?? '').toLowerCase();
                    valB = (b.assignee?.full_name ?? '').toLowerCase();
                    break;
                case 'end_date':
                    valA = a.end_date ?? '';
                    valB = b.end_date ?? '';
                    break;
                case 'estimated_hours':
                    valA = a.estimated_hours ?? 0;
                    valB = b.estimated_hours ?? 0;
                    break;
                default:
                    return 0;
            }

            if (valA === null || valA === '') return 1;
            if (valB === null || valB === '') return -1;
            if (valA < valB) return tableSort.asc ? -1 : 1;
            if (valA > valB) return tableSort.asc ? 1 : -1;
            return 0;
        });
    }, [filteredTasks, tableSort, viewMode]);

    const handleExport = useCallback(() => {
        const headers = ['Título', 'Proyecto', 'Estado', 'Prioridad', 'Sub-estado', 'Responsable', 'Fecha límite', 'Horas estimadas', 'Horas reales'];

        const rows = filteredTasks.map(task => [
            `"${(task.title ?? '').replace(/"/g, '""')}"`,
            `"${(task.project?.name ?? '').replace(/"/g, '""')}"`,
            task.status,
            task.priority,
            task.sub_status,
            `"${(task.assignee?.full_name ?? '').replace(/"/g, '""')}"`,
            task.end_date ?? '',
            String(task.estimated_hours ?? 0),
            String(task.actual_hours ?? 0),
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tareas-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast(`${filteredTasks.length} tarea${filteredTasks.length !== 1 ? 's exportadas' : ' exportada'} a CSV`, 'success');
    }, [filteredTasks, toast]);

    if (loading && tasks.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20 animate-reveal">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <Loader2 className="relative w-16 h-16 text-primary animate-spin" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70 mb-2">Sincronizando Workboard</p>
                <p className="text-muted-foreground font-black text-sm uppercase tracking-widest">{t('general.loading')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-20">
            <TaskHeader
                onSearch={setSearchQuery}
                onNewTask={handleOpenCreateModal}
                onStatusFilter={setStatusFilter}
                onSort={() => setSortAsc(!sortAsc)}
                onPriorityFilter={setPriorityFilter}
                totalTasks={tasks.length}
                currentStatus={statusFilter}
                currentPriority={priorityFilter}
                projects={projects}
                onProjectFilter={setProjectFilter}
                onSubStatusFilter={setSubStatusFilter}
                currentProject={projectFilter}
                currentSubStatus={subStatusFilter}
                onExport={handleExport}
            />

            {/* View mode toggle */}
            <div className="flex items-center justify-end gap-2 mb-4">
                <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-label="Vista cuadrícula"
                    aria-pressed={viewMode === 'grid' ? true : false}
                    className={`p-2 rounded-xl border transition-all duration-200 ${
                        viewMode === 'grid'
                            ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-muted-foreground hover:border-primary/50 hover:text-primary'
                    }`}
                >
                    <LayoutGrid className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    onClick={() => setViewMode('kanban')}
                    aria-label="Vista kanban"
                    aria-pressed={viewMode === 'kanban' ? true : false}
                    className={`p-2 rounded-xl border transition-all duration-200 ${
                        viewMode === 'kanban'
                            ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-muted-foreground hover:border-primary/50 hover:text-primary'
                    }`}
                >
                    <Columns className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    onClick={() => setViewMode('calendar')}
                    aria-label="Vista calendario"
                    aria-pressed={viewMode === 'calendar' ? true : false}
                    className={`p-2 rounded-xl border transition-all duration-200 ${
                        viewMode === 'calendar'
                            ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-muted-foreground hover:border-primary/50 hover:text-primary'
                    }`}
                >
                    <Calendar className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    aria-label="Vista tabla"
                    aria-pressed={viewMode === 'table' ? true : false}
                    className={`p-2 rounded-xl border transition-all duration-200 ${
                        viewMode === 'table'
                            ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-muted-foreground hover:border-primary/50 hover:text-primary'
                    }`}
                >
                    <List className="w-4 h-4" aria-hidden="true" />
                </button>
            </div>

            {viewMode === 'table' ? (
                <TableView
                    tasks={tableSortedTasks}
                    sortCol={tableSort.col}
                    sortAsc={tableSort.asc}
                    onSort={handleTableSort}
                    onEdit={handleOpenEditModal}
                />
            ) : viewMode === 'calendar' ? (
                <CalendarView
                    tasks={filteredTasks}
                    onEdit={handleOpenEditModal}
                />
            ) : viewMode === 'kanban' ? (
                <KanbanBoard
                    tasks={filteredTasks}
                    onStatusChange={handleStatusChange}
                    onEdit={handleOpenEditModal}
                />
            ) : filteredTasks.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-reveal">
                    {filteredTasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onEdit={handleOpenEditModal}
                            onArchive={handleArchive}
                            onStatusChange={handleStatusChange}
                            onClone={handleCloneTask}
                            isSelected={selectedTasks.has(task.id)}
                            onToggleSelect={handleToggleSelect}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 card-premium border-dashed border-2 border-slate-200 dark:border-white/10 group">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-110 group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative w-24 h-24 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl border border-slate-100 dark:border-white/5">
                            <CheckSquare className="w-12 h-12 text-slate-300 group-hover:text-primary transition-colors duration-500" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Operation Intelligence</span>
                    </div>

                    <h3 className="text-3xl font-black text-foreground tracking-tight mb-3 transition-colors group-hover:text-primary">
                        {searchQuery || statusFilter !== 'all' ? 'Sin tareas detectadas' : 'Tu tablero esta vacio'}
                    </h3>

                    <p className="text-muted-foreground font-medium text-center max-w-sm mb-10 leading-relaxed">
                        {searchQuery || statusFilter !== 'all'
                            ? t('tasks.emptyDesc')
                            : 'Crea tu primera tarea para empezar a organizar tu trabajo. Prueba con algo simple como "Revisar correos del dia".'}
                    </p>

                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="btn-primary group/btn"
                    >
                        <Plus className="w-5 h-5 group-hover/btn:rotate-90 transition-transform" />
                        <span className="font-bold tracking-wide">
                            {searchQuery || statusFilter !== 'all' ? t('tasks.createFirst') : 'Crear mi primera tarea'}
                        </span>
                    </button>
                </div>
            )}

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                task={editingTask}
            />

            <BulkActionBar
                selectedCount={selectedTasks.size}
                onChangeStatus={handleBulkStatusChange}
                onChangePriority={handleBulkPriorityChange}
                onArchive={handleBulkArchive}
                onClearSelection={handleClearSelection}
                onAssign={handleBulkAssign}
                users={usersList}
            />
        </div>
    );
}
