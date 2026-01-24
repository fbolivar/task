'use client';

import { useState, useMemo } from 'react';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { TaskHeader } from '@/features/tasks/components/TaskHeader';
import { TaskCard } from '@/features/tasks/components/TaskCard';
import { TaskModal } from '@/features/tasks/components/TaskModal';
import { Task, TaskFormData } from '@/features/tasks/types';
import { Loader2, CheckSquare, Plus, Sparkles } from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';

export default function TareasPage() {
    const { t } = useSettings();
    const { tasks, loading, createTask, updateTask, archiveTask } = useTasks();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const filteredTasks = useMemo(() => {
        return tasks
            .filter(task => !task.archived) // Filter out archived tasks
            .filter(task => {
                const matchesSearch =
                    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (task.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                    (task.project?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                    (task.assignee?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

                const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

                return matchesSearch && matchesStatus;
            });
    }, [tasks, searchQuery, statusFilter]);

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
                totalTasks={tasks.length}
            />

            {filteredTasks.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-reveal">
                    {filteredTasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onEdit={handleOpenEditModal}
                            onArchive={handleArchive}
                            onStatusChange={handleStatusChange}
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
        </div>
    );
}
