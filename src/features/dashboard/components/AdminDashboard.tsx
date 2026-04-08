import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, ShieldAlert, BarChart3, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { DashboardStats, ChartData } from '../hooks/useDashboardData';
import { PerformanceMetrics } from './PerformanceMetrics';

interface AdminDashboardProps {
    stats: DashboardStats;
    chartsData: ChartData;
}

/** Format a currency amount without fake rounding tricks.
 *  Uses locale formatting and picks the right suffix (K / M) only when the
 *  number is large enough to warrant it, preserving precision otherwise.
 */
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

/** Returns true when the efficiency-trends array coming from the hook still
 *  contains the known hard-coded sentinel values (S-4 / S-3 … pattern with
 *  exactly the same static numbers).  When this is the case we refuse to
 *  render them as if they were real metrics.
 */
function isMockEfficiencyData(trends: any[]): boolean {
    if (!Array.isArray(trends) || trends.length === 0) return true;

    // The hook hard-codes five entries with names S-4, S-3, S-2, S-1, Actual
    // and specific planned/actual pairs. Detect this fingerprint.
    const mockNames = ['S-4', 'S-3', 'S-2', 'S-1', 'Actual'];
    const allMockNames = trends.every((t: any, i: number) => t.name === mockNames[i]);
    if (allMockNames) return true;

    // Also treat it as mock if every entry has identical planned and actual values
    // (trivially fabricated data).
    const allSame = trends.every((t: any) => t.planned === t.actual);
    return allSame;
}

/** Derive a budget-vs-cost trend label from real stats.
 *  Returns null when there is not enough data to compute a meaningful delta.
 */
function budgetTrendLabel(stats: DashboardStats): string | null {
    if (stats.totalBudget <= 0) return null;
    const pct = ((stats.totalActualCost / stats.totalBudget) * 100).toFixed(1);
    return `${pct}% ejecutado`;
}

/** Derive a completion trend label.  Returns null when there are no tasks. */
function completionTrendLabel(stats: DashboardStats): string | null {
    if (stats.tasks === 0) return null;
    const done = Math.round(stats.avgTaskCompletion);
    return `${done}% completado`;
}

export const AdminDashboard = ({ stats, chartsData }: AdminDashboardProps) => {
    const budgetTrend = budgetTrendLabel(stats);
    const completionTrend = completionTrendLabel(stats);
    const hasTrendData = !isMockEfficiencyData(chartsData.efficiencyTrends);

    // Budget execution ratio determines whether the trend arrow is "good" or "bad".
    // Under-budget execution (< 100 %) is neutral-positive; over-budget is negative.
    const budgetRatio = stats.totalBudget > 0 ? stats.totalActualCost / stats.totalBudget : 0;
    const budgetTrendUp = budgetRatio <= 1;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ExecutiveCard
                    title="Presupuesto Total"
                    value={formatBudget(stats.totalBudget)}
                    trend={budgetTrend ?? 'Sin datos'}
                    trendUp={budgetTrend !== null ? budgetTrendUp : null}
                    icon={<DollarSign className="w-5 h-5 text-indigo-500" />}
                    gradient="from-indigo-500/20 to-violet-500/20"
                />
                <ExecutiveCard
                    title="Índice Desempeño"
                    value={stats.tasks > 0 ? stats.performanceIndex.toFixed(2) : '—'}
                    trend="0.95 Objetivo"
                    trendUp={stats.tasks > 0 ? stats.performanceIndex >= 0.95 : null}
                    icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
                    gradient="from-blue-500/20 to-cyan-500/20"
                />
                <ExecutiveCard
                    title="Riesgo Portfolio"
                    value={
                        chartsData.riskMatrix.length > 0
                            ? `${chartsData.riskMatrix.filter((p: any) => p.risk > 50).length} Altos`
                            : '—'
                    }
                    trend={chartsData.riskMatrix.length > 0 ? 'Crítico' : 'Sin proyectos'}
                    trendUp={false}
                    icon={<ShieldAlert className="w-5 h-5 text-red-500" />}
                    gradient="from-red-500/20 to-orange-500/20"
                />
                <ExecutiveCard
                    title="Tasa Completitud"
                    value={stats.tasks > 0 ? `${Math.round(stats.avgTaskCompletion)}%` : '—'}
                    trend={completionTrend ?? 'Sin tareas'}
                    trendUp={completionTrend !== null ? stats.avgTaskCompletion >= 50 : null}
                    icon={<Activity className="w-5 h-5 text-emerald-500" />}
                    gradient="from-emerald-500/20 to-teal-500/20"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Radar Chart: Health */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Salud Corporativa
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

                {/* Area Chart: Efficiency Trend */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Tendencia de Eficiencia
                    </h3>
                    {hasTrendData ? (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartsData.efficiencyTrends}>
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
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="planned" stroke="#6366f1" strokeWidth={2} fill="transparent" />
                                    <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} fill="url(#colorActual)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyChart message="Sin datos suficientes para mostrar la tendencia de eficiencia semanal." />
                    )}
                </div>
            </div>
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
    /** null means "unknown / no data" — renders a neutral grey badge */
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
        <div className="relative overflow-hidden group p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${gradient} blur-3xl opacity-50 group-hover:opacity-100 transition-opacity`} />

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
        <div className="flex flex-col items-center justify-center gap-3 h-[300px] rounded-xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center px-6">
            <BarChart3 className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">{message}</p>
        </div>
    );
}
