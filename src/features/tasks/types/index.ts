export type TaskStatus = 'Pendiente' | 'En Progreso' | 'Revisión' | 'Completado';
export type TaskSubStatus = 'En Tiempo' | 'En Riesgo' | 'Demorado' | 'Bloqueado';
export type TaskPriority = 'Baja' | 'Media' | 'Alta';

export interface TaskComment {
    id: string;
    task_id: string;
    user_id: string;
    content: string;
    created_at: string;
    type: 'comment' | 'system';
    user?: {
        full_name: string;
        avatar_url?: string;
    };
}

export interface TaskFollowup {
    id: string;
    task_id: string;
    user_id: string;
    report_date: string;
    content_progress: string;
    content_issues?: string;
    created_at: string;
    user?: {
        full_name: string;
        avatar_url?: string;
    };
}

export interface Assignee {
    id: string;
    full_name: string;
    avatar_url?: string;
}

export interface ProjectShort {
    id: string;
    name: string;
    entity_id?: string;
}

export interface Task {
    id: string;
    is_change_control_required?: boolean;
    change_request_id?: string;
    project_id: string | null;
    title: string;
    notes: string | null;
    status: TaskStatus;
    sub_status: TaskSubStatus;
    priority: TaskPriority;
    end_date: string | null;
    assigned_to: string | null;
    evidence_link: string | null;
    estimated_hours: number;
    actual_hours: number;
    created_at: string;
    created_by?: string;
    archived?: boolean;
    is_recurring?: boolean;
    recurrence_pattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | null;
    recurrence_end_date?: string | null;
    project?: ProjectShort;
    assignee?: Assignee;
}

export interface TaskFormData {
    project_id: string | null;
    title: string;
    notes: string | null;
    status: TaskStatus;
    sub_status: TaskSubStatus;
    priority: TaskPriority;
    end_date: string | null;
    assigned_to: string | null;
    evidence_link: string | null;
    estimated_hours?: number;
    actual_hours?: number;
    is_change_control_required?: boolean;
    created_by?: string;
    is_recurring?: boolean;
    recurrence_pattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | null;
    recurrence_end_date?: string | null;
}
