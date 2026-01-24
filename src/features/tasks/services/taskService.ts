import { createClient } from '@/lib/supabase/client';
import { Task, TaskFormData } from '../types';

// Send email notification for task assignment
async function sendAssignmentNotificationEmail(
    taskId: string,
    taskTitle: string,
    assignedTo: string,
    assignerName: string
): Promise<void> {
    try {
        const supabase = createClient();
        console.log('Sending task notification email:', { taskId, taskTitle, assignedTo, assignerName });

        const { data, error } = await supabase.functions.invoke('send-task-notification', {
            body: {
                type: 'assignment',
                task_id: taskId,
                task_title: taskTitle,
                user_id: assignedTo,
                assigner_name: assignerName
            }
        });

        if (error) {
            console.error('Edge function error:', error);
        } else {
            console.log('Email notification result:', data);
        }
    } catch (error) {
        console.error('Error sending notification email:', error);
        // Don't throw - email is non-blocking
    }
}

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
        try {
            // Get current user name for the notification
            const { data: { user } } = await supabase.auth.getUser();
            let assignerName = 'Sistema';
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();
                assignerName = profile?.full_name || 'Un usuario';
            }

            const { data, error } = await supabase
                .from('tasks')
                .insert(task)
                .select('*, project:projects(id, name, entity_id), assignee:profiles(id, full_name)')
                .single();

            if (error) {
                console.error('Supabase error in createTask:', error);
                throw error;
            }

            // Send email notification if task is assigned
            if (task.assigned_to && user && task.assigned_to !== user.id) {
                sendAssignmentNotificationEmail(data.id, task.title, task.assigned_to, assignerName);
            }

            return data as unknown as Task;
        } catch (err) {
            console.error('Catch error in createTask:', err);
            throw err;
        }
    },

    async updateTask(id: string, updates: Partial<TaskFormData>): Promise<Task> {
        const supabase = createClient();
        try {
            // Remove null or undefined relations if they're accidentally included
            const cleanUpdates = { ...updates };

            // Get current user info for notification
            const { data: { user } } = await supabase.auth.getUser();
            let assignerName = 'Sistema';
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();
                assignerName = profile?.full_name || 'Un usuario';
            }

            // Get current task to check if assigned_to changed
            const { data: currentTask } = await supabase
                .from('tasks')
                .select('assigned_to, title')
                .eq('id', id)
                .single();

            const { data, error } = await supabase
                .from('tasks')
                .update(cleanUpdates)
                .eq('id', id)
                .select('*, project:projects(id, name, entity_id), assignee:profiles(id, full_name)')
                .single();

            if (error) {
                console.error('Supabase error in updateTask:', JSON.stringify(error, null, 2));
                throw error;
            }

            // Send email if task was reassigned to a different user
            if (updates.assigned_to &&
                updates.assigned_to !== currentTask?.assigned_to &&
                user &&
                updates.assigned_to !== user.id) {
                sendAssignmentNotificationEmail(id, data.title, updates.assigned_to, assignerName);
            }

            return data as unknown as Task;
        } catch (err: any) {
            console.error('Catch error in updateTask:', err);
            throw err;
        }
    },

    async deleteTask(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async archiveTask(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('tasks')
            .update({ archived: true })
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
        const logs = tasks.map((t: any) => ({
            task_id: t.id,
            previous_assignee_id: t.assigned_to,
            new_assignee_id: newAssigneeId,
            reason: reason
        }));

        await supabase.from('task_reassignments_log').insert(logs);
    }
};
