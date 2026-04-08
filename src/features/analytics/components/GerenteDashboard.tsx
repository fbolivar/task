'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
    Loader2, AlertTriangle, Users, TrendingUp, TrendingDown,
    Briefcase, ClipboardList, DollarSign, Clock, CheckCircle2,
    XCircle, AlertCircle, BarChart2, Activity
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

interface GProject {
    id: string;
    name: string;
    status: string;
    priority: string;
    budget: number | null;
    actual_cost: number;
    start_date: string | null;
    end_date: string | null;
    task_count?: number;
}

interface GTask {
    id: string;
    title: string;
    status: string;
    sub_status: string;
    priority: string;
    end_date: string | null;
    assigned_to: string | null;
    estimated_hours: number;
    actual_hours: number;
    project_id: string | null;
    created_at: string;
    assignee: { full_name: string } | null;
}

interface GHiringProcess {
    id: string;
    title: string;
    status: string;
    total_progress: number;
    estimated_amount: number;
    phases: { is_completed: boolean }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCOP(val: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(val);
}

function getWeekLabel(date: Date): string {
    return `${date.getDate()}/${date.getMonth() + 1}`;
}

function cn(...classes: (string | boolean | undefined)[]): string {
    return classes.filter(Boolean).join(' ');
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
}

function daysOverdue(endDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - end.getTime()) / 86_400_000);
}

// ---------------------------------------------------------------------------
// Health Score helpers
// ---------------------------------------------------------------------------

type HealthColor = 'green' | 'amber' | 'red';

interface HealthIndicator {
    label: string;
    color: HealthColor;
    value: string;
}

const HEALTH_DOT: Record<HealthColor, string> = {
    green: 'bg-emerald-500',
    amber: 'bg-amber-400',
    red: 'bg-red-500',
};

const HEALTH_TEXT: Record<HealthColor, string> = {
    green: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6',
                className
            )}
        >
            {children}
        </div>
    );
}

function CardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-2 mb-5">
            <span className="text-slate-400">{icon}</span>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
        </div>
    );
}

function Badge({ label, color }: { label: string; color: string }) {
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${color}`}>
            {label}
        </span>
    );
}

function HorizBar({ pct, color }: { pct: number; color: string }) {
    return (
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-500 ${color}`}
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// ROW 1: Health Score Banner
// ---------------------------------------------------------------------------

function HealthBanner({ indicators }: { indicators: HealthIndicator[] }) {
    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-bold text-foreground">Estado de Salud</h2>
                </div>
                <span className="text-xs text-slate-400 font-medium">Indicadores clave en tiempo real</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {indicators.map((ind) => (
                    <div
                        key={ind.label}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                    >
                        <div className={`w-3.5 h-3.5 rounded-full ${HEALTH_DOT[ind.color]}`} />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            {ind.label}
                        </span>
                        <span className={`text-sm font-black ${HEALTH_TEXT[ind.color]}`}>
                            {ind.value}
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// ---------------------------------------------------------------------------
// ROW 2 LEFT: Team Performance
// ---------------------------------------------------------------------------

interface TeamMember {
    userId: string;
    name: string;
    total: number;
    completed: number;
    overdue: number;
    pct: number;
    subStatuses: Record<string, number>;
}

const SUB_STATUS_COLORS: Record<string, string> = {
    'En Tiempo': 'bg-emerald-500',
    'En Riesgo': 'bg-amber-400',
    'Demorado': 'bg-orange-500',
    'Bloqueado': 'bg-red-500',
};

function TeamPerformanceCard({ members }: { members: TeamMember[] }) {
    return (
        <Card className="flex-1 min-w-0">
            <CardHeader icon={<Users className="w-5 h-5" />} title="Rendimiento del Equipo" />
            {members.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Sin datos de equipo</p>
            ) : (
                <div className="space-y-4 overflow-y-auto max-h-[420px] pr-1">
                    {members.map((m) => (
                        <div key={m.userId} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs font-bold">
                                        {getInitials(m.name)}
                                    </div>
                                    <span className="text-sm font-semibold text-foreground truncate">
                                        {m.name}
                                    </span>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-2 text-xs text-slate-500">
                                    <span>{m.total} total</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">{m.completed} ok</span>
                                    {m.overdue > 0 && (
                                        <span className="text-red-500">{m.overdue} venc.</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <HorizBar
                                    pct={m.pct}
                                    color={
                                        m.pct >= 75
                                            ? 'bg-emerald-500'
                                            : m.pct >= 40
                                            ? 'bg-amber-400'
                                            : 'bg-red-500'
                                    }
                                />
                                <span className="text-xs font-bold text-slate-500 w-9 text-right shrink-0">
                                    {m.pct}%
                                </span>
                            </div>
                            {/* Sub-status dots */}
                            <div className="flex items-center gap-1 flex-wrap">
                                {Object.entries(m.subStatuses).map(([ss, count]) =>
                                    count > 0 ? (
                                        <div key={ss} className="flex items-center gap-0.5" title={`${ss}: ${count}`}>
                                            <div
                                                className={`w-2 h-2 rounded-full ${SUB_STATUS_COLORS[ss] ?? 'bg-slate-400'}`}
                                            />
                                            <span className="text-[10px] text-slate-400">{count}</span>
                                        </div>
                                    ) : null
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

// ---------------------------------------------------------------------------
// ROW 2 RIGHT: Attention Required
// ---------------------------------------------------------------------------

interface AttentionItem {
    id: string;
    type: 'overdue' | 'overbudget' | 'blocked';
    title: string;
    subtitle: string;
    severity: number; // Higher = worse
    level: 'red' | 'amber';
}

function AttentionCard({ items }: { items: AttentionItem[] }) {
    return (
        <Card className="w-full md:w-[40%] shrink-0">
            <CardHeader icon={<AlertTriangle className="w-5 h-5" />} title="Atenci\u00f3n Requerida" />
            {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    <p className="text-sm text-slate-500 font-medium">Todo en orden</p>
                </div>
            ) : (
                <ul className="space-y-2 overflow-y-auto max-h-[420px] pr-1">
                    {items.map((item) => (
                        <li
                            key={item.id}
                            className={cn(
                                'flex gap-3 items-start rounded-lg p-3 border-l-4',
                                item.level === 'red'
                                    ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                                    : 'border-amber-400 bg-amber-50 dark:bg-amber-950/30'
                            )}
                        >
                            <div className="shrink-0 mt-0.5">
                                {item.level === 'red' ? (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-amber-500" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                                <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}

// ---------------------------------------------------------------------------
// ROW 3 LEFT: Project Status
// ---------------------------------------------------------------------------

const PROJECT_STATUS_BADGE: Record<string, string> = {
    Activo: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    Pausado: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    Completado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'Bajo Revisión': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

function ProjectStatusCard({
    projects,
    tasksByProject,
}: {
    projects: GProject[];
    tasksByProject: Record<string, number>;
}) {
    return (
        <Card className="flex-1 min-w-0">
            <CardHeader icon={<Briefcase className="w-5 h-5" />} title="Estado de Proyectos" />
            {projects.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Sin proyectos</p>
            ) : (
                <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1">
                    {projects.map((p) => {
                        const budget = p.budget ?? 0;
                        const cost = p.actual_cost ?? 0;
                        const budgetPct = budget > 0 ? Math.round((cost / budget) * 100) : 0;
                        const budgetColor =
                            budgetPct < 80
                                ? 'bg-emerald-500'
                                : budgetPct <= 95
                                ? 'bg-amber-400'
                                : 'bg-red-500';

                        // Timeline
                        let timelinePct = 0;
                        if (p.start_date && p.end_date) {
                            const start = new Date(p.start_date).getTime();
                            const end = new Date(p.end_date).getTime();
                            const now = Date.now();
                            const total = end - start;
                            if (total > 0) {
                                timelinePct = Math.round(((now - start) / total) * 100);
                            }
                        }

                        const taskCount = tasksByProject[p.id] ?? 0;

                        return (
                            <div key={p.id} className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold text-foreground truncate min-w-0">
                                        {p.name}
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Badge
                                            label={p.status}
                                            color={PROJECT_STATUS_BADGE[p.status] ?? 'bg-slate-100 text-slate-600'}
                                        />
                                        <span className="text-xs text-slate-400">{taskCount} tareas</span>
                                    </div>
                                </div>
                                {/* Budget bar */}
                                {budget > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-400 w-14 shrink-0">Presup.</span>
                                        <HorizBar pct={budgetPct} color={budgetColor} />
                                        <span className="text-xs font-bold text-slate-500 w-10 text-right shrink-0">
                                            {budgetPct}%
                                        </span>
                                    </div>
                                )}
                                {/* Timeline bar */}
                                {p.start_date && p.end_date && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-400 w-14 shrink-0">Tiempo</span>
                                        <HorizBar
                                            pct={timelinePct}
                                            color={timelinePct > 100 ? 'bg-red-500' : 'bg-teal-500'}
                                        />
                                        <span className="text-xs font-bold text-slate-500 w-10 text-right shrink-0">
                                            {Math.min(timelinePct, 100)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}

// ---------------------------------------------------------------------------
// ROW 3 RIGHT: Hiring Pipeline
// ---------------------------------------------------------------------------

const HIRING_STATUS_BADGE: Record<string, string> = {
    'En Proceso': 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    Adjudicado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    Legalizado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    Cancelado: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

function HiringPipelineCard({ processes }: { processes: GHiringProcess[] }) {
    return (
        <Card className="flex-1 min-w-0">
            <CardHeader icon={<ClipboardList className="w-5 h-5" />} title="Pipeline de Contrataci\u00f3n" />
            {processes.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Sin procesos de contrataci\u00f3n</p>
            ) : (
                <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1">
                    {processes.map((proc) => {
                        const completedPhases = proc.phases.filter((ph) => ph.is_completed).length;
                        const totalPhases = 8;
                        return (
                            <div key={proc.id} className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold text-foreground truncate min-w-0">
                                        {proc.title}
                                    </span>
                                    <Badge
                                        label={proc.status}
                                        color={
                                            HIRING_STATUS_BADGE[proc.status] ??
                                            'bg-slate-100 text-slate-600'
                                        }
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <HorizBar
                                        pct={proc.total_progress}
                                        color={
                                            proc.total_progress >= 75
                                                ? 'bg-emerald-500'
                                                : proc.total_progress >= 40
                                                ? 'bg-teal-500'
                                                : 'bg-amber-400'
                                        }
                                    />
                                    <span className="text-xs font-bold text-slate-500 w-10 text-right shrink-0">
                                        {proc.total_progress}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span>{completedPhases}/{totalPhases} fases</span>
                                    <span>{formatCOP(proc.estimated_amount)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}

// ---------------------------------------------------------------------------
// ROW 4 LEFT: Team Velocity
// ---------------------------------------------------------------------------

interface WeekBucket {
    label: string;
    count: number;
    weekStart: Date;
}

function TeamVelocityCard({ tasks }: { tasks: GTask[] }) {
    const weekBuckets = useMemo((): WeekBucket[] => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const buckets: WeekBucket[] = [];
        for (let i = 5; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay() - i * 7);
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);

            const count = tasks.filter((t) => {
                if (t.status !== 'Completado') return false;
                const d = new Date(t.created_at);
                return d >= weekStart && d < weekEnd;
            }).length;

            buckets.push({
                label: getWeekLabel(weekStart),
                count,
                weekStart,
            });
        }
        return buckets;
    }, [tasks]);

    const maxCount = Math.max(...weekBuckets.map((b) => b.count), 1);
    const lastCount = weekBuckets[weekBuckets.length - 1]?.count ?? 0;
    const prevCount = weekBuckets[weekBuckets.length - 2]?.count ?? 0;
    const trend = lastCount >= prevCount ? 'up' : 'down';

    return (
        <Card className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-bold text-foreground">Velocidad del Equipo</h2>
                </div>
                <div className={cn('flex items-center gap-1 text-sm font-bold',
                    trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                    {trend === 'up' ? (
                        <TrendingUp className="w-4 h-4" />
                    ) : (
                        <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{trend === 'up' ? '+' : ''}{lastCount - prevCount} vs semana anterior</span>
                </div>
            </div>
            <div className="flex items-end gap-3 h-40">
                {weekBuckets.map((b, i) => {
                    const heightPct = maxCount > 0 ? (b.count / maxCount) * 100 : 0;
                    const isLast = i === weekBuckets.length - 1;
                    return (
                        <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                {b.count}
                            </span>
                            <div className="w-full flex items-end" style={{ height: '100px' }}>
                                <div
                                    className={cn(
                                        'w-full rounded-t-md transition-all duration-500',
                                        isLast ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'
                                    )}
                                    style={{ height: `${heightPct}%`, minHeight: b.count > 0 ? '4px' : '0' }}
                                />
                            </div>
                            <span className="text-[10px] text-slate-400">{b.label}</span>
                        </div>
                    );
                })}
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">
                Tareas completadas por semana (6 semanas)
            </p>
        </Card>
    );
}

// ---------------------------------------------------------------------------
// ROW 4 RIGHT: Team Hours
// ---------------------------------------------------------------------------

function TeamHoursCard({ tasks }: { tasks: GTask[] }) {
    const stats = useMemo(() => {
        let totalEstimated = 0;
        let totalActual = 0;
        const byPerson: Record<string, { name: string; estimated: number; actual: number }> = {};

        tasks.forEach((t) => {
            totalEstimated += t.estimated_hours ?? 0;
            totalActual += t.actual_hours ?? 0;

            if (t.assigned_to) {
                const name = t.assignee?.full_name ?? 'Desconocido';
                if (!byPerson[t.assigned_to]) {
                    byPerson[t.assigned_to] = { name, estimated: 0, actual: 0 };
                }
                byPerson[t.assigned_to].estimated += t.estimated_hours ?? 0;
                byPerson[t.assigned_to].actual += t.actual_hours ?? 0;
            }
        });

        const efficiency = totalEstimated > 0
            ? Math.round((totalActual / totalEstimated) * 100)
            : 0;

        const topPersons = Object.values(byPerson)
            .sort((a, b) => b.actual - a.actual)
            .slice(0, 5);

        return { totalEstimated, totalActual, efficiency, topPersons };
    }, [tasks]);

    const efficiencyColor =
        stats.efficiency <= 110
            ? 'text-emerald-600 dark:text-emerald-400'
            : stats.efficiency <= 140
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-red-600 dark:text-red-400';

    return (
        <Card className="flex-1 min-w-0">
            <CardHeader icon={<Clock className="w-5 h-5" />} title="Horas del Equipo" />

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="text-center">
                    <p className="text-2xl font-black text-foreground">
                        {stats.totalEstimated.toLocaleString('es-CO')}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Estimadas</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-black text-foreground">
                        {stats.totalActual.toLocaleString('es-CO')}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Reales</p>
                </div>
                <div className="text-center">
                    <p className={`text-2xl font-black ${efficiencyColor}`}>
                        {stats.efficiency}%
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Eficiencia</p>
                </div>
            </div>

            {/* Per-person top 5 */}
            <div className="space-y-3">
                {stats.topPersons.map((p) => {
                    const pct = p.estimated > 0 ? Math.round((p.actual / p.estimated) * 100) : 0;
                    return (
                        <div key={p.name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-foreground truncate">{p.name}</span>
                                <span className="text-slate-400 shrink-0 ml-2">
                                    {p.actual}h / {p.estimated}h est.
                                </span>
                            </div>
                            <HorizBar
                                pct={pct}
                                color={pct <= 110 ? 'bg-teal-500' : pct <= 140 ? 'bg-amber-400' : 'bg-red-500'}
                            />
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

// ---------------------------------------------------------------------------
// Main GerenteDashboard
// ---------------------------------------------------------------------------

export function GerenteDashboard() {
    const { activeEntityId } = useAuthStore();
    const [projects, setProjects] = useState<GProject[]>([]);
    const [tasks, setTasks] = useState<GTask[]>([]);
    const [hiringProcesses, setHiringProcesses] = useState<GHiringProcess[]>([]);
    const [activeProfilesCount, setActiveProfilesCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();
        let cancelled = false;

        async function fetchAll() {
            setLoading(true);
            setError(null);
            try {
                // Build entity filter helper
                const applyEntityFilter = (query: ReturnType<typeof supabase.from>, col = 'entity_id') => {
                    if (activeEntityId !== 'all') {
                        return (query as any).eq(col, activeEntityId);
                    }
                    return query;
                };

                const [projectsRes, tasksRes, hiringRes, profilesRes] = await Promise.all([
                    // 1. Projects
                    applyEntityFilter(
                        supabase
                            .from('projects')
                            .select('id, name, status, priority, budget, actual_cost, start_date, end_date')
                    ),

                    // 2. Tasks with assignee
                    applyEntityFilter(
                        supabase
                            .from('tasks')
                            .select(
                                'id, title, status, sub_status, priority, end_date, assigned_to, estimated_hours, actual_hours, project_id, created_at, assignee:profiles!tasks_assigned_to_fkey(full_name)'
                            ),
                        'project_id'
                    ),

                    // 3. Hiring processes with phases
                    applyEntityFilter(
                        supabase
                            .from('hiring_processes')
                            .select(
                                'id, title, status, total_progress, estimated_amount, phases:hiring_phases_tracking(is_completed)'
                            )
                    ),

                    // 4. Active profiles count
                    supabase
                        .from('profiles')
                        .select('id', { count: 'exact', head: true })
                        .eq('is_active', true),
                ]);

                if (cancelled) return;

                if (projectsRes.error) throw new Error(projectsRes.error.message);
                if (tasksRes.error) throw new Error(tasksRes.error.message);
                if (hiringRes.error) throw new Error(hiringRes.error.message);

                // Normalize tasks (Supabase returns assignee as array for joins)
                const normalizedTasks: GTask[] = (tasksRes.data ?? []).map((t: any) => ({
                    ...t,
                    assignee: Array.isArray(t.assignee) ? (t.assignee[0] ?? null) : (t.assignee ?? null),
                }));

                setProjects(projectsRes.data ?? []);
                setTasks(normalizedTasks);
                setHiringProcesses(hiringRes.data ?? []);
                setActiveProfilesCount(profilesRes.count ?? 0);
            } catch (err: unknown) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchAll();
        return () => { cancelled = true; };
    }, [activeEntityId]);

    // ---------------------------------------------------------------------------
    // Derived data
    // ---------------------------------------------------------------------------

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const overdueTasks = useMemo(
        () =>
            tasks.filter(
                (t) =>
                    t.status !== 'Completado' &&
                    t.end_date &&
                    new Date(t.end_date) < today
            ),
        [tasks, today]
    );

    // Health indicators
    const healthIndicators = useMemo((): HealthIndicator[] => {
        // Presupuesto
        const totalBudget = projects.reduce((s, p) => s + (p.budget ?? 0), 0);
        const totalCost = projects.reduce((s, p) => s + (p.actual_cost ?? 0), 0);
        const budgetPct = totalBudget > 0 ? (totalCost / totalBudget) * 100 : 0;
        const budgetColor: HealthColor =
            budgetPct < 80 ? 'green' : budgetPct <= 95 ? 'amber' : 'red';

        // Entregas
        const overdueCount = overdueTasks.length;
        const entregas: HealthColor =
            overdueCount < 3 ? 'green' : overdueCount <= 7 ? 'amber' : 'red';

        // Equipo - utilization (tasks with assignee / active profiles)
        const tasksWithAssignee = tasks.filter((t) => t.assigned_to && t.status !== 'Completado').length;
        const utilPct =
            activeProfilesCount > 0
                ? (tasksWithAssignee / (activeProfilesCount * 5)) * 100
                : 0;
        const equipoColor: HealthColor =
            utilPct >= 50 && utilPct <= 85 ? 'green' : utilPct < 30 ? 'red' : 'amber';

        // Contratacion - avg progress
        const avgProgress =
            hiringProcesses.length > 0
                ? hiringProcesses.reduce((s, h) => s + h.total_progress, 0) / hiringProcesses.length
                : 0;
        const contratColor: HealthColor =
            avgProgress > 50 ? 'green' : avgProgress >= 25 ? 'amber' : 'red';

        return [
            {
                label: 'Presupuesto',
                color: budgetColor,
                value: totalBudget > 0 ? `${Math.round(budgetPct)}%` : 'N/A',
            },
            {
                label: 'Entregas',
                color: entregas,
                value: `${overdueCount} vencidas`,
            },
            {
                label: 'Equipo',
                color: equipoColor,
                value: `${Math.round(utilPct)}% util.`,
            },
            {
                label: 'Contrataci\u00f3n',
                color: contratColor,
                value: `${Math.round(avgProgress)}% avance`,
            },
        ];
    }, [projects, overdueTasks, tasks, activeProfilesCount, hiringProcesses]);

    // Team members
    const teamMembers = useMemo((): TeamMember[] => {
        const map: Record<string, TeamMember> = {};

        tasks.forEach((t) => {
            if (!t.assigned_to) return;
            const name = t.assignee?.full_name ?? 'Desconocido';
            if (!map[t.assigned_to]) {
                map[t.assigned_to] = {
                    userId: t.assigned_to,
                    name,
                    total: 0,
                    completed: 0,
                    overdue: 0,
                    pct: 0,
                    subStatuses: {
                        'En Tiempo': 0,
                        'En Riesgo': 0,
                        Demorado: 0,
                        Bloqueado: 0,
                    },
                };
            }
            const m = map[t.assigned_to];
            m.total++;
            if (t.status === 'Completado') m.completed++;
            if (t.status !== 'Completado' && t.end_date && new Date(t.end_date) < today) {
                m.overdue++;
            }
            if (t.sub_status && m.subStatuses[t.sub_status] !== undefined) {
                m.subStatuses[t.sub_status]++;
            }
        });

        return Object.values(map)
            .map((m) => ({
                ...m,
                pct: m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0,
            }))
            .sort((a, b) => b.pct - a.pct);
    }, [tasks, today]);

    // Attention items
    const attentionItems = useMemo((): AttentionItem[] => {
        const items: AttentionItem[] = [];

        // Overdue tasks
        overdueTasks.forEach((t) => {
            const days = daysOverdue(t.end_date!);
            items.push({
                id: `overdue-${t.id}`,
                type: 'overdue',
                title: t.title,
                subtitle: `${t.assignee?.full_name ?? 'Sin asignar'} — ${days}d vencida`,
                severity: days,
                level: days >= 7 ? 'red' : 'amber',
            });
        });

        // Over-budget projects
        projects
            .filter((p) => p.budget && p.budget > 0 && p.actual_cost > p.budget)
            .forEach((p) => {
                const pct = Math.round(((p.actual_cost - (p.budget ?? 0)) / (p.budget ?? 1)) * 100);
                items.push({
                    id: `overbudget-${p.id}`,
                    type: 'overbudget',
                    title: p.name,
                    subtitle: `Presupuesto excedido en ${pct}%`,
                    severity: pct,
                    level: pct > 20 ? 'red' : 'amber',
                });
            });

        // Blocked tasks
        tasks
            .filter((t) => t.sub_status === 'Bloqueado' && t.status !== 'Completado')
            .forEach((t) => {
                items.push({
                    id: `blocked-${t.id}`,
                    type: 'blocked',
                    title: t.title,
                    subtitle: `Bloqueada — ${t.assignee?.full_name ?? 'Sin asignar'}`,
                    severity: 50,
                    level: 'red',
                });
            });

        return items
            .sort((a, b) => b.severity - a.severity)
            .slice(0, 10);
    }, [overdueTasks, projects, tasks]);

    // Tasks by project for project status card
    const tasksByProject = useMemo((): Record<string, number> => {
        const map: Record<string, number> = {};
        tasks.forEach((t) => {
            if (t.project_id) {
                map[t.project_id] = (map[t.project_id] ?? 0) + 1;
            }
        });
        return map;
    }, [tasks]);

    // ---------------------------------------------------------------------------
    // Render states
    // ---------------------------------------------------------------------------

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
                <p className="text-slate-500 text-sm font-medium">Cargando dashboard gerencial...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <AlertTriangle className="w-10 h-10 text-red-500" />
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">Error: {error}</p>
            </div>
        );
    }

    // ---------------------------------------------------------------------------
    // Main render
    // ---------------------------------------------------------------------------

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-foreground">Dashboard Gerencial</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Visión estratégica del equipo y proyectos
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <DollarSign className="w-4 h-4" />
                    <span>{projects.length} proyectos · {tasks.length} tareas · {hiringProcesses.length} contrataciones</span>
                </div>
            </div>

            {/* ROW 1: Health Banner */}
            <HealthBanner indicators={healthIndicators} />

            {/* ROW 2: Team Performance + Attention Required */}
            <div className="flex flex-col md:flex-row gap-6">
                <TeamPerformanceCard members={teamMembers} />
                <AttentionCard items={attentionItems} />
            </div>

            {/* ROW 3: Project Status + Hiring Pipeline */}
            <div className="flex flex-col md:flex-row gap-6">
                <ProjectStatusCard projects={projects} tasksByProject={tasksByProject} />
                <HiringPipelineCard processes={hiringProcesses} />
            </div>

            {/* ROW 4: Velocity + Hours */}
            <div className="flex flex-col md:flex-row gap-6">
                <TeamVelocityCard tasks={tasks} />
                <TeamHoursCard tasks={tasks} />
            </div>
        </div>
    );
}
