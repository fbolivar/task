'use client';

import { useState, useEffect } from 'react';
import {
    FileText, BarChart3, Users, Download, Sparkles, Filter
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { BurndownChart } from './visualizations/BurndownChart';
import { ResourceHeatmap } from './visualizations/ResourceHeatmap';
import { PriorityChart } from './visualizations/PriorityChart';
import { ProjectData, ReportStats, BurndownPoint, ResourceMetric, FinancialMetric } from '../types';
import { generateExecutivePDF } from '../utils/pdfGenerator';

interface Props {
    projects: ProjectData[];
    stats: ReportStats | null;
    burndownData: BurndownPoint[];
    resourceData: ResourceMetric[];
    financialData: FinancialMetric[];
    loading: boolean;
    onGenerate: (filter: any) => Promise<void>;
    activeType: ReportType;
    onTypeChange: (type: ReportType) => void;
}

export type ReportType = 'executive' | 'operational' | 'financial' | 'team';

export function ReportBuilder({
    projects, stats, burndownData, resourceData, financialData, loading, onGenerate, activeType, onTypeChange
}: Props) {
    const { t } = useSettings();
    const [showFilters, setShowFilters] = useState(false);
    const [users, setUsers] = useState<any[]>([]);

    // Local state removed to support lifting up to page
    const [filters, setFilters] = useState<{
        projectId: string,
        start: string,
        end: string,
        status?: string[],
        priority?: string[],
        assignee_id?: string
    }>({
        projectId: 'all',
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
        status: [],
        priority: [],
        assignee_id: 'all'
    });

    // Fetch users for filter
    // Fetch users for filter
    useEffect(() => {
        const fetchUsers = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('profiles').select('id, full_name, email');
            if (data) setUsers(data);
        };
        fetchUsers();
    }, []);

    const handleRunReport = async () => {
        // Pass all specific filters or leave them to be handled by the parent/hook
        // But wait, the parent onGenerate only takes 3 args currently.
        // We need to update the parent page or hook to accept the partial object
        // Actually, let's keep the signature simple here but we need to pass the full object.
        // Since onGenerate defined in props takes (projectId, start, end), 
        // we might be limited unless we change the prop signature.
        // For now, let's cast or modify how we call it if we can't change the prop type easily.
        // However, we can try to pass the extra data in a larger object if the handler supports it.
        // Looking at page.tsx, it calls generateStats(obj). 
        // We should probably update the Props interface to allow passing the full filter object.

        // HACK: We will modify the onGenerate prop in the next step or assume it can take more args 
        // OR we just pass the extra args and update the types.
        // Let's rely on the fact that we can change the ReportBuilder props definition to take ReportFilter object
        // instead of separate args. But to be safe and quick:
        // We will call onGenerate with the extra args (we'll need to update Props interface first or using `any`).
        // Actually, let's update Props interface right now in this same implementation.

        // Implementation note: The `onGenerate` prop currently is: (projectId: string, start: string, end: string) => Promise<void>;
        // We should change it to: (filters: ReportFilter) => Promise<void>;
        // But to avoid breaking the page.tsx in this single file edit, we will send the data 
        // via a side channel or just update the signature.
        // Let's update the signature in Props to be `(filter: any) => Promise<void>` to be flexible for now.
        await onGenerate({
            ...filters,
            project_id: filters.projectId,
            start_date: filters.start,
            end_date: filters.end,
            entity_id: 'all' // Default
        } as any);
    };

    const reportTypes = [
        { id: 'executive', label: 'Ejecutivo', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { id: 'operational', label: 'Operativo', icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        // Financial removed as requested
        { id: 'team', label: 'Recursos', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ];

    // Priority Data Transform
    const priorityData = stats?.tasks_by_priority
        ? Object.entries(stats.tasks_by_priority).map(([name, value]) => ({ name, value }))
        : [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* 1. Header & Type Selector */}
            <div className="glass-card p-2 flex flex-wrap items-center justify-between gap-4 sticky top-4 z-30 backdrop-blur-md">
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                    {reportTypes.map((type) => {
                        const Icon = type.icon;
                        const isActive = activeType === type.id;
                        return (
                            <button
                                key={type.id}
                                onClick={() => onTypeChange(type.id as ReportType)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${isActive
                                    ? 'bg-white dark:bg-slate-800 text-foreground shadow-sm scale-105'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? type.color : ''}`} />
                                {type.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn-secondary px-4 py-2 text-xs font-bold flex items-center gap-2 transition-all ${showFilters ? 'bg-primary/10 text-primary border-primary' : ''}`}
                    >
                        <Filter className="w-4 h-4" />
                        Filtros Avanzados
                    </button>
                    <button
                        onClick={() => stats && generateExecutivePDF(stats, "Reporte", filters.start, filters.end)}
                        disabled={!stats}
                        className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <Download className="w-4 h-4" />
                        Exportar PDF
                    </button>
                </div>
            </div>

            {/* 2. Configuration Panel */}
            <div className="glass-card p-6 space-y-6">
                {/* Standard Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Proyecto</label>
                        <select
                            className="w-full input-field"
                            value={filters.projectId}
                            onChange={(e) => setFilters(prev => ({ ...prev, projectId: e.target.value }))}
                        >
                            <option value="all">Todos los Proyectos</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Desde</label>
                        <input
                            type="date"
                            className="w-full input-field"
                            value={filters.start}
                            onChange={(e) => setFilters(prev => ({ ...prev, start: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Hasta</label>
                        <input
                            type="date"
                            className="w-full input-field"
                            value={filters.end}
                            onChange={(e) => setFilters(prev => ({ ...prev, end: e.target.value }))}
                        />
                    </div>
                    <button
                        onClick={handleRunReport}
                        disabled={loading}
                        className="btn-primary h-[42px] w-full flex items-center justify-center gap-2 font-black"
                    >
                        <Sparkles className="w-4 h-4" />
                        {loading ? 'Generando...' : 'Generar Reporte'}
                    </button>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">
                        {/* Status Filter */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Estados</label>
                            <div className="flex flex-wrap gap-2">
                                {['Pendiente', 'En Progreso', 'Revisión', 'Completado'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => {
                                            const current = filters.status || [];
                                            const updated = current.includes(status)
                                                ? current.filter(s => s !== status)
                                                : [...current, status];
                                            setFilters(prev => ({ ...prev, status: updated }));
                                        }}
                                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${(filters.status || []).includes(status)
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-transparent border-slate-200 dark:border-slate-700 text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Priority Filter */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Prioridad</label>
                            <div className="flex flex-wrap gap-2">
                                {['Alta', 'Media', 'Baja'].map(priority => (
                                    <button
                                        key={priority}
                                        onClick={() => {
                                            const current = filters.priority || [];
                                            const updated = current.includes(priority)
                                                ? current.filter(p => p !== priority)
                                                : [...current, priority];
                                            setFilters(prev => ({ ...prev, priority: updated }));
                                        }}
                                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${(filters.priority || []).includes(priority)
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-transparent border-slate-200 dark:border-slate-700 text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        {priority}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Assignee Filter */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Asignado a</label>
                            <select
                                className="w-full input-field"
                                value={filters.assignee_id || 'all'}
                                onChange={(e) => setFilters(prev => ({ ...prev, assignee_id: e.target.value }))}
                            >
                                <option value="all">Cualquiera</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Report Content Area */}
            {stats ? (
                <div className="space-y-8 min-h-[500px]">
                    {/* Executive View */}
                    {activeType === 'executive' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="col-span-1 lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <KpiCard title="Total Tareas" value={stats.total_tasks} color="blue" />
                                <KpiCard title="Completadas" value={stats.completed_tasks} color="emerald" />
                                <KpiCard title="Pendientes" value={stats.pending_tasks} color="amber" />
                                <KpiCard title="Progreso" value={`${stats.avg_progress}%`} color="purple" />
                            </div>
                            <BurndownChart
                                key={`burndown-${filters.projectId}-${stats.total_tasks}`}
                                data={burndownData}
                                title="Progreso de Ejecución (Burndown)"
                            />
                            <PriorityChart
                                key={`priority-${filters.projectId}-${stats.total_tasks}`}
                                data={priorityData}
                                title="Distribución por Prioridad"
                            />
                        </div>
                    )}

                    {/* Operational View */}
                    {activeType === 'operational' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <BurndownChart
                                key={`op-burndown-${filters.projectId}`}
                                data={burndownData}
                                title="Velocidad de Equipo"
                            />
                            <ResourceHeatmap
                                key={`op-heatmap-${filters.projectId}`}
                                data={resourceData}
                                title="Carga Operativa Actual"
                            />
                        </div>
                    )}

                    {/* Team View */}
                    {activeType === 'team' && (
                        <div className="grid grid-cols-1 gap-8">
                            <ResourceHeatmap data={resourceData} title="Matriz de Asignación y Eficiencia" />
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl opacity-50">
                    <Sparkles className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-lg font-bold text-slate-400">Configura los filtros para generar insights</p>
                </div>
            )}
        </div>
    );
}

function KpiCard({ title, value, color }: { title: string, value: string | number, color: string }) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-500/10 text-blue-600',
        emerald: 'bg-emerald-500/10 text-emerald-600',
        amber: 'bg-amber-500/10 text-amber-600',
        purple: 'bg-purple-500/10 text-purple-600',
    };

    return (
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{title}</p>
            <p className={`text-3xl font-black ${colors[color].split(' ')[1]}`}>{value}</p>
        </div>
    );
}
