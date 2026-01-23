export type ProjectStatus = 'Activo' | 'Pausado' | 'Completado' | 'Bajo Revisión';
export type ProjectPriority = 'Baja' | 'Media' | 'Alta' | 'Crítica';

export interface Entity {
    id: string;
    name: string;
}

export interface SubProject {
    id: string;
    project_id: string;
    name: string;
    description: string | null;
    status: string;
    created_at: string;
}

export interface Project {
    id: string;
    entity_id: string | null;
    name: string;
    description: string | null;
    status: ProjectStatus;
    priority: ProjectPriority;
    customer_satisfaction: number;
    start_date: string | null;
    end_date: string | null;
    contract_active: boolean;
    has_support: boolean;
    actual_cost: number;
    created_at: string;
    entity?: Entity;
    sub_projects?: SubProject[];
}

export interface ProjectFormData {
    name: string;
    entity_id: string | null;
    description: string | null;
    status: ProjectStatus;
    priority: ProjectPriority;
    start_date: string | null;
    end_date: string | null;
    contract_active: boolean;
    has_support: boolean;
}
