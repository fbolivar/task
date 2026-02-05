import { createClient } from '@/lib/supabase/client';
import { TaskFollowup } from '../types';

export const trackingService = {
    async getFollowups(taskId: string): Promise<TaskFollowup[]> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('task_followups')
            .select(`
                *,
                user:profiles(full_name, avatar_url)
            `)
            .eq('task_id', taskId)
            .order('report_date', { ascending: false }) // Newest dates first
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching followups:', error);
            // Graceful fallback
            if (error.code === '42P01') return [];
            throw error;
        }

        return data as TaskFollowup[];
    },

    async addFollowup(
        taskId: string,
        reportDate: string,
        progress: string,
        issues?: string
    ): Promise<TaskFollowup> {
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('task_followups')
            .insert({
                task_id: taskId,
                user_id: user.id,
                report_date: reportDate,
                content_progress: progress,
                content_issues: issues
            })
            .select(`
                *,
                user:profiles(full_name, avatar_url)
            `)
            .single();

        if (error) {
            console.error('Error adding followup:', error);
            throw error;
        }

        return data as TaskFollowup;
    }
};
