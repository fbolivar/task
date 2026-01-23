import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { Notification } from '../types';

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const data = await notificationService.getNotifications();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const markRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return {
        notifications,
        loading,
        unreadCount,
        markRead,
        markAllRead,
        refresh: fetchNotifications
    };
}
