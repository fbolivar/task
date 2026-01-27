import { HiringPhaseTracking } from "../../hiring/types";

export interface AnalyticsKPI {
    total_budget: number;
    executed_budget: number;
    budget_execution_percentage: number;
    active_projects_count: number;
    high_risk_projects_count: number;
    active_hiring_processes: number;
    hiring_volume_estimated: number;

    // Efficiency Metrics
    avg_task_completion: number;
    total_tasks: number;
    overdue_tasks: number;
    resource_utilization: number;
}

export interface ProjectRiskDistribution {
    risk_level: string;
    count: number;
    total_budget: number;
}

export interface HiringFunnelStats {
    status: string;
    count: number;
    value: number;
}

export interface FinancialTrend {
    month: string;
    planned: number;
    actual: number;
}

export interface TaskEfficiencyStats {
    project_name: string;
    total: number;
    completed: number;
    efficiency: number; // 0-100
}

export interface RecentHiringProcess {
    id: string;
    title: string;
    project_name: string;
    status: string;
    progress: number;
    updated_at: string;
    phases: HiringPhaseTracking[];
}

export interface AnalyticsDashboardData {
    kpis: AnalyticsKPI;
    risk_matrix: ProjectRiskDistribution[];
    hiring_funnel: HiringFunnelStats[];
    financial_trend: FinancialTrend[];
    task_efficiency: TaskEfficiencyStats[];
    recent_hiring_processes: RecentHiringProcess[];
}
