import { createClient } from '@/lib/supabase/client';
import { ReportFilter, ReportStats, ProjectData } from '../types';

export const reportService = {
    async getProjectsForFilter(activeEntityId: string | 'all'): Promise<ProjectData[]> {
        const supabase = createClient();
        let query = supabase.from('projects').select('id, name, entity_id, entities(name, logo_url)');

        if (activeEntityId !== 'all') {
            query = query.eq('entity_id', activeEntityId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            entity_id: p.entity_id,
            entity_name: p.entities?.name,
            entity_logo_url: p.entities?.logo_url
        }));
    },

    async getReportStats(filter: ReportFilter): Promise<ReportStats> {
        const supabase = createClient();

        // 1. Fetch Tasks
        let taskQuery = supabase
            .from('tasks')
            .select('*, profiles(id, full_name, email), projects(id, name, entity_id)');

        if (filter.project_id !== 'all') {
            taskQuery = taskQuery.eq('project_id', filter.project_id);
        }

        if (filter.start_date) {
            taskQuery = taskQuery.gte('created_at', new Date(filter.start_date).toISOString());
        }
        if (filter.end_date) {
            taskQuery = taskQuery.lte('created_at', new Date(filter.end_date).toISOString());
        }

        const { data: tasks, error: taskError } = await taskQuery;
        if (taskError) throw taskError;

        let filteredTasks = tasks || [];

        // 2. Filter by Entity if globally selected
        if (filter.entity_id !== 'all') {
            filteredTasks = filteredTasks.filter((t: any) => t.projects?.entity_id === filter.entity_id);
        }

        // 3. Process Stats
        const total = filteredTasks.length;
        const completed = filteredTasks.filter((t: any) => t.status === 'Completado').length;
        const pending = total - completed;

        // Use progress from task or infer from status
        const progressSum = filteredTasks.reduce((sum: number, t: any) => {
            if (t.progress !== undefined && t.progress !== null) return sum + t.progress;
            return sum + (t.status === 'Completado' ? 100 : 0);
        }, 0);
        const avgProgress = total > 0 ? progressSum / total : 0;

        const tasksByStatus: Record<string, number> = {};
        filteredTasks.forEach((t: any) => {
            tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
        });

        // 4. Team Efficacy (Advanced)
        // 4. Team Efficacy (Advanced)
        const teamMap: Record<string, any> = {};

        filteredTasks.forEach((t: any) => {
            if (t.profiles) {
                const id = t.profiles.id;
                if (!teamMap[id]) {
                    teamMap[id] = {
                        id: id,
                        full_name: t.profiles.full_name,
                        email: t.profiles.email,
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

        const now = new Date().toISOString().split('T')[0];
        const teamEfficacy = Object.values(teamMap).map((m: any) => {
            const avgDelay = m.completed > 0 ? (m.totalDelay / m.completed) : 0;
            const riskFactor = 1 + (Math.max(0, m.load - 5) * 0.1);

            return {
                ...m,
                efficacy: m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0,
                punctuality: m.completed > 0 ? Math.round((m.onTime / m.completed) * 100) : 0,
                efficiency: m.actHours > 0 ? Math.round((m.estHours / m.actHours) * 100) : 100,
                load: m.load,
                overdue_critical: filteredTasks.filter((t: any) =>
                    t.assigned_to === m.id &&
                    t.status !== 'Completado' &&
                    t.priority === 'Alta' &&
                    t.end_date < now
                ).length,
                historical_avg_delay: Number(avgDelay.toFixed(1)),
                predicted_delay_risk: Number((avgDelay * riskFactor).toFixed(1))
            };
        });

        // 5. Additional Data for Report
        const promises = [];

        // 5.1 Projects List
        let projectsQuery = supabase.from('projects').select('id, name, status, risk_level, budget').order('created_at', { ascending: false });
        if (filter.entity_id !== 'all') projectsQuery = projectsQuery.eq('entity_id', filter.entity_id);
        promises.push(projectsQuery);

        // 5.2 Hiring Processes
        let hiringQuery = supabase.from('hiring_processes').select('id, title, status, total_progress, assignee:profiles(full_name)').order('created_at', { ascending: false });
        if (filter.entity_id !== 'all') hiringQuery = hiringQuery.eq('entity_id', filter.entity_id);
        if (filter.project_id !== 'all') hiringQuery = hiringQuery.eq('project_id', filter.project_id);
        promises.push(hiringQuery);

        const [projectsRes, hiringRes] = await Promise.all(promises);

        const projectsList = (projectsRes.data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            progress: 0, // Calculate if needed, or fetch from summary
            budget: p.budget,
            risk_level: p.risk_level
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
            assigned_to_name: t.profiles?.full_name || 'Sin Asignar'
        })).slice(0, 50); // Limit to top 50 to avoid PDF explosion

        return {
            total_tasks: total,
            completed_tasks: completed,
            pending_tasks: pending,
            avg_progress: Math.round(avgProgress),
            tasks_by_status: tasksByStatus,
            team_efficacy: teamEfficacy as any,
            projects_list: projectsList,
            hiring_processes: hiringList,
            tasks_list: tasksList
        };
    },

};
