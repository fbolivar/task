import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/features/auth/store/authStore';

export interface DashboardStats {
    entities: number;
    projects: number;
    tasks: number;
    activeProjects: number;
    completedProjects: number;
    pausedProjects: number;
    pendingTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    avgTaskCompletion: number;
    resourceUtilization: number;
    performanceIndex: number;
    totalBudget: number;
    totalActualCost: number;
    totalEstimatedHours: number;
    totalActualHours: number;
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
interface Task { id: string; status: string; end_date: string; project_id: string; assigned_to: string; title: string; priority: string; created_at: string; estimated_hours: number | null; actual_hours: number | null; }
interface Asset { id: string; purchase_value: number; warranty_expiration: string; purchase_date: string; useful_life_years: number; entity_id: string; }
interface ActivityLog { id: string; description: string; created_at: string; profiles: { full_name: string }; entity_id: string; }

export const useDashboardData = () => {
    const { profile, activeEntityId } = useAuthStore();
    const [stats, setStats] = useState<DashboardStats>({
        entities: 0, projects: 0, tasks: 0,
        activeProjects: 0, completedProjects: 0, pausedProjects: 0,
        pendingTasks: 0, inProgressTasks: 0, overdueTasks: 0,
        avgTaskCompletion: 0, resourceUtilization: 0,
        performanceIndex: 0, totalBudget: 0, totalActualCost: 0,
        totalEstimatedHours: 0, totalActualHours: 0,
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
    // Stable client reference — createClient() must not be called on every render
    // because a new object reference would cause all dependency arrays to re-fire.
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchDashboardData = useCallback(async () => {
            if (!profile) return;

            let isMounted = true;
            setLoading(true);
            try {
                const isOperativo = profile.role?.name === 'Operativo';
                const userId = profile.id;

                // When filtering by entity, pre-fetch project IDs for that entity first
                // so the tasks query can use them without a nested await inside the query chain.
                let entityProjectIds: string[] | null = null;
                if (activeEntityId !== 'all') {
                    const { data: entityProjects } = await supabase
                        .from('projects')
                        .select('id')
                        .eq('entity_id', activeEntityId);
                    entityProjectIds = (entityProjects || []).map((p: { id: string }) => p.id);
                }

                // Base queries
                let projectsQuery = supabase.from('projects').select('*');
                let tasksQuery = supabase.from('tasks').select('id, status, end_date, project_id, assigned_to, title, priority, created_at, estimated_hours, actual_hours');
                let assetsQuery = supabase.from('assets').select('*');
                let activityQuery = supabase.from('activity_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(10);

                // Apply Entity Filters using the pre-fetched IDs — no nested awaits
                if (activeEntityId !== 'all') {
                    projectsQuery = projectsQuery.eq('entity_id', activeEntityId);
                    tasksQuery = entityProjectIds && entityProjectIds.length > 0
                        ? tasksQuery.in('project_id', entityProjectIds)
                        : tasksQuery.in('project_id', ['']);   // empty set → no results
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

                // Execute remaining queries in parallel
                const [projRes, taskRes, assetRes, actRes] = await Promise.all([
                    projectsQuery,
                    tasksQuery,
                    assetsQuery,
                    activityQuery
                ]);

                if (!isMounted) return;

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

                // Hours aggregation
                const totalEstimatedHours = tasks.reduce((acc, t) => acc + Number(t.estimated_hours || 0), 0);
                const totalActualHours = tasks.reduce((acc, t) => acc + Number(t.actual_hours || 0), 0);

                setStats({
                    entities: 0, // Not really used in cards
                    projects: projects.length,
                    tasks: tasks.length,
                    activeProjects: projects.filter(p => p.status === 'Activo').length,
                    completedProjects: projects.filter(p => p.status === 'Completado').length,
                    pausedProjects: projects.filter(p => p.status === 'Pausado').length,
                    pendingTasks: tasks.filter(t => t.status !== 'Completado').length,
                    inProgressTasks: tasks.filter(t => t.status === 'En Progreso').length,
                    overdueTasks: overdue,
                    avgTaskCompletion: avgCompletion,
                    resourceUtilization: 0, // Calculated below or mocked for now
                    performanceIndex: spi,
                    totalBudget,
                    totalActualCost,
                    totalEstimatedHours,
                    totalActualHours,
                    inventoryValue: inventoryVal,
                    expiringWarranties: expiring
                });

                // --- Charts Data ---

                // 1. Radar (Admin)
                // On-time delivery rate: completed tasks whose created_at <= end_date
                const onTimeRate = completedTasks > 0
                    ? (tasks.filter(t =>
                        t.status === 'Completado' &&
                        t.end_date &&
                        new Date(t.created_at) <= new Date(t.end_date)
                    ).length / completedTasks) * 100
                    : 0;

                const portfolioRadar = [
                    { subject: 'Progreso', A: Math.round(avgCompletion), fullMark: 100 },
                    { subject: 'Presupuesto', A: totalBudget > 0 ? Math.round((totalActualCost / totalBudget) * 100) : 0, fullMark: 100 },
                    { subject: 'Riesgo', A: projects.length > 0 ? Math.round((projects.filter(p => p.risk_level === 'Bajo').length / projects.length) * 100) : 0, fullMark: 100 },
                    { subject: 'Puntualidad', A: Math.round(onTimeRate), fullMark: 100 },
                ];

                // 2. Real weekly velocity for the last 5 weeks
                const now = new Date();
                const weeklyData: { name: string; planned: number; actual: number }[] = [];
                for (let i = 4; i >= 0; i--) {
                    const weekStart = new Date(now);
                    const dayOfWeek = weekStart.getDay() === 0 ? 7 : weekStart.getDay(); // Mon=1..Sun=7
                    weekStart.setDate(weekStart.getDate() - (i * 7) - (dayOfWeek - 1));
                    weekStart.setHours(0, 0, 0, 0);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    weekEnd.setHours(23, 59, 59, 999);

                    const tasksInWeek = tasks.filter(t => {
                        const d = new Date(t.created_at || t.end_date);
                        return d >= weekStart && d <= weekEnd;
                    });

                    const completedInWeek = tasksInWeek.filter(t => t.status === 'Completado').length;

                    weeklyData.push({
                        name: `Sem ${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
                        planned: tasksInWeek.length,
                        actual: completedInWeek,
                    });
                }

                const efficiencyTrends = weeklyData;

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

                // 6. Resource Load - tasks per assignee
                const assigneeCounts: Record<string, { name: string; count: number }> = {};
                tasks.forEach(t => {
                    if (!t.assigned_to) return;
                    if (!assigneeCounts[t.assigned_to]) {
                        assigneeCounts[t.assigned_to] = { name: t.assigned_to, count: 0 };
                    }
                    assigneeCounts[t.assigned_to].count++;
                });

                // Resolve names from profiles if possible
                const assigneeIds = Object.keys(assigneeCounts);
                if (assigneeIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, full_name')
                        .in('id', assigneeIds);
                    if (profiles) {
                        profiles.forEach((p: { id: string; full_name: string }) => {
                            if (assigneeCounts[p.id]) {
                                assigneeCounts[p.id].name = p.full_name || p.id;
                            }
                        });
                    }
                }

                const resourceLoad = Object.values(assigneeCounts)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 8);

                setChartsData({
                    portfolioRadar,
                    efficiencyTrends,
                    riskMatrix,
                    resourceLoad,
                    recentActivity: activity,
                    taskStatusDistribution: statusDist,
                    weeklyVelocity: weeklyData
                });

                // 5. Upcoming Tasks — no slice cap so OperativoDashboard hero section gets all relevant tasks
                const upcoming = tasks
                    .filter(t => t.status !== 'Completado' && t.status !== 'Archivado' && t.end_date)
                    .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());
                setUpcomingTasks(upcoming);


            } catch (error) {
                if (isMounted) {
                    console.error('Error fetching dashboard data:', error);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }

            return () => { isMounted = false; };
    }, [activeEntityId, profile, supabase]);

    // Debounced refresh triggered by Realtime events.
    // Waits 2 seconds after the last change before calling fetchDashboardData,
    // so a burst of rapid inserts/updates only produces one fetch.
    const scheduleFetch = useCallback(() => {
        if (debounceTimerRef.current !== null) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            fetchDashboardData();
        }, 2000);
    }, [fetchDashboardData]);

    // Initial fetch whenever the entity or profile changes.
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Realtime subscriptions for tasks and projects.
    useEffect(() => {
        const channel = supabase
            .channel('dashboard-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                () => { scheduleFetch(); }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'projects' },
                () => { scheduleFetch(); }
            )
            .subscribe();

        return () => {
            if (debounceTimerRef.current !== null) {
                clearTimeout(debounceTimerRef.current);
            }
            supabase.removeChannel(channel);
        };
    }, [supabase, scheduleFetch]);

    return { stats, chartsData, loading, upcomingTasks };
};
