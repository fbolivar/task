'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { ReportFilter, ReportStats, BurndownPoint, ResourceMetric, FinancialMetric } from '../types';

export async function generateReportStats(filter: ReportFilter): Promise<ReportStats> {
    const supabase = await createClient();

    // 1. Security Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role:roles(name)')
        .eq('id', user.id)
        .single();

    // Type assertion to handle potential array return from join
    const roleData = profile?.role as any;
    const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;
    if (roleName !== 'Admin' && roleName !== 'Gerente') {
        throw new Error('Unauthorized: Insufficient privileges');
    }

    // 2. Initialize Admin Client to bypass RLS
    const adminClient = await createAdminClient();

    // 3. Fetch Tasks (Global View)
    let taskQuery = adminClient
        .from('tasks')
        .select('*, assignee:profiles!tasks_assigned_to_fkey(id, full_name, email), projects(id, name, entity_id)');

    if (filter.project_id !== 'all') {
        taskQuery = taskQuery.eq('project_id', filter.project_id);
    }

    // Advanced Filters
    if (filter.status && filter.status.length > 0) {
        taskQuery = taskQuery.in('status', filter.status);
    }

    if (filter.priority && filter.priority.length > 0) {
        taskQuery = taskQuery.in('priority', filter.priority);
    }

    if (filter.assignee_id && filter.assignee_id !== 'all') {
        taskQuery = taskQuery.eq('assigned_to', filter.assignee_id);
    }

    if (filter.start_date && filter.end_date) {
        const start = `${filter.start_date}T00:00:00.000Z`;
        const endDate = new Date(filter.end_date);
        endDate.setUTCHours(23, 59, 59, 999);
        const endStr = endDate.toISOString();

        // Fix: Query tasks that were Created in range OR Completed in range
        // This ensures the Report/Burndown sees work done on old tasks too.
        taskQuery = taskQuery.or(`and(created_at.gte.${start},created_at.lte.${endStr}),and(status.eq.Completado,completed_at.gte.${start},completed_at.lte.${endStr})`);
    } else {
        // Fallback for partial dates (legacy behavior)
        if (filter.start_date) {
            taskQuery = taskQuery.gte('created_at', `${filter.start_date}T00:00:00.000Z`);
        }
        if (filter.end_date) {
            const endDate = new Date(filter.end_date);
            endDate.setUTCHours(23, 59, 59, 999);
            taskQuery = taskQuery.lte('created_at', endDate.toISOString());
        }
    }

    const { data: tasks, error: taskError } = await taskQuery;

    if (taskError) {
        console.error('Report Task Error:', taskError);
        throw new Error('Error fetching report data');
    }

    let filteredTasks = tasks || [];

    // 4. Filter by Entity if globally selected
    if (filter.entity_id !== 'all') {
        filteredTasks = filteredTasks.filter((t: any) => {
            if (!t.projects) return true; // Orphan tasks might be included or excluded depending on policy. Including for now.
            return t.projects.entity_id === filter.entity_id;
        });
    }

    // 5. Process Stats (Calculations)
    const total = filteredTasks.length;
    const completed = filteredTasks.filter((t: any) => t.status === 'Completado').length;
    const pending = total - completed;

    // Simplification: Average progress based on completed tasks ratio if individual progress is not reliable
    // or if we want a global "Portfolio Progress" metric.
    const avgProgress = total > 0 ? (completed / total) * 100 : 0;

    const tasksByStatus: Record<string, number> = {};
    const tasksByPriority: Record<string, number> = {};

    filteredTasks.forEach((t: any) => {
        tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
        const priority = t.priority || 'Sin Prioridad';
        tasksByPriority[priority] = (tasksByPriority[priority] || 0) + 1;
    });

    // 6. Team Efficacy
    // Fix: Fetch ALL profiles first to ensure everyone is listed, even with 0 activity
    const { data: allProfiles } = await adminClient
        .from('profiles')
        .select('id, full_name, email')
        .eq('status', 'active'); // Assuming there is a status field, or just fetch all

    const teamMap: Record<string, any> = {};

    if (allProfiles) {
        allProfiles.forEach((p: any) => {
            teamMap[p.id] = {
                id: p.id,
                full_name: p.full_name,
                email: p.email,
                total: 0,
                completed: 0,
                onTime: 0,
                estHours: 0,
                actHours: 0,
                load: 0,
                totalDelay: 0
            };
        });
    }

    filteredTasks.forEach((t: any) => {
        if (t.assignee) {
            const id = t.assignee.id;
            // If assignee is not in active profiles (maybe inactive?), add them dynamically or skip
            // Let's add them to be safe so we don't lose data
            if (!teamMap[id]) {
                teamMap[id] = {
                    id: id,
                    full_name: t.assignee.full_name,
                    email: t.assignee.email,
                    total: 0,
                    completed: 0,
                    onTime: 0,
                    estHours: 0,
                    actHours: 0,
                    load: 0,
                    totalDelay: 0
                };
            }

            teamMap[id].total += 1;
            if (t.status === 'Completado') {
                teamMap[id].completed += 1;
                const endDate = t.end_date ? new Date(t.end_date) : null;
                const compDate = t.completed_at ? new Date(t.completed_at) : null;

                if (compDate && endDate) {
                    if (compDate <= endDate) {
                        teamMap[id].onTime += 1;
                    } else {
                        const diffDays = Math.ceil((compDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
                        teamMap[id].totalDelay += diffDays;
                    }
                }
                teamMap[id].estHours += Number(t.estimated_hours || 0);
                teamMap[id].actHours += Number(t.actual_hours || 0);
            } else {
                teamMap[id].load += 1;
            }
        }
    });

    // 6.b Global Load Correction (Fix for "Carga Operativa")
    // The previous loop only counts pending tasks created WITHIN the date range.
    // We need the ACTUAL current load (all pending tasks regardless of date).
    const userIds = Object.keys(teamMap);
    if (userIds.length > 0) {
        let globalLoadQuery = adminClient
            .from('tasks')
            .select('assigned_to, status, projects!inner(entity_id)')
            .neq('status', 'Completado')
            .in('assigned_to', userIds);

        // If we are filtering by entity/project for the report, should we scope the load?
        // Usually "Resource Load" is their TOTAL load across the company (Entity).
        // If we filter by Project, showing their total load is more useful to know availability.
        // However, let's respect Entity boundary strictly.
        if (filter.entity_id !== 'all') {
            globalLoadQuery = globalLoadQuery.eq('projects.entity_id', filter.entity_id);
        }

        const { data: globalPendingTasks } = await globalLoadQuery;

        if (globalPendingTasks) {
            // Reset load calculated from filtered view and use global count
            userIds.forEach(uid => { teamMap[uid].load = 0; });

            globalPendingTasks.forEach((t: any) => {
                const uid = t.assigned_to;
                if (teamMap[uid]) {
                    teamMap[uid].load += 1;
                }
            });
        }
    }

    const nowStr = new Date().toISOString().split('T')[0];
    const teamEfficacy = Object.values(teamMap).map((m: any) => {
        const avgDelay = m.completed > 0 ? (m.totalDelay / m.completed) : 0;
        const riskFactor = 1 + (Math.max(0, m.load - 5) * 0.1);

        return {
            ...m,
            efficacy: m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0,
            punctuality: m.completed > 0 ? Math.round((m.onTime / m.completed) * 100) : 0,
            efficiency: m.actHours > 0 ? Math.round((m.estHours / m.actHours) * 100) : 100,
            estHours: m.estHours,
            actHours: m.actHours,
            load: m.load,
            overdue_critical: filteredTasks.filter((t: any) =>
                t.assigned_to === m.id &&
                t.status !== 'Completado' &&
                t.priority === 'Alta' &&
                t.end_date < nowStr
            ).length,
            historical_avg_delay: Number(avgDelay.toFixed(1)),
            predicted_delay_risk: Number((avgDelay * riskFactor).toFixed(1))
        };
    });

    // 7. Additional Context (Projects & Hiring)
    const promises = [];

    let projectsQuery = adminClient.from('projects').select('id, name, status, risk_level, budget, entity_id').order('created_at', { ascending: false });
    if (filter.entity_id !== 'all') projectsQuery = projectsQuery.eq('entity_id', filter.entity_id);
    // Apply projects filter to projects list as well to show relevant context
    if (filter.project_id !== 'all') projectsQuery = projectsQuery.eq('id', filter.project_id);

    promises.push(projectsQuery);

    let hiringQuery = adminClient.from('hiring_processes').select('id, title, status, total_progress, entity_id, project_id, assignee:profiles(full_name)').order('created_at', { ascending: false });
    if (filter.entity_id !== 'all') hiringQuery = hiringQuery.eq('entity_id', filter.entity_id);
    if (filter.project_id !== 'all') hiringQuery = hiringQuery.eq('project_id', filter.project_id);
    promises.push(hiringQuery);

    const [projectsRes, hiringRes] = await Promise.all(promises);

    // Calculate progress for each project based on its tasks
    const projectsList = await Promise.all((projectsRes.data || []).map(async (p: any) => {
        // Fetch specific task stats for this project
        const { count: totalTasks } = await adminClient
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', p.id);

        const { count: completedTasks } = await adminClient
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', p.id)
            .eq('status', 'Completado');

        const progress = totalTasks && totalTasks > 0 ? Math.round(((completedTasks || 0) / totalTasks) * 100) : 0;

        return {
            id: p.id,
            name: p.name,
            status: p.status,
            progress: progress,
            budget: p.budget,
            risk_level: p.risk_level
        };
    }));

    const hiringList = (hiringRes.data || []).map((h: any) => ({
        id: h.id,
        title: h.title,
        status: h.status,
        total_progress: h.total_progress,
        assigned_to_name: h.assignee?.full_name || 'Sin Asignar'
    }));

    const tasksList = filteredTasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        end_date: t.end_date,
        assigned_to_name: t.assignee?.full_name || 'Sin Asignar'
    })).slice(0, 50);

    // 8. Visualization Data
    const burndownData = calculateBurndown(filteredTasks, filter.start_date, filter.end_date);

    const resourceMetrics = teamEfficacy.map(m => ({
        name: m.full_name,
        role: 'Member',
        // Allocation logic: Assuming 5 concurrent tasks is 100% load
        // Use exact percentage to avoid confusion (e.g. 2/5 = 40%, 3/5 = 60%)
        allocation: Math.min(100, (m.load / 5) * 100),
        tasks_count: m.load + m.completed,
        efficiency_score: m.efficiency
    }));

    const totalBudget = (projectsRes.data || []).reduce((sum: number, p: any) => sum + (p.budget || 0), 0);
    const totalSpent = filteredTasks.reduce((sum: number, t: any) => sum + ((t.actual_hours || 0) * 50), 0);

    const financialMetrics = [
        { category: 'Presupuesto Total', amount: totalBudget, type: 'budget' as const },
        { category: 'Ejecución (Est.)', amount: totalSpent, type: 'expense' as const },
        { category: 'Disponible', amount: Math.max(0, totalBudget - totalSpent), type: 'income' as const }
    ];

    const trendData: Record<string, number> = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    filteredTasks.forEach((t: any) => {
        if (t.status === 'Completado' && t.completed_at) {
            const d = new Date(t.completed_at);
            if (d >= sixMonthsAgo) {
                const key = d.toLocaleString('es-ES', { month: 'short' });
                trendData[key] = (trendData[key] || 0) + 1;
            }
        }
    });

    const trendDataArray = Object.entries(trendData).map(([month, amount]) => ({ month, amount }));

    return {
        total_tasks: total,
        completed_tasks: completed,
        pending_tasks: pending,
        avg_progress: Math.round(avgProgress),
        tasks_by_status: tasksByStatus,
        tasks_by_priority: tasksByPriority,
        team_efficacy: teamEfficacy as any,
        projects_list: projectsList,
        hiring_processes: hiringList,
        tasks_list: tasksList,
        burndown_data: burndownData,
        resource_metrics: resourceMetrics,
        financial_metrics: financialMetrics,
        trend_data: trendDataArray
    };
}

// Helper: Calculate Burndown (Server Side)
function calculateBurndown(tasks: any[], startDate?: string, endDate?: string) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - (14 * 24 * 60 * 60 * 1000));

    // Normalize dates to midnight for accurate comparison
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

    // Total Scope: All tasks included in this report
    const totalScope = tasks.length;
    let currentRemaining = totalScope;

    const burndown = [];

    for (let i = 0; i <= daysDiff; i++) {
        const currentDate = new Date(start.getTime() + (i * 24 * 60 * 60 * 1000));
        currentDate.setHours(23, 59, 59, 999); // Compare at end of day

        // Don't project into the future
        if (currentDate > new Date() && i < daysDiff) {
            // Optional: stop plotting actual line for future dates? 
            // For now let's just keep flat line or null if supported.
            // But to avoid breaking charts, we'll just hold the last value.
        }

        // Ideally, remaining drops linearly from Total to 0
        const ideal = totalScope - ((totalScope / daysDiff) * i);

        // Actually: Subtract tasks completed on or before this date
        // Note: Logic depends on if we start at Total and burn down tasks that ARE COMPLETED.
        // What if a task is never completed? It stays remaining.

        // Count tasks completed specifically ON this day
        const tasksCompletedOnDay = tasks.filter((t: any) => {
            if (t.status !== 'Completado' || !t.completed_at) return false;
            const cDate = new Date(t.completed_at);
            return cDate >= new Date(currentDate.getTime() - 24 * 60 * 60 * 1000) && cDate <= currentDate;
            // Simple check: Same Day
            // Actually, let's use the same day check logic as before but more robust
            const cDateStr = cDate.toISOString().split('T')[0];
            const dDateStr = currentDate.toISOString().split('T')[0];
            return cDateStr === dDateStr;
        }).length;

        currentRemaining -= tasksCompletedOnDay;

        burndown.push({
            day: currentDate.getDate().toString(), // Label
            ideal: Math.max(0, Math.round(ideal * 10) / 10),
            actual: Math.max(0, currentRemaining),
            remaining: 0 // Legacy field, unused
        });
    }

    return burndown;
}
