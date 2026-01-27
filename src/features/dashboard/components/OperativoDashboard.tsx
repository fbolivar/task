import { ArrowRight, CheckCircle2, Clock, Calendar, ListTodo } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardStats, ChartData } from '../hooks/useDashboardData';

interface OperativoDashboardProps {
    stats: DashboardStats;
    chartsData: ChartData;
}

export const OperativoDashboard = ({ stats, chartsData }: OperativoDashboardProps) => {
    const COLORS = ['#ef4444', '#f59e0b', '#10b981']; // Pendiente (Red), Progreso (Amber), Compl (Emerald)

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
                    </div>
                </div>

                {/* Recent Activity / Next Tasks */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">Próximos Vencimientos</h3>
                    <div className="space-y-4">
                        {/* This would ideally come from useDashboardData sorted by due date, for now using stats or placeholder list if not in chartsData */}
                        {stats.overdueTasks > 0 && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl flex items-center gap-4">
                                <div className="p-2 bg-red-100 dark:bg-red-800/20 rounded-lg text-red-600">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-red-700 dark:text-red-400">Tienes {stats.overdueTasks} tareas vencidas</p>
                                    <p className="text-xs text-red-600/80">Revisa tu lista de pendientes urgente.</p>
                                </div>
                                <ArrowRight className="ml-auto w-4 h-4 text-red-500" />
                            </div>
                        )}

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center text-sm text-muted-foreground">
                            Revisa el módulo de "Mis Tareas" para más detalles.
                        </div>
                    </div>
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
