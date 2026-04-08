'use client';

import { useState, useEffect } from 'react';
import {
    FileText, BarChart3, Users, Download, Sparkles, Filter, Package, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { BurndownChart } from './visualizations/BurndownChart';
import { ResourceHeatmap } from './visualizations/ResourceHeatmap';
import { PriorityChart } from './visualizations/PriorityChart';
import { InventoryReport } from './InventoryReport';
import { PeriodComparison } from './PeriodComparison';
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

export type ReportType = 'executive' | 'operational' | 'financial' | 'team' | 'inventory';

export function ReportBuilder({
    projects, stats, burndownData, resourceData, financialData, loading, onGenerate, activeType, onTypeChange
}: Props) {
    const { t } = useSettings();
    const [showFilters, setShowFilters] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [previousStats, setPreviousStats] = useState<ReportStats | null>(null);

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

    const handleExportExcel = () => {
        if (!stats) return;

        const wb = XLSX.utils.book_new();

        // Sheet 1: Resumen (KPI summary)
        const resumenData = [
            ['Indicador', 'Valor'],
            ['Total Tareas', stats.total_tasks],
            ['Tareas Completadas', stats.completed_tasks],
            ['Tareas Pendientes', stats.pending_tasks],
            ['Progreso Promedio (%)', stats.avg_progress],
        ];
        const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
        XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

        // Sheet 2: Equipo (team efficacy)
        if (stats.team_efficacy && stats.team_efficacy.length > 0) {
            const equipoHeader = ['Nombre', 'Email', 'Total Tareas', 'Completadas', 'Eficacia (%)', 'Puntualidad (%)', 'Eficiencia (%)'];
            const equipoRows = stats.team_efficacy.map(m => [
                m.full_name,
                m.email,
                m.total,
                m.completed,
                m.efficacy,
                m.punctuality,
                m.efficiency,
            ]);
            const wsEquipo = XLSX.utils.aoa_to_sheet([equipoHeader, ...equipoRows]);
            XLSX.utils.book_append_sheet(wb, wsEquipo, 'Equipo');
        }

        // Sheet 3: Proyectos
        if (stats.projects_list && stats.projects_list.length > 0) {
            const proyectosHeader = ['Nombre', 'Estado', 'Progreso (%)', 'Presupuesto', 'Nivel de Riesgo'];
            const proyectosRows = stats.projects_list.map(p => [
                p.name,
                p.status,
                p.progress,
                p.budget,
                p.risk_level,
            ]);
            const wsProyectos = XLSX.utils.aoa_to_sheet([proyectosHeader, ...proyectosRows]);
            XLSX.utils.book_append_sheet(wb, wsProyectos, 'Proyectos');
        }

        // Sheet 4: Tareas
        if (stats.tasks_list && stats.tasks_list.length > 0) {
            const tareasHeader = ['Titulo', 'Estado', 'Prioridad', 'Asignado A', 'Fecha Limite'];
            const tareasRows = stats.tasks_list.map(task => [
                task.title,
                task.status,
                task.priority,
                task.assigned_to_name,
                task.end_date,
            ]);
            const wsTareas = XLSX.utils.aoa_to_sheet([tareasHeader, ...tareasRows]);
            XLSX.utils.book_append_sheet(wb, wsTareas, 'Tareas');
        }

        const fileName = `reporte_${filters.start}_${filters.end}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

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

        // Generate previous-period stats for comparison (same duration, shifted back)
        const startDate = new Date(filters.start);
        const endDate = new Date(filters.end);
        const durationMs = endDate.getTime() - startDate.getTime();
        const prevEnd = new Date(startDate.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - durationMs);
        const prevStartStr = prevStart.toISOString().split('T')[0];
        const prevEndStr = prevEnd.toISOString().split('T')[0];

        try {
            const { generateReportStats } = await import('../actions/generateReport');
            const prevData = await generateReportStats({
                ...filters,
                project_id: filters.projectId,
                start_date: prevStartStr,
                end_date: prevEndStr,
                entity_id: 'all',
            } as any);
            setPreviousStats(prevData);
        } catch {
            setPreviousStats(null);
        }
    };

    const reportTypes = [
        { id: 'executive', label: 'Ejecutivo', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { id: 'operational', label: 'Operativo', icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        // Financial removed as requested
        { id: 'team', label: 'Recursos', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { id: 'inventory', label: 'Inventario', icon: Package, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ];

    // Priority Data Transform
    const priorityData = stats?.tasks_by_priority
        ? Object.entries(stats.tasks_by_priority).map(([name, value]) => ({ name, value }))
        : [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* 1. Header & Type Selector */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-xl w-full sm:w-auto overflow-x-auto border border-slate-200 dark:border-slate-800">
                    {reportTypes.map((type) => {
                        const Icon = type.icon;
                        const isActive = activeType === type.id;
                        return (
                            <button
                                key={type.id}
                                onClick={() => onTypeChange(type.id as ReportType)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${isActive
                                    ? 'bg-white dark:bg-slate-800 text-foreground shadow-md scale-105'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-slate-800/50'
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
                        onClick={handleExportExcel}
                        disabled={!stats}
                        className="btn-secondary px-4 py-2 text-xs font-bold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Exportar reporte en formato Excel"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                        Exportar Excel
                    </button>
                    <button
                        onClick={() => stats && generateExecutivePDF(stats, "Reporte", filters.start, filters.end)}
                        disabled={!stats}
                        className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Exportar reporte en formato PDF"
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
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm appearance-none cursor-pointer"
                            style={{ backgroundColor: '#020617', color: '#f8fafc' }}
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
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                            style={{ backgroundColor: '#020617', color: '#f8fafc' }}
                            value={filters.start}
                            onChange={(e) => setFilters(prev => ({ ...prev, start: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Hasta</label>
                        <input
                            type="date"
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                            style={{ backgroundColor: '#020617', color: '#f8fafc' }}
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
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm appearance-none cursor-pointer"
                                style={{ backgroundColor: '#020617', color: '#f8fafc' }}
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

            {/* 3. Report Preview Section */}
            {stats && (
                <section aria-label="Vista previa del reporte" className="space-y-6 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 print:shadow-none">
                    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <FileText className="w-5 h-5 text-primary" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Vista Previa del Reporte</h2>
                        <span className="ml-auto text-xs text-muted-foreground font-medium">
                            {filters.start} &mdash; {filters.end}
                        </span>
                    </div>

                    {/* KPI Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <KpiCard title="Total Tareas" value={stats.total_tasks} color="blue" />
                        <KpiCard title="Completadas" value={stats.completed_tasks} color="emerald" />
                        <KpiCard title="Pendientes" value={stats.pending_tasks} color="amber" />
                        <KpiCard title="Progreso" value={`${stats.avg_progress}%`} color="purple" />
                    </div>

                    {/* Top 10 Tasks Table */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest">Tareas (top 10)</h3>
                        {stats.tasks_list && stats.tasks_list.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                                <table className="w-full text-sm" aria-label="Vista previa de tareas">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900 text-left">
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Titulo</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prioridad</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Asignado</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha Limite</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {stats.tasks_list.slice(0, 10).map((task, i) => (
                                            <tr key={task.id ?? i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-foreground max-w-[220px] truncate">{task.title}</td>
                                                <td className="px-4 py-3"><PreviewStatusBadge status={task.status} /></td>
                                                <td className="px-4 py-3"><PreviewPriorityBadge priority={task.priority} /></td>
                                                <td className="px-4 py-3 text-muted-foreground">{task.assigned_to_name || '—'}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{task.end_date || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <PreviewEmptyState message="Sin tareas para este periodo" />
                        )}
                    </div>

                    {/* Top 5 Team Efficacy Table */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest">Eficacia del Equipo (top 5)</h3>
                        {stats.team_efficacy && stats.team_efficacy.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                                <table className="w-full text-sm" aria-label="Vista previa de eficacia del equipo">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900 text-left">
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Miembro</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Eficacia</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Puntualidad</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Completadas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {stats.team_efficacy.slice(0, 5).map((member, i) => (
                                            <tr key={member.id ?? i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                <td className="px-4 py-3 font-bold text-foreground">{member.full_name}</td>
                                                <td className="px-4 py-3 text-muted-foreground text-xs">{member.email}</td>
                                                <td className="px-4 py-3"><EfficacyBar value={member.efficacy} /></td>
                                                <td className="px-4 py-3"><EfficacyBar value={member.punctuality} color="emerald" /></td>
                                                <td className="px-4 py-3 font-bold text-foreground">{member.completed}/{member.total}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <PreviewEmptyState message="Sin datos de equipo para este periodo" />
                        )}
                    </div>
                </section>
            )}

            {/* 4. Report Content Area */}
            {activeType === 'inventory' ? (
                <InventoryReport />
            ) : stats ? (
                <div className="space-y-8 min-h-[500px]">
                    {/* Executive View */}
                    {activeType === 'executive' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="col-span-1 lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <KpiCard title="Total Tareas" value={stats.total_tasks} color="blue" />
                                    <KpiCard title="Completadas" value={stats.completed_tasks} color="emerald" />
                                    <KpiCard title="Pendientes" value={stats.pending_tasks} color="amber" />
                                    <KpiCard title="Progreso" value={`${stats.avg_progress}%`} color="purple" />
                                </div>
                                {burndownData && burndownData.length > 0 ? (
                                    <BurndownChart
                                        key={`burndown-${filters.projectId}-${stats.total_tasks}`}
                                        data={burndownData}
                                        title="Progreso de Ejecución (Burndown)"
                                    />
                                ) : (
                                    <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[240px]">
                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Progreso de Ejecución</p>
                                        <PreviewEmptyState message="Sin datos para este periodo" />
                                    </div>
                                )}
                                {priorityData.length > 0 ? (
                                    <PriorityChart
                                        key={`priority-${filters.projectId}-${stats.total_tasks}`}
                                        data={priorityData}
                                        title="Distribución por Prioridad"
                                    />
                                ) : (
                                    <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[240px]">
                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Distribución por Prioridad</p>
                                        <PreviewEmptyState message="Sin datos para este periodo" />
                                    </div>
                                )}
                            </div>
                            <PeriodComparison
                                currentStats={stats}
                                previousStats={previousStats}
                            />
                        </div>
                    )}

                    {/* Operational View */}
                    {activeType === 'operational' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {burndownData && burndownData.length > 0 ? (
                                <BurndownChart
                                    key={`op-burndown-${filters.projectId}`}
                                    data={burndownData}
                                    title="Velocidad de Equipo"
                                />
                            ) : (
                                <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[240px]">
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Velocidad de Equipo</p>
                                    <PreviewEmptyState message="Sin datos para este periodo" />
                                </div>
                            )}
                            {resourceData && resourceData.length > 0 ? (
                                <ResourceHeatmap
                                    key={`op-heatmap-${filters.projectId}`}
                                    data={resourceData}
                                    title="Carga Operativa Actual"
                                />
                            ) : (
                                <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[240px]">
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Carga Operativa Actual</p>
                                    <PreviewEmptyState message="Sin datos de recursos para este periodo" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Team View */}
                    {activeType === 'team' && (
                        <div className="grid grid-cols-1 gap-8">
                            {resourceData && resourceData.length > 0 ? (
                                <ResourceHeatmap data={resourceData} title="Matriz de Asignación y Eficiencia" />
                            ) : (
                                <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[300px]">
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Matriz de Asignación y Eficiencia</p>
                                    <PreviewEmptyState message="Sin miembros de equipo para este periodo" />
                                </div>
                            )}
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
        blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    };

    return (
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{title}</p>
            <p className={`text-3xl font-black ${colors[color].split(' ')[1]}`}>{value}</p>
        </div>
    );
}

function PreviewEmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center" role="status" aria-label={message}>
            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-400 dark:text-slate-600">{message}</p>
        </div>
    );
}

function PreviewStatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        'Completado': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        'En Progreso': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        'Pendiente': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        'Revision': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
        'Revisión': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    };
    const cls = map[status] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${cls}`}>
            {status}
        </span>
    );
}

function PreviewPriorityBadge({ priority }: { priority: string }) {
    const map: Record<string, string> = {
        'Alta': 'bg-red-500/10 text-red-600 dark:text-red-400',
        'Media': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        'Baja': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    };
    const cls = map[priority] ?? 'bg-slate-100 text-slate-600';
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${cls}`}>
            {priority}
        </span>
    );
}

// Discrete Tailwind width classes for 0–100 in steps of 5.
// All strings are static literals so Tailwind JIT includes them in the bundle.
const EFFICACY_WIDTH_CLASSES: Record<number, string> = {
    0: 'w-0', 5: 'w-[5%]', 10: 'w-[10%]', 15: 'w-[15%]', 20: 'w-[20%]',
    25: 'w-1/4', 30: 'w-[30%]', 35: 'w-[35%]', 40: 'w-[40%]', 45: 'w-[45%]',
    50: 'w-1/2', 55: 'w-[55%]', 60: 'w-[60%]', 65: 'w-[65%]', 70: 'w-[70%]',
    75: 'w-3/4', 80: 'w-[80%]', 85: 'w-[85%]', 90: 'w-[90%]', 95: 'w-[95%]',
    100: 'w-full',
};

function EfficacyBar({ value, color = 'blue' }: { value: number, color?: 'blue' | 'emerald' }) {
    const barColor = color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500';
    const pct = Math.min(100, Math.max(0, Math.round(value / 5) * 5));
    const widthClass = EFFICACY_WIDTH_CLASSES[pct] ?? 'w-0';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden min-w-[60px]" aria-hidden="true">
                <div className={`h-full rounded-full transition-all ${barColor} ${widthClass}`} />
            </div>
            <span className="text-xs font-bold text-foreground w-8 text-right">{value}%</span>
        </div>
    );
}
