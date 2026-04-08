'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, isBefore, subWeeks, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Clock, AlertCircle, BarChart2, ListChecks, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MyTask {
    id: string;
    title: string;
    status: string;
    priority: string;
    end_date: string | null;
    estimated_hours: number;
    actual_hours: number;
    project?: { id: string; name: string } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
    'Pendiente':   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    'En Progreso': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    'Revisión':    'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    'Completado':  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
};

const PRIORITY_STYLES: Record<string, string> = {
    'Baja':  'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    'Media': 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
    'Alta':  'bg-red-500/10 text-red-700 dark:text-red-400',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    accentClass,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: string;
    accentClass?: string;
}) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex gap-4 items-start">
            <div className={`mt-0.5 p-2.5 rounded-lg ${accentClass ?? 'bg-slate-100 dark:bg-slate-800'}`}>
                <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">{label}</p>
                <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function Badge({ label, className }: { label: string; className: string }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}>
            {label}
        </span>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OperativoReport() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<MyTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!user?.id) return;

        const fetchMyTasks = async () => {
            setLoading(true);
            setError(false);
            try {
                const supabase = createClient();
                const { data, error: fetchError } = await supabase
                    .from('tasks')
                    .select(`
                        id,
                        title,
                        status,
                        priority,
                        end_date,
                        estimated_hours,
                        actual_hours,
                        project:project_id(id, name)
                    `)
                    .eq('assigned_to', user.id)
                    .order('end_date', { ascending: true, nullsFirst: false });

                if (fetchError) throw fetchError;
                setTasks((data ?? []) as unknown as MyTask[]);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchMyTasks();
    }, [user?.id]);

    // ── Derived metrics ──
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd   = endOfMonth(now);

    const stats = useMemo(() => {
        const totalAssigned = tasks.length;

        const completedThisMonth = tasks.filter((t) => {
            if (t.status !== 'Completado') return false;
            if (!t.end_date) return false;
            try {
                const d = parseISO(t.end_date);
                return isWithinInterval(d, { start: monthStart, end: monthEnd });
            } catch {
                return false;
            }
        }).length;

        const overdue = tasks.filter((t) => {
            if (t.status === 'Completado') return false;
            if (!t.end_date) return false;
            try {
                return isBefore(parseISO(t.end_date), now);
            } catch {
                return false;
            }
        }).length;

        const tasksWithHours = tasks.filter((t) => t.estimated_hours > 0 && t.actual_hours > 0);
        const avgEfficiency =
            tasksWithHours.length > 0
                ? Math.round(
                      (tasksWithHours.reduce((sum, t) => sum + t.actual_hours / t.estimated_hours, 0) /
                          tasksWithHours.length) *
                          100
                  )
                : null;

        return { totalAssigned, completedThisMonth, overdue, avgEfficiency, tasksWithHours: tasksWithHours.length };
    }, [tasks, monthStart, monthEnd, now]);

    // ── Weekly productivity (last 4 weeks) ──
    const weeklyData = useMemo(() => {
        const weeks = Array.from({ length: 4 }, (_, i) => {
            const anchor = subWeeks(now, 3 - i);
            return {
                label: format(startOfWeek(anchor, { locale: es }), 'd MMM', { locale: es }),
                start: startOfWeek(anchor, { locale: es }),
                end:   endOfWeek(anchor, { locale: es }),
                count: 0,
            };
        });

        tasks.forEach((t) => {
            if (t.status !== 'Completado' || !t.end_date) return;
            try {
                const d = parseISO(t.end_date);
                weeks.forEach((w) => {
                    if (isWithinInterval(d, { start: w.start, end: w.end })) {
                        w.count += 1;
                    }
                });
            } catch {
                // ignore
            }
        });

        return weeks;
    }, [tasks, now]);

    const maxWeekCount = Math.max(...weeklyData.map((w) => w.count), 1);

    // ── Loading / Error states ──
    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Cargando tus tareas...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
                <p className="text-sm font-semibold text-foreground">No se pudo cargar la informacion</p>
                <p className="text-xs text-muted-foreground">Verifica tu conexion e intenta de nuevo.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">

            {/* ── Page heading ── */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Mis Metricas</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Tu actividad y estado de tareas asignadas · {format(now, 'MMMM yyyy', { locale: es })}
                </p>
            </div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={ListChecks}
                    label="Tareas asignadas"
                    value={stats.totalAssigned}
                    sub="Total activas e históricas"
                    accentClass="bg-blue-500/10"
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Completadas este mes"
                    value={stats.completedThisMonth}
                    sub={format(now, 'MMMM yyyy', { locale: es })}
                    accentClass="bg-emerald-500/10"
                />
                <StatCard
                    icon={AlertCircle}
                    label="Tareas vencidas"
                    value={stats.overdue}
                    sub="Pendientes con fecha pasada"
                    accentClass={stats.overdue > 0 ? 'bg-red-500/10' : 'bg-slate-100 dark:bg-slate-800'}
                />
                <StatCard
                    icon={Clock}
                    label="Eficiencia de horas"
                    value={stats.avgEfficiency !== null ? `${stats.avgEfficiency}%` : '—'}
                    sub={
                        stats.tasksWithHours > 0
                            ? `Basado en ${stats.tasksWithHours} tarea${stats.tasksWithHours !== 1 ? 's' : ''}`
                            : 'Sin datos de horas aun'
                    }
                    accentClass="bg-violet-500/10"
                />
            </div>

            {/* ── Productivity mini-chart ── */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-center gap-2 mb-5">
                    <BarChart2 className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Tareas completadas por semana</h2>
                    <span className="text-xs text-muted-foreground ml-1">(ultimas 4 semanas)</span>
                </div>

                <div className="flex items-end gap-3 h-24">
                    {weeklyData.map((week) => {
                        const pct = (week.count / maxWeekCount) * 100;
                        return (
                            <div key={week.label} className="flex-1 flex flex-col items-center gap-1.5">
                                <span className="text-xs font-semibold text-foreground">{week.count}</span>
                                <div
                                    className="w-full rounded-t bg-blue-500 dark:bg-blue-400 transition-all duration-500"
                                    style={{ height: `${Math.max(pct, 4)}%` }}
                                    role="img"
                                    aria-label={`Semana del ${week.label}: ${week.count} tareas`}
                                />
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{week.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Mis Tareas table ── */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <ListChecks className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Mis Tareas</h2>
                    <span className="ml-1 text-[10px] bg-slate-100 dark:bg-slate-800 text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                        {tasks.length}
                    </span>
                </div>

                {tasks.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                        <ListChecks className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No tienes tareas asignadas.</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tarea</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Proyecto</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Prioridad</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Vencimiento</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Horas E/R</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {tasks.map((task) => {
                                        const isOverdue =
                                            task.status !== 'Completado' &&
                                            task.end_date &&
                                            isBefore(parseISO(task.end_date), now);

                                        let dueDateStr = '—';
                                        if (task.end_date) {
                                            try {
                                                dueDateStr = format(parseISO(task.end_date), 'd MMM yyyy', { locale: es });
                                            } catch {
                                                dueDateStr = task.end_date;
                                            }
                                        }

                                        return (
                                            <tr
                                                key={task.id}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <span className="font-medium text-foreground line-clamp-1">{task.title}</span>
                                                    {/* Mobile: extra info */}
                                                    <div className="flex flex-wrap gap-1.5 mt-1 sm:hidden">
                                                        <Badge
                                                            label={task.status}
                                                            className={STATUS_STYLES[task.status] ?? 'bg-slate-100 text-slate-600'}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 hidden sm:table-cell">
                                                    <span className="text-xs text-muted-foreground">
                                                        {task.project?.name ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        label={task.status}
                                                        className={STATUS_STYLES[task.status] ?? 'bg-slate-100 text-slate-600'}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 hidden md:table-cell">
                                                    <Badge
                                                        label={task.priority}
                                                        className={PRIORITY_STYLES[task.priority] ?? 'bg-slate-100 text-slate-600'}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 hidden lg:table-cell">
                                                    <span
                                                        className={`text-xs ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-muted-foreground'}`}
                                                    >
                                                        {dueDateStr}
                                                        {isOverdue && ' (vencida)'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right hidden lg:table-cell">
                                                    <span className="text-xs text-muted-foreground font-mono">
                                                        {task.estimated_hours}h / {task.actual_hours}h
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
        </div>
    );
}
