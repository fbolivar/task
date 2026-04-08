import { createClient } from '@/lib/supabase/client';
import { TaskComment } from '../types';

export const commentService = {
    async getComments(taskId: string): Promise<TaskComment[]> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('task_comments')
            .select(`
                *,
                user:profiles(full_name, avatar_url)
            `)
            .eq('task_id', taskId)
            .order('created_at', { ascending: true }); // Oldest first to show conversation flow

        if (error) {
            if (error.code === '42P01') {
                return [];
            }
            throw error;
        }

        return data as TaskComment[];
    },

    async addComment(taskId: string, content: string): Promise<TaskComment> {
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('task_comments')
            .insert({
                task_id: taskId,
                user_id: user.id,
                content: content,
                type: 'comment'
            })
            .select(`
                *,
                user:profiles(full_name, avatar_url)
            `)
            .single();

        if (error) throw error;

        return data as TaskComment;
    }
};
