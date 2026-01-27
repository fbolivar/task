import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService';
import { Task, TaskFormData } from '../types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { authService } from '@/features/auth/services/authService';

export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const activeEntityId = useAuthStore(state => state.activeEntityId);
    const { user, setProfile } = useAuthStore();

    const refreshProfile = useCallback(async () => {
        if (!user) return;
        const updatedProfile = await authService.getProfile(user.id);
        setProfile(updatedProfile);
    }, [user, setProfile]);

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

            // Always refresh profile to update sidebar menu visibility
            await refreshProfile();

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

            // Always refresh profile to update sidebar menu visibility
            await refreshProfile();

            return updated;
        } catch (err: any) {
            console.error('Error updating task:', {
                message: err.message,
                details: err.details,
                hint: err.hint,
                code: err.code,
                fullError: err
            });
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

    const archiveTask = async (id: string) => {
        try {
            await taskService.archiveTask(id);
            setTasks(prev => prev.filter(t => t.id !== id));
            await refreshProfile();
        } catch (err: any) {
            console.error('Error archiving task:', err);
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
        archiveTask,
    };
}
