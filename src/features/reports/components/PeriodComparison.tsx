'use client';

import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { ReportStats } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PeriodComparisonProps {
    currentStats: ReportStats;
    previousStats: ReportStats | null;
}

interface MetricCardProps {
    label: string;
    currentValue: number;
    previousValue: number | null;
    /** If true, a higher value is considered better (default). Set false if lower = better. */
    higherIsBetter?: boolean;
    formatValue?: (v: number) => string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pctChange(current: number, previous: number): number | null {
    if (previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
}

function formatDefault(v: number): string {
    return v.toString();
}

function formatPercent(v: number): string {
    return `${v}%`;
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({
    label,
    currentValue,
    previousValue,
    higherIsBetter = true,
    formatValue = formatDefault,
}: MetricCardProps) {
    const hasPrevious = previousValue !== null;
    const delta = hasPrevious ? currentValue - previousValue : null;
    const pct = hasPrevious && previousValue !== null ? pctChange(currentValue, previousValue) : null;

    const improved = delta !== null ? (higherIsBetter ? delta > 0 : delta < 0) : null;
    const worsened = delta !== null ? (higherIsBetter ? delta < 0 : delta > 0) : null;

    const colorClass =
        !hasPrevious || delta === 0
            ? 'text-muted-foreground'
            : improved
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400';

    const bgClass =
        !hasPrevious || delta === 0
            ? 'bg-slate-100 dark:bg-slate-800'
            : improved
                ? 'bg-emerald-500/10'
                : 'bg-red-500/10';

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">
                {label}
            </p>

            {/* Current value */}
            <p className="text-3xl font-black text-foreground leading-tight mb-1">
                {formatValue(currentValue)}
            </p>

            {/* Previous value */}
            {hasPrevious && previousValue !== null ? (
                <p className="text-xs text-muted-foreground mb-3">
                    Anterior: <span className="font-semibold">{formatValue(previousValue)}</span>
                </p>
            ) : (
                <p className="text-xs text-muted-foreground mb-3">Sin periodo anterior</p>
            )}

            {/* Delta badge */}
            {hasPrevious && delta !== null ? (
                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${bgClass} ${colorClass}`}>
                    {delta === 0 ? (
                        <Minus className="w-3 h-3" />
                    ) : improved ? (
                        <ArrowUp className="w-3 h-3" />
                    ) : (
                        <ArrowDown className="w-3 h-3" />
                    )}
                    {delta > 0 ? '+' : ''}{delta !== 0 ? formatValue(delta) : 'Sin cambio'}
                    {pct !== null && delta !== 0 && (
                        <span className="opacity-75 ml-0.5">({pct > 0 ? '+' : ''}{pct}%)</span>
                    )}
                </div>
            ) : (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                    <Minus className="w-3 h-3" />
                    Sin referencia
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PeriodComparison({ currentStats, previousStats }: PeriodComparisonProps) {
    const currentRate =
        currentStats.total_tasks > 0
            ? Math.round((currentStats.completed_tasks / currentStats.total_tasks) * 100)
            : 0;

    const previousRate =
        previousStats && previousStats.total_tasks > 0
            ? Math.round((previousStats.completed_tasks / previousStats.total_tasks) * 100)
            : null;

    const currentAvgEfficacy =
        currentStats.team_efficacy.length > 0
            ? Math.round(
                currentStats.team_efficacy.reduce((sum, m) => sum + m.efficacy, 0) /
                currentStats.team_efficacy.length
            )
            : 0;

    const previousAvgEfficacy =
        previousStats && previousStats.team_efficacy.length > 0
            ? Math.round(
                previousStats.team_efficacy.reduce((sum, m) => sum + m.efficacy, 0) /
                previousStats.team_efficacy.length
            )
            : null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                    Comparacion de Periodos
                </h3>
                {!previousStats && (
                    <span className="text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                        Sin periodo anterior
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Total Tareas"
                    currentValue={currentStats.total_tasks}
                    previousValue={previousStats?.total_tasks ?? null}
                    higherIsBetter={true}
                />
                <MetricCard
                    label="Tareas Completadas"
                    currentValue={currentStats.completed_tasks}
                    previousValue={previousStats?.completed_tasks ?? null}
                    higherIsBetter={true}
                />
                <MetricCard
                    label="Tasa de Completitud"
                    currentValue={currentRate}
                    previousValue={previousRate}
                    higherIsBetter={true}
                    formatValue={formatPercent}
                />
                <MetricCard
                    label="Eficacia Promedio Equipo"
                    currentValue={currentAvgEfficacy}
                    previousValue={previousAvgEfficacy}
                    higherIsBetter={true}
                    formatValue={formatPercent}
                />
            </div>
        </div>
    );
}
