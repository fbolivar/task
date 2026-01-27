import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Users, ShieldAlert, BarChart3, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { DashboardStats, ChartData } from '../hooks/useDashboardData';

interface AdminDashboardProps {
    stats: DashboardStats;
    chartsData: ChartData;
}

export const AdminDashboard = ({ stats, chartsData }: AdminDashboardProps) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ExecutiveCard
                    title="Presupuesto Total"
                    value={`$${(stats.totalBudget / 1000).toFixed(1)}K`}
                    trend="+12%"
                    trendUp={true}
                    icon={<DollarSign className="w-5 h-5 text-indigo-500" />}
                    gradient="from-indigo-500/20 to-violet-500/20"
                />
                <ExecutiveCard
                    title="Índice Desempeño"
                    value={stats.performanceIndex.toFixed(2)}
                    trend="0.95 Objetivo"
                    trendUp={stats.performanceIndex >= 0.95}
                    icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
                    gradient="from-blue-500/20 to-cyan-500/20"
                />
                <ExecutiveCard
                    title="Riesgo Portfolio"
                    value={`${chartsData.riskMatrix.filter((p: any) => p.risk > 50).length} Altos`}
                    trend="Crítico"
                    trendUp={false}
                    icon={<ShieldAlert className="w-5 h-5 text-red-500" />}
                    gradient="from-red-500/20 to-orange-500/20"
                />
                <ExecutiveCard
                    title="Tasa Completitud"
                    value={`${Math.round(stats.avgTaskCompletion)}%`}
                    trend="+5%"
                    trendUp={true}
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
                </div>

                {/* Area Chart: Financial Trend */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Tendencia de Eficiencia
                    </h3>
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
                </div>
            </div>
        </div>
    );
};

function ExecutiveCard({ title, value, trend, trendUp, icon, gradient }: any) {
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
                <span className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                    {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {trend}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">vs mes anterior</span>
            </div>
        </div>
    );
}
