export interface ReportFilter {
    project_id: string | 'all';
    start_date: string;
    end_date: string;
    entity_id: string | 'all';
}

export interface TeamEfficacyMember {
    id?: string;
    full_name: string;
    email: string;
    total: number;
    completed: number;
    efficacy: number;
    punctuality: number;
    efficiency: number;
    load: number;
    overdue_critical: number;
    historical_avg_delay: number;
    predicted_delay_risk: number;
}

export interface ReportStats {
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    avg_progress: number;
    tasks_by_status: Record<string, number>;
    team_efficacy: TeamEfficacyMember[];
}

export interface ProjectData {
    id: string;
    name: string;
    entity_id: string;
    entity_name?: string;
    entity_logo_url?: string | null;
}
