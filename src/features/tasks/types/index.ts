export type TaskStatus = 'Pendiente' | 'En Progreso' | 'Revisión' | 'Completado';
export type TaskSubStatus = 'En Tiempo' | 'En Riesgo' | 'Demorado' | 'Bloqueado';
export type TaskPriority = 'Baja' | 'Media' | 'Alta';

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
    created_at: string;
    archived?: boolean;
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
    is_change_control_required?: boolean;
}
