import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, ListTodo, Calendar, AlertTriangle, ChevronRight, PartyPopper } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DashboardStats, ChartData } from '../hooks/useDashboardData';
import { FollowupLookupWidget } from './FollowupLookupWidget';

interface Task {
    id: string;
    title: string;
    status: string;
    end_date: string;
    priority: string;
    project_id: string;
    assigned_to: string;
    created_at: string;
    estimated_hours: number | null;
    actual_hours: number | null;
}

interface OperativoDashboardProps {
    stats: DashboardStats;
    chartsData: ChartData;
    upcomingTasks?: Task[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const safeDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
};

const startOfDay = (d: Date): Date => {
    const c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return c;
};

const isToday = (date: Date): boolean => {
    const today = startOfDay(new Date());
    const target = startOfDay(date);
    return target.getTime() === today.getTime();
};

const isTomorrow = (date: Date): boolean => {
    const tomorrow = startOfDay(new Date());
    tomorrow.setDate(tomorrow.getDate() + 1);
    return startOfDay(date).getTime() === tomorrow.getTime();
};

const isOverdue = (date: Date): boolean => startOfDay(date) < startOfDay(new Date());

const isThisWeek = (date: Date): boolean => {
    const today = startOfDay(new Date());
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return startOfDay(date) <= weekEnd && startOfDay(date) > today;
};

const relativeDateLabel = (date: Date): string => {
    const today = startOfDay(new Date());
    const target = startOfDay(date);
    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Manana';
    if (diffDays === -1) return 'Vencida hace 1 dia';
    if (diffDays < -1) return `Vencida hace ${Math.abs(diffDays)} dias`;
    if (diffDays > 1) return `En ${diffDays} dias`;
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
};

const PRIORITY_DOT: Record<string, string> = {
    Alta: 'bg-red-500',
    Media: 'bg-amber-400',
    Baja: 'bg-emerald-500',
};

const PRIORITY_LABEL_COLOR: Record<string, string> = {
    Alta: 'text-red-500 dark:text-red-400',
    Media: 'text-amber-500 dark:text-amber-400',
    Baja: 'text-emerald-600 dark:text-emerald-400',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
    'Pendiente': <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />,
    'En Progreso': <div className="w-4 h-4 rounded-full border-2 border-teal-500 bg-teal-500/20 shrink-0" />,
};

const PIE_COLORS = ['#ef4444', '#f59e0b', '#2D6A5A'];

// ─── Main Component ───────────────────────────────────────────────────────────

export const OperativoDashboard = ({ stats, chartsData, upcomingTasks = [] }: OperativoDashboardProps) => {
    const router = useRouter();

    // Filter tasks for hero section: overdue + today + this week
    const heroTasks = upcomingTasks.filter((task) => {
        const d = safeDate(task.end_date);
        if (!d) return false;
        return isOverdue(d) || isToday(d) || isThisWeek(d);
    });

    // Upcoming (beyond this week) for the timeline panel
    const timelineTasks = upcomingTasks.slice(0, 8);

    const completedCount = stats.tasks - stats.pendingTasks;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ── SECTION 1: Hero — Mis Tareas de Hoy ─────────────────────────── */}
            <section aria-label="Mis Tareas de Hoy">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <ListTodo className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-foreground tracking-tight">Mis Tareas de Hoy</h2>
                                <p className="text-xs text-muted-foreground font-medium">
                                    Esta semana · {heroTasks.length} tarea{heroTasks.length !== 1 ? 's' : ''} pendiente{heroTasks.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        {heroTasks.length > 0 && (
                            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                                {heroTasks.filter(t => { const d = safeDate(t.end_date); return d && isOverdue(d); }).length > 0
                                    ? `${heroTasks.filter(t => { const d = safeDate(t.end_date); return d && isOverdue(d); }).length} vencida${heroTasks.filter(t => { const d = safeDate(t.end_date); return d && isOverdue(d); }).length !== 1 ? 's' : ''}`
                                    : 'Al dia'}
                            </span>
                        )}
                    </div>

                    {/* Task list */}
                    {heroTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 px-6 gap-3">
                            <div className="p-4 bg-emerald-500/10 rounded-2xl">
                                <PartyPopper className="w-8 h-8 text-emerald-500" />
                            </div>
                            <p className="text-base font-black text-foreground">Todo al dia!</p>
                            <p className="text-sm text-muted-foreground text-center max-w-xs">
                                No tienes tareas pendientes para esta semana. Buen trabajo.
                            </p>
                        </div>
                    ) : (
                        <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-50 dark:divide-white/[0.03]">
                            {heroTasks.map((task) => {
                                const d = safeDate(task.end_date)!;
                                const overdue = isOverdue(d);
                                const today = isToday(d);
                                const tomorrow = isTomorrow(d);
                                const label = relativeDateLabel(d);

                                const dateColor = overdue
                                    ? 'text-red-500 dark:text-red-400'
                                    : today
                                        ? 'text-orange-500 dark:text-orange-400'
                                        : tomorrow
                                            ? 'text-amber-500 dark:text-amber-400'
                                            : 'text-muted-foreground';

                                const rowBg = overdue
                                    ? 'bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    : today
                                        ? 'bg-orange-50/40 dark:bg-orange-900/10 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40';

                                return (
                                    <button
                                        type="button"
                                        key={task.id}
                                        onClick={() => router.push(`/tareas/${task.id}`)}
                                        className={`w-full flex items-center gap-4 px-6 py-3.5 transition-colors group text-left ${rowBg}`}
                                        aria-label={`Ver tarea: ${task.title}`}
                                    >
                                        {/* Status indicator */}
                                        <div className="shrink-0">
                                            {STATUS_ICON[task.status] ?? (
                                                <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                                            )}
                                        </div>

                                        {/* Title */}
                                        <span className="flex-1 min-w-0 text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                            {task.title}
                                        </span>

                                        {/* Due date */}
                                        <span className={`shrink-0 flex items-center gap-1.5 text-xs font-bold ${dateColor}`}>
                                            {overdue && <AlertTriangle className="w-3 h-3" />}
                                            {!overdue && <Calendar className="w-3 h-3 opacity-60" />}
                                            {label}
                                        </span>

                                        {/* Priority dot */}
                                        <div
                                            className={`shrink-0 w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority] ?? 'bg-slate-300'}`}
                                            title={task.priority}
                                        />

                                        {/* Arrow */}
                                        <ChevronRight className="shrink-0 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* ── SECTION 2: Compact stat cards ───────────────────────────────── */}
            <section aria-label="Resumen de tareas" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <CompactStatCard
                    title="Pendientes"
                    value={stats.pendingTasks}
                    icon={<ListTodo className="w-4 h-4 text-amber-500" />}
                    color="border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/[0.07]"
                    valueColor="text-amber-600 dark:text-amber-400"
                />
                <CompactStatCard
                    title="En Progreso"
                    value={stats.inProgressTasks}
                    icon={<Clock className="w-4 h-4 text-teal-600" />}
                    color="border-teal-500/20 bg-teal-500/5 dark:bg-teal-500/[0.07]"
                    valueColor="text-teal-700 dark:text-teal-400"
                />
                <CompactStatCard
                    title="Completadas"
                    value={completedCount}
                    icon={<CheckCircle2 className="w-4 h-4 text-primary" />}
                    color="border-primary/20 bg-primary/5 dark:bg-primary/[0.07]"
                    valueColor="text-primary"
                />
            </section>

            {/* ── SECTION 3: Chart + Timeline ─────────────────────────────────── */}
            <section aria-label="Distribucion y proximos vencimientos" className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Pie chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                        Estado de mis Tareas
                    </h3>
                    <div className="h-[220px] w-full flex items-center justify-center">
                        {chartsData?.taskStatusDistribution?.some(d => d.value > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartsData.taskStatusDistribution}
                                        innerRadius={50}
                                        outerRadius={72}
                                        paddingAngle={4}
                                        dataKey="value"
                                        label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                                        labelLine={false}
                                    >
                                        {chartsData.taskStatusDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                        }}
                                    />
                                    <Legend
                                        iconType="circle"
                                        iconSize={8}
                                        formatter={(value) => (
                                            <span className="text-[11px] font-semibold">{value}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-sm text-muted-foreground">Sin datos para mostrar</div>
                        )}
                    </div>
                </div>

                {/* Upcoming timeline */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                        Proximos Vencimientos
                    </h3>

                    {timelineTasks.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2">
                            <CheckCircle2 className="w-7 h-7 text-primary opacity-40" />
                            <p className="text-sm font-semibold text-muted-foreground">No tienes tareas proximas a vencer.</p>
                        </div>
                    ) : (
                        <ol className="relative space-y-0 border-l border-slate-200 dark:border-white/10 ml-2">
                            {timelineTasks.map((task, idx) => {
                                const d = safeDate(task.end_date);
                                if (!d) return null;
                                const overdue = isOverdue(d);
                                const today = isToday(d);
                                const label = relativeDateLabel(d);

                                const dotColor = overdue
                                    ? 'bg-red-500'
                                    : today
                                        ? 'bg-orange-500'
                                        : 'bg-primary';

                                const labelColor = overdue
                                    ? 'text-red-500 dark:text-red-400'
                                    : today
                                        ? 'text-orange-500 dark:text-orange-400'
                                        : 'text-muted-foreground';

                                return (
                                    <li key={task.id} className="relative pl-6 pb-4 last:pb-0 group">
                                        {/* Timeline dot */}
                                        <span
                                            className={`absolute -left-[5px] top-[5px] w-2.5 h-2.5 rounded-full ${dotColor} ring-2 ring-white dark:ring-slate-900`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => router.push(`/tareas/${task.id}`)}
                                            className="w-full text-left"
                                            aria-label={`Ver tarea: ${task.title}`}
                                        >
                                            <p className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors truncate pr-2">
                                                {task.title}
                                            </p>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className={`text-xs font-bold ${labelColor}`}>
                                                    {label}
                                                </span>
                                                <span className={`text-[10px] font-bold uppercase tracking-wide ${PRIORITY_LABEL_COLOR[task.priority] ?? 'text-muted-foreground'}`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </div>
            </section>

            {/* ── SECTION 4: Followup lookup ───────────────────────────────────── */}
            <section aria-label="Buscador de seguimientos">
                <FollowupLookupWidget />
            </section>

        </div>
    );
};

// ─── Compact Stat Card ────────────────────────────────────────────────────────

interface CompactStatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    valueColor: string;
}

function CompactStatCard({ title, value, icon, color, valueColor }: CompactStatCardProps) {
    return (
        <div className={`flex items-center gap-4 px-5 py-3 rounded-2xl border ${color}`}>
            <div className="p-2 bg-white/60 dark:bg-black/20 rounded-xl backdrop-blur-sm shrink-0">
                {icon}
            </div>
            <div className="min-w-0">
                <p className={`text-2xl font-black tracking-tighter leading-none ${valueColor}`}>{value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5 truncate">{title}</p>
            </div>
        </div>
    );
}
