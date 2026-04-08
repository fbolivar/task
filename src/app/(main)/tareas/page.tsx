'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { TaskHeader } from '@/features/tasks/components/TaskHeader';
import { TaskCard } from '@/features/tasks/components/TaskCard';
import { TaskModal } from '@/features/tasks/components/TaskModal';
import { BulkActionBar } from '@/features/tasks/components/BulkActionBar';
import { KanbanBoard } from '@/features/tasks/components/KanbanBoard';
import { CalendarView } from '@/features/tasks/components/CalendarView';
import { Task, TaskFormData } from '@/features/tasks/types';
import { Loader2, CheckSquare, Plus, Sparkles, LayoutGrid, Columns, Calendar } from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';

export default function TareasPage() {
    const { t } = useSettings();
    const { tasks, loading, createTask, updateTask, archiveTask } = useTasks();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [sortAsc, setSortAsc] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'kanban' | 'calendar'>('grid');
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

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

                return matchesSearch && matchesStatus && matchesPriority;
            });

        return filtered.sort((a, b) => {
            const aDate = a.end_date ? new Date(a.end_date).getTime() : null;
            const bDate = b.end_date ? new Date(b.end_date).getTime() : null;

            if (aDate === null && bDate === null) return 0;
            if (aDate === null) return 1;
            if (bDate === null) return -1;

            return sortAsc ? aDate - bDate : bDate - aDate;
        });
    }, [tasks, searchQuery, statusFilter, priorityFilter, sortAsc]);

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
        await Promise.all(
            Array.from(selectedTasks).map(id => updateTask(id, { status: status as any }))
        );
        setSelectedTasks(new Set());
    }, [selectedTasks, updateTask]);

    const handleBulkPriorityChange = useCallback(async (priority: string) => {
        await Promise.all(
            Array.from(selectedTasks).map(id => updateTask(id, { priority: priority as any }))
        );
        setSelectedTasks(new Set());
    }, [selectedTasks, updateTask]);

    const handleBulkArchive = useCallback(async () => {
        if (!window.confirm(`¿Estás seguro de que deseas archivar ${selectedTasks.size} tarea${selectedTasks.size !== 1 ? 's' : ''}?`)) return;
        await Promise.all(
            Array.from(selectedTasks).map(id => archiveTask(id))
        );
        setSelectedTasks(new Set());
    }, [selectedTasks, archiveTask]);

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
                    aria-pressed={viewMode === 'kanban'}
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
                    aria-pressed={viewMode === 'calendar'}
                    className={`p-2 rounded-xl border transition-all duration-200 ${
                        viewMode === 'calendar'
                            ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-muted-foreground hover:border-primary/50 hover:text-primary'
                    }`}
                >
                    <Calendar className="w-4 h-4" aria-hidden="true" />
                </button>
            </div>

            {viewMode === 'calendar' ? (
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
                        {searchQuery || statusFilter !== 'all' ? 'Sin tareas detectadas' : t('tasks.empty')}
                    </h3>

                    <p className="text-muted-foreground font-medium text-center max-w-sm mb-10 leading-relaxed">
                        {searchQuery || statusFilter !== 'all'
                            ? t('tasks.emptyDesc')
                            : t('tasks.emptyDesc')}
                    </p>

                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="btn-primary group/btn"
                    >
                        <Plus className="w-5 h-5 group-hover/btn:rotate-90 transition-transform" />
                        <span className="font-bold tracking-wide">{t('tasks.createFirst')}</span>
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
            />
        </div>
    );
}
