'use client';

import type { Task } from '@/features/tasks/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectHealthCardProps {
    tasks: Task[];
    budget: number;
    actualCost: number;
    milestoneCount: number;
    completedMilestones: number;
}

interface HealthMetric {
    label: string;
    value: number;       // 0-100
    display: string;
    color: 'green' | 'amber' | 'red' | 'slate';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getColor(value: number): 'green' | 'amber' | 'red' {
    if (value >= 70) return 'green';
    if (value >= 40) return 'amber';
    return 'red';
}

function getBudgetColor(ratio: number): 'green' | 'amber' | 'red' {
    // ratio = actualCost / budget. Lower is better.
    if (ratio <= 0.7) return 'green';
    if (ratio <= 0.9) return 'amber';
    return 'red';
}

const COLOR_CLASSES: Record<'green' | 'amber' | 'red' | 'slate', { bar: string; text: string; bg: string; ring: string }> = {
    green: {
        bar:  'bg-emerald-500',
        text: 'text-emerald-700 dark:text-emerald-400',
        bg:   'bg-emerald-500/10',
        ring: 'ring-emerald-400',
    },
    amber: {
        bar:  'bg-amber-500',
        text: 'text-amber-700 dark:text-amber-400',
        bg:   'bg-amber-500/10',
        ring: 'ring-amber-400',
    },
    red: {
        bar:  'bg-red-500',
        text: 'text-red-700 dark:text-red-400',
        bg:   'bg-red-500/10',
        ring: 'ring-red-400',
    },
    slate: {
        bar:  'bg-slate-400',
        text: 'text-slate-500 dark:text-slate-400',
        bg:   'bg-slate-100 dark:bg-slate-800',
        ring: 'ring-slate-400',
    },
};

const HEALTH_LABELS: Record<'green' | 'amber' | 'red' | 'slate', string> = {
    green: 'Saludable',
    amber: 'En riesgo',
    red:   'Critico',
    slate: 'Sin datos',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MiniBar({ value, color }: { value: number; color: HealthMetric['color'] }) {
    const cls = COLOR_CLASSES[color];
    return (
        <div
            className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5"
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <div
                className={`h-1.5 rounded-full transition-all duration-500 ${cls.bar}`}
                style={{ width: `${Math.min(value, 100)}%` }}
            />
        </div>
    );
}

function MetricRow({ metric }: { metric: HealthMetric }) {
    const cls = COLOR_CLASSES[metric.color];
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground font-medium">{metric.label}</span>
                <span className={`text-xs font-bold tabular-nums ${cls.text}`}>{metric.display}</span>
            </div>
            <MiniBar value={metric.value} color={metric.color} />
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProjectHealthCard({
    tasks,
    budget,
    actualCost,
    milestoneCount,
    completedMilestones,
}: ProjectHealthCardProps) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ── Schedule health: tasks that are completed OR have end_date >= today ──
    const totalTasks = tasks.length;
    const onTimeTasks = tasks.filter((t) => {
        if (t.status === 'Completado') return true;
        if (!t.end_date) return true; // No deadline = not at risk
        try {
            const due = new Date(t.end_date);
            due.setHours(0, 0, 0, 0);
            return due >= today;
        } catch {
            return true;
        }
    }).length;

    const scheduleValue = totalTasks > 0 ? Math.round((onTimeTasks / totalTasks) * 100) : 0;
    const scheduleColor: HealthMetric['color'] = totalTasks === 0 ? 'slate' : getColor(scheduleValue);

    // ── Budget health: invert ratio so 100% = healthy ──
    const hasBudget = budget > 0;
    let budgetValue = 0;
    let budgetColor: HealthMetric['color'] = 'slate';
    let budgetDisplay = 'Sin presupuesto';

    if (hasBudget) {
        const ratio = actualCost / budget;
        budgetValue = Math.max(0, Math.round((1 - ratio) * 100));
        budgetColor = getBudgetColor(ratio);
        const pct = Math.round(ratio * 100);
        budgetDisplay = `${pct}% ejecutado`;
    }

    // ── Scope health: completed tasks / total tasks ──
    const completedTasks = tasks.filter((t) => t.status === 'Completado').length;
    const scopeValue = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const scopeColor: HealthMetric['color'] = totalTasks === 0 ? 'slate' : getColor(scopeValue);

    // ── Milestone health ──
    const milestoneValue = milestoneCount > 0 ? Math.round((completedMilestones / milestoneCount) * 100) : 0;
    const milestoneColor: HealthMetric['color'] = milestoneCount === 0 ? 'slate' : getColor(milestoneValue);

    // ── Overall health: average of non-slate metrics ──
    const scoredMetrics: { value: number; color: 'green' | 'amber' | 'red' }[] = [];
    if (scheduleColor !== 'slate') scoredMetrics.push({ value: scheduleValue, color: scheduleColor });
    if (budgetColor !== 'slate') scoredMetrics.push({ value: budgetValue, color: budgetColor });
    if (scopeColor !== 'slate') scoredMetrics.push({ value: scopeValue, color: scopeColor });

    let overallValue = 0;
    let overallColor: HealthMetric['color'] = 'slate';

    if (scoredMetrics.length > 0) {
        overallValue = Math.round(scoredMetrics.reduce((sum, m) => sum + m.value, 0) / scoredMetrics.length);
        overallColor = getColor(overallValue);
    }

    const overallCls = COLOR_CLASSES[overallColor];

    const metrics: HealthMetric[] = [
        {
            label: 'Cronograma',
            value: scheduleValue,
            display: scheduleColor === 'slate' ? 'Sin tareas' : `${scheduleValue}%`,
            color: scheduleColor,
        },
        {
            label: 'Presupuesto',
            value: hasBudget ? Math.min(budgetValue, 100) : 0,
            display: budgetDisplay,
            color: budgetColor,
        },
        {
            label: 'Alcance',
            value: scopeValue,
            display: scopeColor === 'slate' ? 'Sin tareas' : `${completedTasks}/${totalTasks}`,
            color: scopeColor,
        },
        {
            label: 'Hitos',
            value: milestoneValue,
            display: milestoneColor === 'slate' ? 'Sin hitos' : `${completedMilestones}/${milestoneCount}`,
            color: milestoneColor,
        },
    ];

    return (
        <div
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
            aria-label="Resumen de salud del proyecto"
        >
            <div className="flex items-start gap-5">
                {/* Overall health circle */}
                <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                    <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center ring-4 ${overallCls.ring} ${overallCls.bg}`}
                        aria-label={`Salud general: ${HEALTH_LABELS[overallColor]}`}
                    >
                        <span className={`text-lg font-bold tabular-nums ${overallCls.text}`}>
                            {overallColor === 'slate' ? '—' : `${overallValue}`}
                        </span>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${overallCls.text}`}>
                        {HEALTH_LABELS[overallColor]}
                    </span>
                </div>

                {/* Metrics */}
                <div className="flex-1 min-w-0 space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        Salud del proyecto
                    </p>
                    {metrics.map((metric) => (
                        <MetricRow key={metric.label} metric={metric} />
                    ))}
                </div>
            </div>
        </div>
    );
}
