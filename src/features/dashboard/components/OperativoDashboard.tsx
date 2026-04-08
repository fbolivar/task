import { useRouter } from 'next/navigation';
import { DashboardStats, ChartData } from '../hooks/useDashboardData';

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
    project?: { name: string } | null;
}

interface OperativoDashboardProps {
    stats: DashboardStats;
    chartsData: ChartData;
    upcomingTasks?: Task[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const diffDaysFromToday = (date: Date): number => {
    const today = startOfDay(new Date());
    const target = startOfDay(date);
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

type TaskBucket = 'overdue' | 'today' | 'week' | 'future';

const getBucket = (diffDays: number): TaskBucket => {
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    if (diffDays <= 7) return 'week';
    return 'future';
};

const BUCKET_ORDER: Record<TaskBucket, number> = {
    overdue: 0,
    today: 1,
    week: 2,
    future: 3,
};

const formatDueLabel = (diffDays: number, date: Date): string => {
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays === -1) return 'Vencida hace 1 día';
    if (diffDays < -1) return `Vencida hace ${Math.abs(diffDays)} días`;
    // This week — show day name
    if (diffDays <= 7) {
        return date.toLocaleDateString('es-CO', { weekday: 'long' })
            .replace(/^\w/, c => c.toUpperCase());
    }
    // Future — show "Vie 15"
    return date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' })
        .replace(/^\w/, c => c.toUpperCase());
};

const PRIORITY_DOT: Record<string, string> = {
    Alta: 'bg-red-500',
    Media: 'bg-amber-400',
    Baja: 'bg-emerald-500',
};

const LEFT_STRIPE: Record<TaskBucket, string> = {
    overdue: 'border-l-4 border-l-red-500',
    today: 'border-l-4 border-l-orange-400',
    week: 'border-l-4 border-l-transparent',
    future: 'border-l-4 border-l-transparent',
};

const DUE_LABEL_COLOR: Record<TaskBucket, string> = {
    overdue: 'text-red-500 dark:text-red-400',
    today: 'text-orange-500 dark:text-orange-400',
    week: 'text-slate-600 dark:text-slate-400',
    future: 'text-slate-400 dark:text-slate-500',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const OperativoDashboard = ({ stats, chartsData: _chartsData, upcomingTasks = [] }: OperativoDashboardProps) => {
    const router = useRouter();

    // Build sorted task list: all non-completed tasks, sorted by urgency
    const sortedTasks = upcomingTasks
        .filter(task => task.status !== 'Completada' && task.status !== 'Completado')
        .map(task => {
            const date = safeDate(task.end_date);
            const diffDays = date ? diffDaysFromToday(date) : 999;
            const bucket: TaskBucket = date ? getBucket(diffDays) : 'future';
            return { task, date, diffDays, bucket };
        })
        .sort((a, b) => {
            const bucketDiff = BUCKET_ORDER[a.bucket] - BUCKET_ORDER[b.bucket];
            if (bucketDiff !== 0) return bucketDiff;
            return a.diffDays - b.diffDays;
        });

    const completedCount = stats.tasks - stats.pendingTasks;

    return (
        <div className="space-y-6">

            {/* ── Section 1: Tus tareas (80% of the page) ─────────────────────── */}
            <section aria-label="Tus tareas">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden">

                    <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5">
                        <h2 className="text-base font-semibold text-foreground">Tus tareas</h2>
                    </div>

                    {sortedTasks.length === 0 ? (
                        <div className="px-5 py-16 text-center">
                            <p className="text-sm text-muted-foreground">
                                No tienes tareas asignadas. Disfruta tu día.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                            {sortedTasks.map(({ task, date, diffDays, bucket }) => {
                                const dueLabel = date ? formatDueLabel(diffDays, date) : '—';
                                const isOverdueBucket = bucket === 'overdue';

                                return (
                                    <li key={task.id}>
                                        <button
                                            type="button"
                                            onClick={() => router.push(`/tareas/${task.id}`)}
                                            className={`w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 ${LEFT_STRIPE[bucket]}`}
                                            aria-label={`Ver tarea: ${task.title}`}
                                        >
                                            {/* Task title + project */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm truncate ${isOverdueBucket ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>
                                                    {task.title}
                                                </p>
                                                {task.project?.name && (
                                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                        {task.project.name}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Due date label */}
                                            <span className={`shrink-0 text-xs ${DUE_LABEL_COLOR[bucket]}`}>
                                                {dueLabel}
                                            </span>

                                            {/* Priority dot */}
                                            <div
                                                className={`shrink-0 w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority] ?? 'bg-slate-300 dark:bg-slate-600'}`}
                                                title={task.priority}
                                                aria-label={`Prioridad: ${task.priority}`}
                                            />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </section>

            {/* ── Section 2: Quick stats (single line) ─────────────────────────── */}
            <section aria-label="Resumen de tareas">
                <p className="text-sm text-muted-foreground px-1">
                    <span>{stats.pendingTasks} pendientes</span>
                    <span className="mx-2 opacity-40">·</span>
                    <span>{stats.inProgressTasks} en progreso</span>
                    <span className="mx-2 opacity-40">·</span>
                    <span>{completedCount} completadas</span>
                </p>
            </section>

        </div>
    );
};
