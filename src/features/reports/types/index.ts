export interface ReportFilter {
    project_id: string | 'all';
    start_date: string;
    end_date: string;
    entity_id: string | 'all';
    status?: string[];
    priority?: string[];
    assignee_id?: string;
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
    estHours: number;
    actHours: number;
    load: number;
    overdue_critical: number;
    historical_avg_delay: number;
    predicted_delay_risk: number;
}

export interface ProjectStat {
    id: string;
    name: string;
    status: string;
    progress: number;
    budget: number;
    risk_level: string;
}

export interface HiringProcessStat {
    id: string;
    title: string;
    status: string;
    total_progress: number;
    assigned_to_name: string;
}

export interface TaskStat {
    id: string;
    title: string;
    status: string;
    priority: string;
    end_date: string;
    assigned_to_name: string;
}

export interface ReportStats {
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    avg_progress: number;
    tasks_by_status: Record<string, number>;
    tasks_by_priority: Record<string, number>;
    team_efficacy: TeamEfficacyMember[];
    projects_list?: ProjectStat[];
    hiring_processes?: HiringProcessStat[];
    tasks_list?: TaskStat[];
    // New fields for real visualization data
    burndown_data?: BurndownPoint[];
    resource_metrics?: ResourceMetric[];
    financial_metrics?: FinancialMetric[];
    trend_data?: { month: string; amount: number }[];
}

export interface ProjectData {
    id: string;
    name: string;
    entity_id: string;
    entity_name?: string;
    entity_logo_url?: string | null;
}

export interface BurndownPoint {
    day: string;
    ideal: number;
    actual: number;
    remaining: number;
}

export interface ResourceMetric {
    name: string;
    role: string;
    allocation: number; // 0-100%
    tasks_count: number;
    efficiency_score: number;
}

export interface FinancialMetric {
    category: string;
    amount: number;
    type: 'income' | 'expense' | 'budget';
    description?: string;
}
