import { createClient } from '@/lib/supabase/client';
import { Task, TaskFormData } from '../types';
import { notificationService } from '@/shared/services/notificationService';

// Send email notification for task assignment
async function sendAssignmentNotificationEmail(
    taskId: string,
    taskTitle: string,
    assignedTo: string,
    assignerName: string
): Promise<void> {
    try {
        const supabase = createClient();

        // Get recipient email
        const { data: userData } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', assignedTo)
            .single();

        if (!userData?.email) {
            console.warn('Cannot send notification: User has no email');
            return;
        }

        console.log(`Triggering notification for updated task to ${userData.email}`);
        await notificationService.notifyWithTemplate(
            userData.email,
            'task_assigned',
            {
                name: userData.full_name || 'Usuario',
                title: taskTitle,
                assigner: assignerName,
                link: `${window.location.origin}/tablero`
            }
        );
    } catch (error) {
        console.error('Error sending task notification email:', error);
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
                .insert({
                    ...task,
                    is_change_control_required: task.is_change_control_required || false
                })
                .select('*, project:projects(id, name, entity_id), assignee:profiles(id, full_name)')
                .single();

            if (error) {
                console.error('Supabase error details in createTask:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }

            // If change control required, create Draft Change Request
            if (task.is_change_control_required && task.project_id && user) {
                const { error: crError } = await supabase
                    .from('change_requests')
                    .insert({
                        project_id: task.project_id,
                        task_id: data.id,
                        requester_id: user.id,
                        title: `Cambio: ${task.title}`,
                        description: `Solicitud automática generada desde la tarea: ${task.title}`,
                        priority: 'medium',
                        status: 'draft'
                    });

                if (crError) {
                    console.error("Error generating automatic Change Request", crError);
                }
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
