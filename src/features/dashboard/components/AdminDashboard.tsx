import Link from 'next/link';
import {
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    TrendingUp,
    Activity,
    BarChart3,
    AlertTriangle,
    Clock,
    Users,
    CheckSquare,
    Calendar,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from 'recharts';
import { DashboardStats, ChartData } from '../hooks/useDashboardData';
import { PerformanceMetrics } from './PerformanceMetrics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UpcomingTask {
    id: string;
    title: string;
    end_date: string;
    priority: string;
    assignee?: { full_name: string };
}

export interface AdminDashboardProps {
    stats: DashboardStats;
    chartsData: ChartData;
    upcomingTasks?: UpcomingTask[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBudget(amount: number): string {
    if (amount === 0) return '$0';
    if (amount >= 1_000_000) {
        return `$${(amount / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 2 })}M`;
    }
    if (amount >= 1_000) {
        return `$${(amount / 1_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })}K`;
    }
    return `$${amount.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
}

function isMockEfficiencyData(trends: unknown[]): boolean {
    if (!Array.isArray(trends) || trends.length === 0) return true;
    const mockNames = ['S-4', 'S-3', 'S-2', 'S-1', 'Actual'];
    const allMockNames = trends.every(
        (t: unknown, i: number) => (t as Record<string, unknown>).name === mockNames[i]
    );
    if (allMockNames) return true;
    const allSame = trends.every(
        (t: unknown) =>
            (t as Record<string, unknown>).planned === (t as Record<string, unknown>).actual
    );
    return allSame;
}

function budgetTrendLabel(stats: DashboardStats): string | null {
    if (stats.totalBudget <= 0) return null;
    const pct = ((stats.totalActualCost / stats.totalBudget) * 100).toFixed(1);
    return `${pct}% ejecutado`;
}

function completionTrendLabel(stats: DashboardStats): string | null {
    if (stats.tasks === 0) return null;
    const done = Math.round(stats.avgTaskCompletion);
    return `${done}% completado`;
}

/** Relative date label: "Hoy", "Mañana", "En 3 días", "Hace 2 días" */
function relativeDueDate(dateStr: string): { label: string; isOverdue: boolean } {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: `Hace ${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? 's' : ''}`, isOverdue: true };
    if (diffDays === 0) return { label: 'Hoy', isOverdue: false };
    if (diffDays === 1) return { label: 'Mañana', isOverdue: false };
    return { label: `En ${diffDays} días`, isOverdue: false };
}

const PRIORITY_BADGE: Record<string, string> = {
    Alta: 'bg-red-500/10 text-red-600 dark:text-red-400',
    Media: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    Baja: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

const RISK_BADGE: Record<number, { label: string; cls: string }> = {
    100: { label: 'Crítico', cls: 'bg-red-500/10 text-red-600 dark:text-red-400' },
    80: { label: 'Alto', cls: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
    50: { label: 'Medio', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    20: { label: 'Bajo', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    10: { label: 'Mínimo', cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
};

function getRiskBadge(risk: number): { label: string; cls: string } {
    const keys = [100, 80, 50, 20, 10];
    for (const k of keys) {
        if (risk >= k) return RISK_BADGE[k];
    }
    return { label: 'Desconocido', cls: 'bg-slate-500/10 text-slate-500' };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const AdminDashboard = ({ stats, chartsData, upcomingTasks = [] }: AdminDashboardProps) => {
    const budgetTrend = budgetTrendLabel(stats);
    const completionTrend = completionTrendLabel(stats);
    const hasTrendData = !isMockEfficiencyData(chartsData.efficiencyTrends);

    const budgetRatio = stats.totalBudget > 0 ? stats.totalActualCost / stats.totalBudget : 0;
    const budgetTrendUp = budgetRatio <= 1;

    // Pipeline data from stats
    const totalPipelineProjects =
        (stats.activeProjects || 0) +
        (stats.pausedProjects || 0) +
        (stats.completedProjects || 0);

    // Determine "Bajo Revisión" count as the remainder
    const underReviewProjects = Math.max(
        0,
        stats.projects - (stats.activeProjects + stats.pausedProjects + stats.completedProjects)
    );

    const pipelineSegments = [
        { label: 'Activo', count: stats.activeProjects || 0, barColor: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Pausado', count: stats.pausedProjects || 0, barColor: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
        { label: 'Completado', count: stats.completedProjects || 0, barColor: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400' },
        { label: 'Bajo Revisión', count: underReviewProjects, barColor: 'bg-red-400', textColor: 'text-red-600 dark:text-red-400' },
    ].filter(s => s.count > 0);

    // Upcoming tasks: next 5 due within 7 days (include overdue)
    const visibleUpcoming = upcomingTasks
        .filter(t => t.end_date)
        .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
        .slice(0, 5);

    // Resource load: derive top 5 assignees by task count from chartsData.resourceLoad
    // The hook sets resourceLoad: [], so we fall back gracefully.
    const resourceLoad: Array<{ name: string; count: number }> = Array.isArray(chartsData.resourceLoad)
        ? (chartsData.resourceLoad as Array<{ name: string; count: number }>).slice(0, 5)
        : [];

    // Sort risk matrix descending by risk value
    const sortedRiskMatrix = [...chartsData.riskMatrix].sort(
        (a: { risk: number }, b: { risk: number }) => b.risk - a.risk
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* ================================================================
                ROW 1: Executive KPI Cards (clickable)
            ================================================================ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/proyectos" className="group/card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
                    <ExecutiveCard
                        title="Presupuesto Total"
                        value={formatBudget(stats.totalBudget)}
                        trend={budgetTrend ?? 'Sin datos'}
                        trendUp={budgetTrend !== null ? budgetTrendUp : null}
                        icon={<DollarSign className="w-5 h-5 text-indigo-500" />}
                        gradient="from-indigo-500/20 to-violet-500/20"
                    />
                </Link>

                <Link href="/tareas" className="group/card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
                    <ExecutiveCard
                        title="Índice Desempeño"
                        value={stats.tasks > 0 ? stats.performanceIndex.toFixed(2) : '—'}
                        trend="0.95 Objetivo"
                        trendUp={stats.tasks > 0 ? stats.performanceIndex >= 0.95 : null}
                        icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
                        gradient="from-blue-500/20 to-cyan-500/20"
                    />
                </Link>

                <Link href="/tareas" className="group/card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
                    <ExecutiveCard
                        title="Tareas Vencidas"
                        value={stats.overdueTasks > 0 ? `${stats.overdueTasks}` : '0'}
                        trend={stats.overdueTasks > 0 ? 'Requieren atención' : 'Sin vencidas'}
                        trendUp={stats.overdueTasks === 0 ? true : false}
                        icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
                        gradient="from-red-500/20 to-orange-500/20"
                    />
                </Link>

                <Link href="/reportes" className="group/card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
                    <ExecutiveCard
                        title="Tasa Completitud"
                        value={stats.tasks > 0 ? `${Math.round(stats.avgTaskCompletion)}%` : '—'}
                        trend={completionTrend ?? 'Sin tareas'}
                        trendUp={completionTrend !== null ? stats.avgTaskCompletion >= 50 : null}
                        icon={<Activity className="w-5 h-5 text-emerald-500" />}
                        gradient="from-emerald-500/20 to-teal-500/20"
                    />
                </Link>
            </div>

            {/* ================================================================
                ROW 2: Radar + Area Chart
            ================================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Radar: Corporate Health */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Radar de Salud Corporativa
                    </h3>
                    {chartsData.portfolioRadar.length > 0 ? (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartsData.portfolioRadar}>
                                    <PolarGrid strokeOpacity={0.2} />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#888' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="KPIs" dataKey="A" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyChart message="Sin datos suficientes para mostrar el radar de salud." />
                    )}
                </div>

                {/* Area Chart: Velocity Trend */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Tendencia de Velocidad
                    </h3>
                    {hasTrendData ? (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartsData.weeklyVelocity.length > 0 ? chartsData.weeklyVelocity : chartsData.efficiencyTrends}>
                                    <defs>
                                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                        }}
                                    />
                                    <Area type="monotone" dataKey="planned" stroke="#6366f1" strokeWidth={2} fill="transparent" />
                                    <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} fill="url(#colorActual)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyChart message="Sin datos suficientes para mostrar la tendencia de velocidad semanal." />
                    )}
                </div>
            </div>

            {/* ================================================================
                ROW 3: Pipeline + Upcoming Tasks + Workload
            ================================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Pipeline de Proyectos */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Pipeline de Proyectos
                    </h3>

                    {stats.projects === 0 ? (
                        <EmptyChart message="Sin proyectos registrados." />
                    ) : (
                        <div className="flex flex-col gap-4">
                            {/* Stacked horizontal bar */}
                            <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
                                {pipelineSegments.map(seg => (
                                    <div
                                        key={seg.label}
                                        className={`${seg.barColor} transition-all duration-500`}
                                        // eslint-disable-next-line react/forbid-component-props
                                        style={{
                                            width: `${((seg.count / (totalPipelineProjects || 1)) * 100).toFixed(1)}%`,
                                            minWidth: seg.count > 0 ? '6px' : '0',
                                        }}
                                        title={`${seg.label}: ${seg.count}`}
                                    />
                                ))}
                            </div>

                            {/* Legend */}
                            <div className="space-y-2.5">
                                {pipelineSegments.map(seg => (
                                    <div key={seg.label} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${seg.barColor}`} />
                                            <span className={`text-xs font-semibold ${seg.textColor}`}>{seg.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-foreground">{seg.count}</span>
                                            <span className="text-[10px] text-muted-foreground">
                                                ({((seg.count / (totalPipelineProjects || 1)) * 100).toFixed(0)}%)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-1 border-t border-slate-100 dark:border-white/5">
                                <p className="text-[10px] text-muted-foreground">
                                    {stats.projects} proyecto{stats.projects !== 1 ? 's' : ''} en total
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tareas Próximas a Vencer */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Próximas a Vencer
                    </h3>

                    {visibleUpcoming.length === 0 ? (
                        <EmptyChart message="Sin tareas próximas a vencer en los próximos 7 días." />
                    ) : (
                        <ul className="flex flex-col gap-3">
                            {visibleUpcoming.map(task => {
                                const { label, isOverdue } = relativeDueDate(task.end_date);
                                const priorityCls = PRIORITY_BADGE[task.priority] ?? 'bg-slate-500/10 text-slate-500';
                                return (
                                    <li key={task.id} className="flex items-start gap-3 group/task">
                                        <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOverdue ? 'bg-red-500' : 'bg-indigo-400'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-foreground truncate leading-tight">
                                                {task.title}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                <span
                                                    className={`text-[10px] font-bold flex items-center gap-0.5 ${
                                                        isOverdue ? 'text-red-500' : 'text-muted-foreground'
                                                    }`}
                                                >
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {label}
                                                </span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${priorityCls}`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {visibleUpcoming.length > 0 && (
                        <Link
                            href="/tareas"
                            className="mt-auto text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                        >
                            Ver todas las tareas <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    )}
                </div>

                {/* Distribución de Carga */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Users className="w-4 h-4" /> Distribución de Carga
                    </h3>

                    {resourceLoad.length === 0 ? (
                        <EmptyChart message="Sin datos de asignación disponibles. Asigna tareas a miembros del equipo para ver la carga." />
                    ) : (
                        <div className="flex flex-col gap-3">
                            {(() => {
                                const maxCount = Math.max(...resourceLoad.map(r => r.count), 1);
                                return resourceLoad.map(member => (
                                    <div key={member.name} className="flex items-center gap-3">
                                        <div className="w-24 shrink-0">
                                            <p className="text-[11px] font-semibold text-foreground truncate" title={member.name}>
                                                {member.name}
                                            </p>
                                        </div>
                                        <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                                                // eslint-disable-next-line react/forbid-component-props
                                                style={{ width: `${(member.count / maxCount) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-black text-foreground w-6 text-right">
                                            {member.count}
                                        </span>
                                    </div>
                                ));
                            })()}
                            <p className="text-[10px] text-muted-foreground pt-1">
                                Top {resourceLoad.length} por tareas asignadas
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ================================================================
                ROW 4: Performance Metrics
            ================================================================ */}
            <PerformanceMetrics />

            {/* ================================================================
                ROW 5: Risk Matrix
            ================================================================ */}
            {sortedRiskMatrix.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-5 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" /> Matriz de Riesgos
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs" aria-label="Matriz de riesgos del portafolio">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5">
                                    <th className="text-left py-2 pr-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                        Proyecto
                                    </th>
                                    <th className="text-center py-2 px-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                        Nivel de Riesgo
                                    </th>
                                    <th className="text-right py-2 px-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                        Impacto Presupuestal
                                    </th>
                                    <th className="text-center py-2 pl-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                        Prioridad
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                {sortedRiskMatrix.map((project: { name: string; risk: number; impact: number; priority: string }, idx: number) => {
                                    const badge = getRiskBadge(project.risk);
                                    const priorityCls = PRIORITY_BADGE[project.priority] ?? 'bg-slate-500/10 text-slate-500';
                                    return (
                                        <tr
                                            key={`${project.name}-${idx}`}
                                            className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="py-3 pr-4">
                                                <div className="flex items-center gap-2">
                                                    <CheckSquare className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                                                    <span className="font-semibold text-foreground truncate max-w-[180px]" title={project.name}>
                                                        {project.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full ${badge.cls}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className="font-bold text-foreground">
                                                    {formatBudget(project.impact * 1000)}
                                                </span>
                                            </td>
                                            <td className="py-3 pl-4 text-center">
                                                <span className={`inline-flex items-center text-[10px] font-bold uppercase px-2 py-1 rounded-full ${priorityCls}`}>
                                                    {project.priority || '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ExecutiveCardProps {
    title: string;
    value: string;
    trend: string;
    trendUp: boolean | null;
    icon: React.ReactNode;
    gradient: string;
}

function ExecutiveCard({ title, value, trend, trendUp, icon, gradient }: ExecutiveCardProps) {
    const badgeClass =
        trendUp === null
            ? 'bg-slate-100 dark:bg-white/5 text-muted-foreground'
            : trendUp
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-red-500/10 text-red-600';

    return (
        <div className="relative overflow-hidden group p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer h-full">
            <div
                className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${gradient} blur-3xl opacity-50 group-hover:opacity-100 transition-opacity`}
            />

            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
                    <h3 className="text-3xl font-black text-foreground tracking-tight">{value}</h3>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                    {icon}
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
                <span className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full ${badgeClass}`}>
                    {trendUp === true && <ArrowUpRight className="w-3 h-3" />}
                    {trendUp === false && <ArrowDownRight className="w-3 h-3" />}
                    {trend}
                </span>
                {trendUp !== null && (
                    <span className="text-[10px] text-muted-foreground font-medium">datos reales</span>
                )}
            </div>
        </div>
    );
}

interface EmptyChartProps {
    message: string;
}

function EmptyChart({ message }: EmptyChartProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 h-[200px] rounded-xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center px-6">
            <BarChart3 className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">{message}</p>
        </div>
    );
}
