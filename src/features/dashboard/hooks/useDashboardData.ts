import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/features/auth/store/authStore';

export interface DashboardStats {
    entities: number;
    projects: number;
    tasks: number;
    activeProjects: number;
    completedProjects: number;
    pendingTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    avgTaskCompletion: number;
    resourceUtilization: number;
    performanceIndex: number;
    totalBudget: number;
    totalActualCost: number;
    inventoryValue: number;
    expiringWarranties: number;
}

export interface ChartData {
    portfolioRadar: any[];
    efficiencyTrends: any[];
    riskMatrix: any[];
    resourceLoad: any[];
    recentActivity: any[];
    taskStatusDistribution: any[];
    weeklyVelocity: any[];
}

interface Project { id: string; budget: number; actual_cost: number; risk_level: string; name: string; priority: string; status: string; entity_id: string; }
interface Task { id: string; status: string; end_date: string; project_id: string; assigned_to: string; title: string; priority: string; }
interface Asset { id: string; purchase_value: number; warranty_expiration: string; purchase_date: string; useful_life_years: number; entity_id: string; }
interface ActivityLog { id: string; description: string; created_at: string; profiles: { full_name: string }; entity_id: string; }

export const useDashboardData = () => {
    const { profile, activeEntityId } = useAuthStore();
    const [stats, setStats] = useState<DashboardStats>({
        entities: 0, projects: 0, tasks: 0,
        activeProjects: 0, completedProjects: 0,
        pendingTasks: 0, inProgressTasks: 0, overdueTasks: 0,
        avgTaskCompletion: 0, resourceUtilization: 0,
        performanceIndex: 0, totalBudget: 0, totalActualCost: 0,
        inventoryValue: 0, expiringWarranties: 0
    });

    const [chartsData, setChartsData] = useState<ChartData>({
        portfolioRadar: [],
        efficiencyTrends: [],
        riskMatrix: [],
        resourceLoad: [],
        recentActivity: [],
        taskStatusDistribution: [],
        weeklyVelocity: []
    });

    const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!profile) return;
            setLoading(true);
            try {
                const isOperativo = profile.role?.name === 'Operativo';
                const userId = profile.id;

                // Base queries
                let projectsQuery = supabase.from('projects').select('*');
                let tasksQuery = supabase.from('tasks').select('*');
                let assetsQuery = supabase.from('assets').select('*');
                let activityQuery = supabase.from('activity_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(10);

                // Apply Entity Filters (Global, unless Operativo might be restricted further, but activeEntityId handles it)
                if (activeEntityId !== 'all') {
                    projectsQuery = projectsQuery.eq('entity_id', activeEntityId);
                    tasksQuery = tasksQuery.in('project_id', (await supabase.from('projects').select('id').eq('entity_id', activeEntityId)).data?.map((p: any) => p.id) || []); // Simplified for now, better to filter tasks by project_ids fetched
                    assetsQuery = assetsQuery.eq('entity_id', activeEntityId);
                    activityQuery = activityQuery.eq('entity_id', activeEntityId);
                }

                // Apply Role Filters
                if (isOperativo) {
                    // Operativo sees only their tasks and projects they are assigned to (or all projects if policy allows, but dashboard should focus on THEIRS)
                    // For simplicity, let's assume they see all projects in the selected entity but mostly care about THEIR tasks
                    // Or strictly: tasks assigned to them.
                    tasksQuery = tasksQuery.eq('assigned_to', userId);
                    // Projects where they have tasks? Or all projects? Let's say all projects for context, but metrics focus on theirs.
                    // Actually, let's filter tasks strictly.
                }

                // Execute parallel
                const [projRes, taskRes, assetRes, actRes] = await Promise.all([
                    projectsQuery,
                    tasksQuery,
                    assetsQuery,
                    activityQuery
                ]);

                const projects = (projRes.data || []) as Project[];
                const tasks = (taskRes.data || []) as Task[];
                const assets = (assetRes.data || []) as Asset[];
                const activity = (actRes.data || []) as unknown as ActivityLog[];

                // --- KPI Calculations ---
                const totalBudget = projects.reduce((acc, p) => acc + Number(p.budget || 0), 0);
                const totalActualCost = projects.reduce((acc, p) => acc + Number(p.actual_cost || 0), 0);
                const completedTasks = tasks.filter(t => t.status === 'Completado').length;
                const overdue = tasks.filter(t => t.end_date && new Date(t.end_date) < new Date() && t.status !== 'Completado').length;
                const avgCompletion = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
                const spi = tasks.length > 0 ? completedTasks / tasks.length : 0; // Simplified SPI

                // Inventory
                const inventoryVal = assets.reduce((acc, a) => acc + Number(a.purchase_value || 0), 0); // Simplified value
                const expiring = assets.filter(a => {
                    if (!a.warranty_expiration) return false;
                    const diff = (new Date(a.warranty_expiration).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                    return diff <= 30 && diff > 0;
                }).length;

                setStats({
                    entities: 0, // Not really used in cards
                    projects: projects.length,
                    tasks: tasks.length,
                    activeProjects: projects.filter(p => p.status === 'Activo').length,
                    completedProjects: projects.filter(p => p.status === 'Completado').length,
                    pendingTasks: tasks.filter(t => t.status !== 'Completado').length,
                    inProgressTasks: tasks.filter(t => t.status === 'En Progreso').length,
                    overdueTasks: overdue,
                    avgTaskCompletion: avgCompletion,
                    resourceUtilization: 0, // Calculated below or mocked for now
                    performanceIndex: spi,
                    totalBudget,
                    totalActualCost,
                    inventoryValue: inventoryVal,
                    expiringWarranties: expiring
                });

                // --- Charts Data ---

                // 1. Radar (Admin)
                const portfolioRadar = [
                    { subject: 'Progreso', A: avgCompletion, fullMark: 100 },
                    { subject: 'Presupuesto', A: totalBudget > 0 ? (totalActualCost / totalBudget) * 100 : 0, fullMark: 100 },
                    { subject: 'Riesgo', A: projects.length > 0 ? (projects.filter(p => p.risk_level === 'Bajo').length / projects.length) * 100 : 0, fullMark: 100 },
                    { subject: 'Calidad', A: 85, fullMark: 100 }, // Mocked for now
                ];

                // 2. Efficiency (Mocked trend logic for now, real data approaches typically need aggregations)
                const efficiencyTrends = [
                    { name: 'S-4', planned: 50, actual: 45 },
                    { name: 'S-3', planned: 60, actual: 55 },
                    { name: 'S-2', planned: 70, actual: 75 },
                    { name: 'S-1', planned: 80, actual: 78 },
                    { name: 'Actual', planned: 90, actual: 88 },
                ];

                // 3. Risk Matrix
                const riskMap: Record<string, number> = { 'Bajo': 20, 'Medio': 50, 'Alto': 80, 'Crítico': 100 };
                const riskMatrix = projects.map(p => ({
                    name: p.name,
                    risk: riskMap[p.risk_level] || 10,
                    impact: Number(p.budget) / 1000,
                    priority: p.priority
                }));

                // 4. Task Status (Operativo)
                const statusDist = [
                    { name: 'Pendiente', value: tasks.filter(t => t.status === 'Pendiente').length },
                    { name: 'En Progreso', value: tasks.filter(t => t.status === 'En Progreso').length },
                    { name: 'Completado', value: tasks.filter(t => t.status === 'Completado').length },
                ];

                setChartsData({
                    portfolioRadar,
                    efficiencyTrends,
                    riskMatrix,
                    resourceLoad: [], // TODO: Calculate if needed
                    recentActivity: activity,
                    taskStatusDistribution: statusDist,
                    weeklyVelocity: efficiencyTrends // Reuse for now
                });

                // 5. Upcoming Tasks
                const upcoming = tasks
                    .filter(t => t.status !== 'Completado' && t.status !== 'Archivado' && t.end_date)
                    .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
                    .slice(0, 5);
                setUpcomingTasks(upcoming);


            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [activeEntityId, profile]);

    // Calculate upcoming tasks from the already fetched (and potentially stored) tasks?
    // Since tasks are scoped inside useEffect, we need to store them in state if we want to return them.
    // However, currently we only store 'stats'. We should probably add 'upcomingTasks' to the state or return it separately.
    // To minimize refactoring, I'll add a new state for upcomingTasks.

    // WAIT: I cannot access 'tasks' here because it's inside useEffect. 
    // I need to change how state is managed or add 'upcomingTasks' to the state definition.
    // Let's modify the return type and add a state.

    return { stats, chartsData, loading, upcomingTasks };
};
