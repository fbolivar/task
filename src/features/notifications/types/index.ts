export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ALERT';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
    is_read: boolean;
    link?: string;
    created_at: string;
}

export interface CreateNotificationDTO {
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
}
