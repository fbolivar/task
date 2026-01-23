import { createClient } from '@/lib/supabase/client';
import { Task, TaskFormData } from '../types';

export const taskService = {
    async getTasks(activeEntityId: string | 'all'): Promise<Task[]> {
        const supabase = createClient();

        let query = supabase
            .from('tasks')
            .select('*, project:projects(id, name, entity_id), assignee:profiles(id, full_name)')
            .order('end_date', { ascending: true });

        const { data, error } = await query;
        if (error) {
            console.error('Supabase error in getTasks:', error);
            throw error;
        }

        let filteredData = data || [];

        if (activeEntityId !== 'all') {
            filteredData = filteredData.filter((task: any) => task.project?.entity_id === activeEntityId);
        }

        return filteredData as unknown as Task[];
    },

    async createTask(task: TaskFormData): Promise<Task> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('tasks')
            .insert(task)
            .select('*, project:projects(id, name), assignee:profiles(id, full_name)')
            .single();

        if (error) throw error;
        return data as unknown as Task;
    },

    async updateTask(id: string, updates: Partial<TaskFormData>): Promise<Task> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .select('*, project:projects(id, name), assignee:profiles(id, full_name)')
            .single();

        if (error) throw error;
        return data as unknown as Task;
    },

    async deleteTask(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getOverdueHighPriorityTasks(entityId: string | 'all'): Promise<Task[]> {
        const supabase = createClient();
        const now = new Date().toISOString().split('T')[0];

        let query = supabase
            .from('tasks')
            .select('*, project:projects(id, name, entity_id), assignee:profiles(id, full_name)')
            .eq('priority', 'Alta')
            .neq('status', 'Completado')
            .lt('end_date', now);

        const { data, error } = await query;
        if (error) throw error;

        let result = data || [];
        if (entityId !== 'all') {
            result = result.filter((t: any) => t.project?.entity_id === entityId);
        }

        return result as unknown as Task[];
    },

    async reassignTasks(taskIds: string[], newAssigneeId: string, reason: string): Promise<void> {
        const supabase = createClient();

        // 1. Get previous owners for logging
        const { data: tasks } = await supabase
            .from('tasks')
            .select('id, assigned_to')
            .in('id', taskIds);

        if (!tasks || tasks.length === 0) return;

        // 2. Perform Update
        const { error: updateError } = await supabase
            .from('tasks')
            .update({ assigned_to: newAssigneeId, updated_at: new Date().toISOString() })
            .in('id', taskIds);

        if (updateError) throw updateError;

        // 3. Log Re-assignments
        const logs = tasks.map(t => ({
            task_id: t.id,
            previous_assignee_id: t.assigned_to,
            new_assignee_id: newAssigneeId,
            reason: reason
        }));

        await supabase.from('task_reassignments_log').insert(logs);
    }
};
