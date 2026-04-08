'use client';

import { useState, useEffect, useRef } from 'react';
import { Zap, Target, Clock, Layers } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/features/auth/store/authStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WeekBucket {
    label: string;
    count: number;
}

interface PerformanceData {
    /** Completed tasks per week for the last 4 weeks, oldest first */
    weeklyVelocity: WeekBucket[];
    /** Percentage of completed tasks delivered on or before end_date */
    onTimeRate: number | null;
    /** Total estimated hours vs total actual hours across all tasks */
    estimatedHours: number;
    actualHours: number;
    /** Project counts keyed by status */
    projectsByStatus: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Data fetching hook
// ---------------------------------------------------------------------------

function usePerformanceData(): { data: PerformanceData | null; loading: boolean } {
    const { activeEntityId } = useAuthStore();
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    const [data, setData] = useState<PerformanceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            setLoading(true);
            try {
                // ---- 1. Resolve project ids for entity filter ----
                let projectIds: string[] | null = null;
                if (activeEntityId !== 'all') {
                    const { data: projs } = await supabase
                        .from('projects')
                        .select('id')
                        .eq('entity_id', activeEntityId);
                    projectIds = (projs ?? []).map((p: { id: string }) => p.id);
                }

                // ---- 2. Tasks query ----
                let tasksQuery = supabase
                    .from('tasks')
                    .select('id, status, end_date, estimated_hours, actual_hours, updated_at, created_at');

                if (projectIds !== null) {
                    if (projectIds.length === 0) {
                        // No projects in this entity — short circuit
                        if (!cancelled) {
                            setData({
                                weeklyVelocity: buildEmptyWeeks(),
                                onTimeRate: null,
                                estimatedHours: 0,
                                actualHours: 0,
                                projectsByStatus: {},
                            });
                            setLoading(false);
                        }
                        return;
                    }
                    tasksQuery = tasksQuery.in('project_id', projectIds);
                }

                // ---- 3. Projects query ----
                let projectsQuery = supabase
                    .from('projects')
                    .select('id, status');
                if (activeEntityId !== 'all') {
                    projectsQuery = projectsQuery.eq('entity_id', activeEntityId);
                }

                const [{ data: tasks }, { data: projects }] = await Promise.all([
                    tasksQuery,
                    projectsQuery,
                ]);

                if (cancelled) return;

                const allTasks: Array<{
                    id: string;
                    status: string;
                    end_date: string | null;
                    estimated_hours: number | null;
                    actual_hours: number | null;
                    updated_at: string;
                    created_at: string;
                }> = tasks ?? [];

                const allProjects: Array<{ id: string; status: string }> = projects ?? [];

                // ---- 4. Weekly velocity (last 4 completed weeks) ----
                const weeklyVelocity = buildWeeklyVelocity(allTasks);

                // ---- 5. On-time delivery rate ----
                const completedWithDate = allTasks.filter(
                    (t) => t.status === 'Completado' && t.end_date
                );
                let onTimeRate: number | null = null;
                if (completedWithDate.length > 0) {
                    // We use updated_at as the proxy for completion date since there is
                    // no dedicated completed_at column in the schema.
                    const onTime = completedWithDate.filter((t) => {
                        const completedOn = new Date(t.updated_at);
                        const deadline = new Date(t.end_date!);
                        // Normalize to date-only comparison (ignore time component)
                        completedOn.setHours(0, 0, 0, 0);
                        deadline.setHours(0, 0, 0, 0);
                        return completedOn <= deadline;
                    });
                    onTimeRate = (onTime.length / completedWithDate.length) * 100;
                }

                // ---- 6. Hours efficiency ----
                const estimatedHours = allTasks.reduce(
                    (acc, t) => acc + Number(t.estimated_hours ?? 0),
                    0
                );
                const actualHours = allTasks.reduce(
                    (acc, t) => acc + Number(t.actual_hours ?? 0),
                    0
                );

                // ---- 7. Projects by status ----
                const projectsByStatus: Record<string, number> = {};
                for (const p of allProjects) {
                    const s = p.status ?? 'Desconocido';
                    projectsByStatus[s] = (projectsByStatus[s] ?? 0) + 1;
                }

                setData({ weeklyVelocity, onTimeRate, estimatedHours, actualHours, projectsByStatus });
            } catch (err) {
                console.error('[PerformanceMetrics] fetch error:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchData();
        return () => {
            cancelled = true;
        };
    }, [activeEntityId, supabase]);

    return { data, loading };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildEmptyWeeks(): WeekBucket[] {
    return getWeekBuckets().map((w) => ({ label: w.label, count: 0 }));
}

/** Returns the 4 most-recent ISO week boundaries (Mon–Sun), oldest first. */
function getWeekBuckets(): Array<{ label: string; start: Date; end: Date }> {
    const now = new Date();
    // Find the most recent Monday (start of current week)
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() - daysFromMonday);
    currentMonday.setHours(0, 0, 0, 0);

    const buckets: Array<{ label: string; start: Date; end: Date }> = [];
    for (let i = 3; i >= 0; i--) {
        const start = new Date(currentMonday);
        start.setDate(currentMonday.getDate() - i * 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        const labelDay = start.getDate();
        const labelMonth = start.toLocaleString('es-CO', { month: 'short' });
        const label = i === 0 ? 'Esta sem.' : `${labelDay} ${labelMonth}`;
        buckets.push({ label, start, end });
    }
    return buckets;
}

function buildWeeklyVelocity(
    tasks: Array<{ status: string; updated_at: string }>
): WeekBucket[] {
    const buckets = getWeekBuckets();
    const completedTasks = tasks.filter((t) => t.status === 'Completado');

    return buckets.map((bucket) => {
        const count = completedTasks.filter((t) => {
            const d = new Date(t.updated_at);
            return d >= bucket.start && d <= bucket.end;
        }).length;
        return { label: bucket.label, count };
    });
}

function hoursEfficiencyColor(estimated: number, actual: number): string {
    if (estimated === 0) return 'text-slate-400';
    const ratio = actual / estimated;
    if (ratio <= 1) return 'text-emerald-500';
    if (ratio <= 1.2) return 'text-amber-500';
    return 'text-red-500';
}

function onTimeRateColor(rate: number): string {
    if (rate >= 80) return 'text-emerald-500';
    if (rate >= 60) return 'text-amber-500';
    return 'text-red-500';
}

// ---------------------------------------------------------------------------
// Project status config
// ---------------------------------------------------------------------------

const PROJECT_STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
    Activo:         { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
    Pausado:        { bg: 'bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',     dot: 'bg-amber-500'  },
    Completado:     { bg: 'bg-blue-500/10',    text: 'text-blue-600 dark:text-blue-400',       dot: 'bg-blue-500'   },
    'Bajo Revisión': { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400',   dot: 'bg-violet-500' },
};

const FALLBACK_STYLE = { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-500' };

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SectionCardProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}

function SectionCard({ icon, title, children }: SectionCardProps) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                {icon}
                {title}
            </h3>
            {children}
        </div>
    );
}

/** Inline sparkline rendered purely with CSS bars */
function SparklineBars({ buckets }: { buckets: WeekBucket[] }) {
    const max = Math.max(...buckets.map((b) => b.count), 1);

    return (
        <div className="flex items-end gap-2 h-16">
            {buckets.map((bucket, i) => {
                const heightPct = Math.max((bucket.count / max) * 100, 4);
                const isLast = i === buckets.length - 1;
                return (
                    <div key={bucket.label} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black text-foreground">{bucket.count}</span>
                        <div className="w-full flex items-end" style={{ height: '36px' }}>
                            <div
                                className={`w-full rounded-t-md transition-all duration-500 ${
                                    isLast
                                        ? 'bg-indigo-500'
                                        : 'bg-indigo-300/60 dark:bg-indigo-700/50'
                                }`}
                                style={{ height: `${heightPct}%` }}
                                title={`${bucket.count} tareas`}
                            />
                        </div>
                        <span className="text-[9px] text-muted-foreground truncate max-w-full text-center leading-tight">
                            {bucket.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

/** Animated ring showing a percentage value */
function PercentRing({ value, color }: { value: number; color: string }) {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const dash = (value / 100) * circumference;

    return (
        <svg width="72" height="72" className="-rotate-90">
            <circle
                cx="36" cy="36" r={radius}
                strokeWidth="6"
                className="stroke-slate-100 dark:stroke-white/10"
                fill="none"
            />
            <circle
                cx="36" cy="36" r={radius}
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                className={`transition-all duration-700 ${color}`}
            />
        </svg>
    );
}

/** Horizontal bar showing estimated vs actual hours */
function HoursBar({ estimated, actual }: { estimated: number; actual: number }) {
    const max = Math.max(estimated, actual, 1);
    const estimatedPct = (estimated / max) * 100;
    const actualPct = (actual / max) * 100;
    const over = actual > estimated;

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-20 shrink-0">Estimadas</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-indigo-400/70 transition-all duration-500"
                        style={{ width: `${estimatedPct}%` }}
                    />
                </div>
                <span className="text-[10px] font-bold text-foreground w-10 text-right">{estimated.toFixed(0)}h</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-20 shrink-0">Reales</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${
                            over ? 'bg-red-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${actualPct}%` }}
                    />
                </div>
                <span className="text-[10px] font-bold text-foreground w-10 text-right">{actual.toFixed(0)}h</span>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

export function PerformanceMetrics() {
    const { data, loading } = usePerformanceData();

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-5 h-44 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (!data) return null;

    const {
        weeklyVelocity,
        onTimeRate,
        estimatedHours,
        actualHours,
        projectsByStatus,
    } = data;

    const totalCompleted = weeklyVelocity.reduce((a, b) => a + b.count, 0);

    const efficiencyColor = hoursEfficiencyColor(estimatedHours, actualHours);
    const efficiencyRatio =
        estimatedHours > 0
            ? ((actualHours / estimatedHours) * 100).toFixed(0)
            : null;

    const onTimeColorClass =
        onTimeRate !== null ? onTimeRateColor(onTimeRate) : 'text-slate-400';

    // SVG ring color must be a stroke class
    const ringStokeColor =
        onTimeRate === null
            ? 'stroke-slate-300 dark:stroke-slate-600'
            : onTimeRate >= 80
            ? 'stroke-emerald-500'
            : onTimeRate >= 60
            ? 'stroke-amber-500'
            : 'stroke-red-500';

    const totalProjects = Object.values(projectsByStatus).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">
                Metricas de Desempeno
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                {/* 1. Task Velocity */}
                <SectionCard
                    icon={<Zap className="w-3.5 h-3.5 text-indigo-500" />}
                    title="Velocidad de Tareas"
                >
                    <div className="space-y-3">
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black tracking-tighter text-foreground">
                                {totalCompleted}
                            </span>
                            <span className="text-xs text-muted-foreground">completadas / 4 sem.</span>
                        </div>
                        <SparklineBars buckets={weeklyVelocity} />
                    </div>
                </SectionCard>

                {/* 2. On-Time Delivery Rate */}
                <SectionCard
                    icon={<Target className="w-3.5 h-3.5 text-emerald-500" />}
                    title="Entrega a Tiempo"
                >
                    <div className="flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                            <PercentRing
                                value={onTimeRate ?? 0}
                                color={ringStokeColor}
                            />
                            <span
                                className={`absolute inset-0 flex items-center justify-center text-sm font-black rotate-90 ${onTimeColorClass}`}
                            >
                                {onTimeRate !== null ? `${Math.round(onTimeRate)}%` : '—'}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {onTimeRate !== null
                                    ? onTimeRate >= 80
                                        ? 'Excelente puntualidad'
                                        : onTimeRate >= 60
                                        ? 'Requiere atencion'
                                        : 'Muchos retrasos'
                                    : 'Sin tareas con fecha'}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60">
                                Sobre tareas completadas con fecha limite
                            </p>
                        </div>
                    </div>
                </SectionCard>

                {/* 3. Hours Efficiency */}
                <SectionCard
                    icon={<Clock className="w-3.5 h-3.5 text-amber-500" />}
                    title="Eficiencia de Horas"
                >
                    <div className="space-y-3">
                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-black tracking-tighter ${efficiencyColor}`}>
                                {efficiencyRatio !== null ? `${efficiencyRatio}%` : '—'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {efficiencyRatio !== null
                                    ? Number(efficiencyRatio) <= 100
                                        ? 'dentro del presupuesto'
                                        : 'sobre el presupuesto'
                                    : 'sin horas registradas'}
                            </span>
                        </div>
                        {estimatedHours > 0 || actualHours > 0 ? (
                            <HoursBar estimated={estimatedHours} actual={actualHours} />
                        ) : (
                            <p className="text-xs text-muted-foreground/60">
                                Registra horas estimadas y reales en tus tareas para ver este indicador.
                            </p>
                        )}
                    </div>
                </SectionCard>

                {/* 4. Project Health Summary */}
                <SectionCard
                    icon={<Layers className="w-3.5 h-3.5 text-violet-500" />}
                    title="Estado de Proyectos"
                >
                    {totalProjects === 0 ? (
                        <p className="text-xs text-muted-foreground/60">Sin proyectos registrados.</p>
                    ) : (
                        <div className="space-y-2">
                            {Object.entries(projectsByStatus)
                                .sort(([, a], [, b]) => b - a)
                                .map(([status, count]) => {
                                    const style = PROJECT_STATUS_STYLES[status] ?? FALLBACK_STYLE;
                                    const pct = (count / totalProjects) * 100;
                                    return (
                                        <div key={status} className="space-y-0.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                                    <span className={`text-[10px] font-semibold ${style.text}`}>
                                                        {status}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-black text-foreground">{count}</span>
                                            </div>
                                            <div className="h-1 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${style.dot}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            <p className="text-[10px] text-muted-foreground/60 pt-1">
                                {totalProjects} proyecto{totalProjects !== 1 ? 's' : ''} en total
                            </p>
                        </div>
                    )}
                </SectionCard>

            </div>
        </div>
    );
}
