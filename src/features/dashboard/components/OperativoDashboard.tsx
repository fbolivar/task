import { ArrowRight, CheckCircle2, Clock, Calendar, ListTodo } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardStats, ChartData } from '../hooks/useDashboardData';
import { FollowupLookupWidget } from './FollowupLookupWidget';

interface OperativoDashboardProps {
    stats: DashboardStats;
    chartsData: ChartData;
    upcomingTasks?: any[];
}

export const OperativoDashboard = ({ stats, chartsData, upcomingTasks }: OperativoDashboardProps) => {
    const COLORS = ['#ef4444', '#f59e0b', '#10b981']; // Pendiente (Red), Progreso (Amber), Compl (Emerald)

    // Helper to safely parse dates that works across browsers (including mobile Safari/Chrome)
    const safeDate = (dateStr: string | null | undefined): Date | null => {
        if (!dateStr) return null;
        // Try standard constructor
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;

        // Fallback for Safari/Mobile sometimes if format is weird, handled here if needed
        // For now, if invalid, return null to avoid crash
        return null;
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isOverdue = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MyStatCard
                    title="Tareas Pendientes"
                    value={stats.pendingTasks}
                    subtitle="Para esta semana"
                    icon={<ListTodo className="w-6 h-6 text-orange-500" />}
                    color="border-orange-500/20 bg-orange-500/5"
                />
                <MyStatCard
                    title="En Progreso"
                    value={stats.inProgressTasks}
                    subtitle="Tareas activas"
                    icon={<Clock className="w-6 h-6 text-blue-500" />}
                    color="border-blue-500/20 bg-blue-500/5"
                />
                <MyStatCard
                    title="Completadas"
                    value={stats.tasks - stats.pendingTasks}
                    subtitle="Total histórico"
                    icon={<CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                    color="border-emerald-500/20 bg-emerald-500/5"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Status Distribution */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">Estado de mis Tareas</h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        {chartsData?.taskStatusDistribution?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartsData.taskStatusDistribution}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartsData.taskStatusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-sm text-muted-foreground">Sin datos para mostrar</div>
                        )}
                    </div>
                </div>

                {/* Recent Activity / Next Tasks */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">Próximos Vencimientos</h3>
                    <div className="space-y-4">
                        {upcomingTasks && upcomingTasks.length > 0 ? (
                            upcomingTasks.map((task: any) => {
                                const d = safeDate(task.end_date);
                                // If invalid date, treat as far future or handling gracefully
                                if (!d) return null;

                                const overdue = isOverdue(d);
                                const today = isToday(d);

                                return (
                                    <div key={task.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-white/5 transition-all flex items-start gap-3 group">
                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${task.priority === 'Alta' ? 'bg-red-500' :
                                            task.priority === 'Media' ? 'bg-yellow-500' : 'bg-emerald-500'
                                            }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{task.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                                <span className={`text-xs font-medium ${overdue ? 'text-red-500' :
                                                    today ? 'text-orange-500' : 'text-muted-foreground'
                                                    }`}>
                                                    {today ? 'Hoy' : d.toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-white/5 border-dashed">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                                <p className="text-sm font-semibold text-muted-foreground">¡Todo al día!</p>
                                <p className="text-xs text-muted-foreground/60">No tienes tareas próximas a vencer.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- NEW: Followup Explorer --- */}
                <div className="md:col-span-1 lg:col-span-2">
                    <FollowupLookupWidget />
                </div>

            </div>
        </div>
    );
};

function MyStatCard({ title, value, subtitle, icon, color }: any) {
    return (
        <div className={`p-6 rounded-2xl border ${color} relative overflow-hidden group`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-4xl font-black tracking-tighter text-foreground">{value}</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">{title}</p>
                </div>
                <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-sm">
                    {icon}
                </div>
            </div>
            <p className="text-[10px] font-medium opacity-70">{subtitle}</p>
        </div>
    );
}
