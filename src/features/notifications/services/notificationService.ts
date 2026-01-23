import { createClient } from '@/lib/supabase/client';
import { Notification, CreateNotificationDTO } from '../types';

export const notificationService = {
    async getNotifications(): Promise<Notification[]> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        return data || [];
    },

    async markAsRead(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (error) throw error;
    },

    async markAllAsRead(): Promise<void> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) throw error;
    },

    async createNotification(dto: CreateNotificationDTO): Promise<Notification> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('notifications')
            .insert(dto)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
