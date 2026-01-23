'use client';

import { useState, useMemo } from 'react';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { TaskHeader } from '@/features/tasks/components/TaskHeader';
import { TaskCard } from '@/features/tasks/components/TaskCard';
import { TaskModal } from '@/features/tasks/components/TaskModal';
import { Task, TaskFormData } from '@/features/tasks/types';
import { Loader2, CheckSquare, Plus } from 'lucide-react';

export default function TareasPage() {
    const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesSearch =
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.project?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.assignee?.full_name.toLowerCase().includes(searchQuery.toLowerCase());

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

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
            await deleteTask(id);
        }
    };

    const handleStatusChange = async (task: Task, newStatus: string) => {
        await updateTask(task.id, { status: newStatus as any });
    };

    if (loading && tasks.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-medium">Cargando tablero operativo...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <TaskHeader
                onSearch={setSearchQuery}
                onNewTask={handleOpenCreateModal}
                onStatusFilter={setStatusFilter}
                totalTasks={tasks.length}
            />

            {filteredTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {filteredTasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onEdit={handleOpenEditModal}
                            onDelete={handleDelete}
                            onStatusChange={handleStatusChange}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 glass-card border-dashed">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <CheckSquare className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Sin tareas pendientes</h3>
                    <p className="text-muted-foreground mt-2 mb-8 text-center max-w-md">
                        {searchQuery || statusFilter !== 'all'
                            ? 'Parece que no hay tareas que coincidan con tu búsqueda.'
                            : 'Todo está al día. ¿Necesitas planificar algo nuevo?'}
                    </p>
                    <button
                        onClick={handleOpenCreateModal}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Crear nueva tarea
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
