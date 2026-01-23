import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService';
import { Task, TaskFormData } from '../types';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const activeEntityId = useAuthStore(state => state.activeEntityId);

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            const data = await taskService.getTasks(activeEntityId);
            setTasks(data);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching tasks:', err);
            setError(err.message || 'Error al cargar tareas');
        } finally {
            setLoading(false);
        }
    }, [activeEntityId]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const createTask = async (data: TaskFormData) => {
        try {
            const newTask = await taskService.createTask(data);
            setTasks(prev => [newTask, ...prev]);
            return newTask;
        } catch (err: any) {
            console.error('Error creating task:', err);
            throw err;
        }
    };

    const updateTask = async (id: string, data: Partial<TaskFormData>) => {
        try {
            const updated = await taskService.updateTask(id, data);
            setTasks(prev => prev.map(t => t.id === id ? updated : t));
            return updated;
        } catch (err: any) {
            console.error('Error updating task:', err);
            throw err;
        }
    };

    const deleteTask = async (id: string) => {
        try {
            await taskService.deleteTask(id);
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (err: any) {
            console.error('Error deleting task:', err);
            throw err;
        }
    };

    return {
        tasks,
        loading,
        error,
        refresh: fetchTasks,
        createTask,
        updateTask,
        deleteTask,
    };
}
