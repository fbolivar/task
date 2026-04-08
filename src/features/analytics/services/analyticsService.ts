import { createClient } from '@/lib/supabase/client';
import { AnalyticsDashboardData } from '../types';
import { HiringPhaseTracking } from '@/features/hiring/types';

interface ProjectRow {
    id: string;
    name: string;
    budget: number | null;
    actual_cost: number | null;
    risk_level: string | null;
    status: string | null;
    created_at: string;
}

interface AssetRow {
    id: string;
    purchase_value: number | null;
    warranty_expiration: string | null;
    status: string | null;
}

interface HiringRow {
    id: string;
    title: string;
    estimated_amount: number | null;
    status: string | null;
    total_progress: number | null;
    updated_at: string;
    project: { name: string } | null;
    phases: HiringPhaseTracking[];
}

interface TaskRow {
    id: string;
    status: string | null;
    end_date: string | null;
    project_id: string | null;
    assigned_to: string | null;
}

interface RiskBucket {
    count: number;
    total_budget: number;
}

interface FunnelBucket {
    count: number;
    value: number;
}

export const analyticsService = {
    async getDashboardData(entityId: string | 'all'): Promise<AnalyticsDashboardData> {
        const supabase = createClient();

        // 1. Fetch Projects with financial data
        let projectsQuery = supabase.from('projects').select('id, name, budget, actual_cost, risk_level, status, created_at');
        if (entityId !== 'all') projectsQuery = projectsQuery.eq('entity_id', entityId);

        // 2. Fetch Hiring Processes with Project info and Phases
        let hiringQuery = supabase.from('hiring_processes').select('id, title, estimated_amount, status, total_progress, updated_at, project:projects(name), phases:hiring_phases_tracking(*)');
        if (entityId !== 'all') hiringQuery = hiringQuery.eq('entity_id', entityId);

        // 3. Fetch Assets for Inventory Metrics
        let assetsQuery = supabase.from('assets').select('id, purchase_value, warranty_expiration, status');
        if (entityId !== 'all') assetsQuery = assetsQuery.eq('entity_id', entityId);

        // 4. Fetch total active users for resource utilization
        const usersCountQuery = supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true);

        const [projectsRes, hiringRes, assetsRes, usersCountRes] = await Promise.all([
            projectsQuery,
            hiringQuery,
            assetsQuery,
            usersCountQuery,
        ]);

        const projects = (projectsRes.data || []) as ProjectRow[];
        const projectIds = projects.map((p) => p.id);
        const assets = (assetsRes.data || []) as AssetRow[];
        const totalActiveUsers = usersCountRes.count ?? 0;

        // Now fetch tasks for these projects
        let tasksData: TaskRow[] = [];
        if (projectIds.length > 0) {
            const { data } = await supabase.from('tasks').select('id, status, end_date, project_id, assigned_to').in('project_id', projectIds.slice(0, 100)); // Limit to avoid URL overflow
            tasksData = (data || []) as TaskRow[];
        }

        const hiring = (hiringRes.data || []) as HiringRow[];

        // --- KPI Calculation ---
        const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
        const executedBudget = projects.reduce((sum, p) => sum + (p.actual_cost || 0), 0);
        const activeProjects = projects.filter((p) => p.status === 'Activo').length;
        const highRiskProjects = projects.filter((p) => p.risk_level === 'Alto' || p.risk_level === 'Crítico').length;

        const totalTasks = tasksData.length;
        const completedTasks = tasksData.filter((t) => t.status === 'Completado').length;
        const overdueTasks = tasksData.filter((t) => t.end_date && new Date(t.end_date) < new Date() && t.status !== 'Completado').length;

        // Resource utilization: unique users with assigned tasks vs total active users
        const usersWithTasks = new Set(tasksData.map((t) => t.assigned_to).filter(Boolean)).size;
        const resourceUtilization = totalActiveUsers > 0 ? (usersWithTasks / totalActiveUsers) * 100 : 0;

        // --- Inventory / Asset Metrics ---
        const now30 = new Date();
        now30.setDate(now30.getDate() + 30);
        const today = new Date();
        const totalAssets = assets.length;
        const inventoryValue = assets.reduce((sum, a) => sum + (a.purchase_value || 0), 0);
        const expiringWarranties = assets.filter((a) => {
            if (!a.warranty_expiration) return false;
            const exp = new Date(a.warranty_expiration);
            return exp >= today && exp <= now30;
        }).length;

        const inventoryStatusMap: Record<string, number> = {};
        assets.forEach((a) => {
            const s = a.status || 'Desconocido';
            inventoryStatusMap[s] = (inventoryStatusMap[s] || 0) + 1;
        });
        const inventorySummary = Object.entries(inventoryStatusMap).map(([status, count]) => ({ status, count }));

        // --- Risk Matrix ---
        const riskMap: Record<string, RiskBucket> = {};
        projects.forEach((p) => {
            const risk = p.risk_level || 'Bajo';
            if (!riskMap[risk]) riskMap[risk] = { count: 0, total_budget: 0 };
            riskMap[risk].count++;
            riskMap[risk].total_budget += (p.budget || 0);
        });

        // --- Hiring Funnel ---
        const funnelMap: Record<string, FunnelBucket> = {};
        hiring.forEach((h) => {
            const status = h.status || 'Borrador';
            if (!funnelMap[status]) funnelMap[status] = { count: 0, value: 0 };
            funnelMap[status].count++;
            funnelMap[status].value += (h.estimated_amount || 0);
        });

        // --- Recent Hiring Processes ---
        const recentHiringProcesses = hiring
            .filter((h) => h.status !== 'Cancelado' && h.status !== 'Finalizado')
            .map((h) => ({
                id: h.id,
                title: h.title,
                project_name: h.project?.name || 'Sin Proyecto',
                status: h.status ?? '',
                progress: h.total_progress || 0,
                updated_at: h.updated_at,
                phases: h.phases || []
            }))
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            .slice(0, 5);

        // --- Task Efficiency per Project ---
        const projectEfficiency: Record<string, { total: number, completed: number }> = {};
        tasksData.forEach((t) => {
            if (!t.project_id) return;
            if (!projectEfficiency[t.project_id]) projectEfficiency[t.project_id] = { total: 0, completed: 0 };
            projectEfficiency[t.project_id].total++;
            if (t.status === 'Completado') projectEfficiency[t.project_id].completed++;
        });

        const taskEfficiencyStats = projects
            .filter((p) => projectEfficiency[p.id])
            .map((p) => {
                const stats = projectEfficiency[p.id];
                return {
                    project_name: p.name,
                    total: stats.total,
                    completed: stats.completed,
                    efficiency: (stats.completed / (stats.total || 1)) * 100
                };
            })
            .sort((a, b) => b.efficiency - a.efficiency)
            .slice(0, 5); // Top 5

        // --- Real Financial Trend: cumulative budget/cost of projects created per month ---
        const nowTrend = new Date();
        const financialTrend: import('../types').FinancialTrend[] = [];
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(nowTrend.getFullYear(), nowTrend.getMonth() - i, 1);
            const monthLabel = monthDate.toLocaleDateString('es-CO', { month: 'short' });
            const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
            const projectsUpToMonth = projects.filter((p) => new Date(p.created_at) <= endOfMonth);
            const cumulativePlanned = projectsUpToMonth.reduce((sum, p) => sum + (p.budget || 0), 0);
            const cumulativeActual = projectsUpToMonth.reduce((sum, p) => sum + (p.actual_cost || 0), 0);
            // If no real data, fall back to proportional split of totals
            const monthFraction = (6 - i) / 6;
            financialTrend.push({
                month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
                planned: projectsUpToMonth.length > 0 ? Math.round(cumulativePlanned) : Math.round(totalBudget * monthFraction),
                actual: projectsUpToMonth.length > 0 ? Math.round(cumulativeActual) : Math.round(executedBudget * monthFraction),
            });
        }

        return {
            kpis: {
                total_budget: totalBudget,
                executed_budget: executedBudget,
                budget_execution_percentage: totalBudget > 0 ? (executedBudget / totalBudget) * 100 : 0,
                active_projects_count: activeProjects,
                high_risk_projects_count: highRiskProjects,
                active_hiring_processes: hiring.filter((h) => h.status !== 'Finalizado' && h.status !== 'Cancelado').length,
                hiring_volume_estimated: hiring.reduce((sum, h) => sum + (h.estimated_amount || 0), 0),
                avg_task_completion: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
                total_tasks: totalTasks,
                overdue_tasks: overdueTasks,
                resource_utilization: Math.round(resourceUtilization),
                total_assets: totalAssets,
                inventory_value: inventoryValue,
                expiring_warranties: expiringWarranties,
            },
            risk_matrix: Object.entries(riskMap).map(([k, v]) => ({ risk_level: k, ...v })),
            hiring_funnel: Object.entries(funnelMap).map(([k, v]) => ({ status: k, ...v })),
            task_efficiency: taskEfficiencyStats,
            financial_trend: financialTrend,
            recent_hiring_processes: recentHiringProcesses,
            inventory_summary: inventorySummary,
        };
    }
};
