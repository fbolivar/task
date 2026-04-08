'use client';

import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Entity } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EntityStats {
    projects: number;
    tasks: number;
    budget: number;
    completionRate: number;
}

export interface EntityComparisonProps {
    entities: Entity[];
    entityStats: Record<string, EntityStats>;
    onClose?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type NumericGetter = (stats: EntityStats) => number;

function getBestIndex(entities: Entity[], stats: Record<string, EntityStats>, getter: NumericGetter): number {
    let best = -Infinity;
    let bestIdx = 0;
    entities.forEach((e, i) => {
        const val = getter(stats[e.id] ?? { projects: 0, tasks: 0, budget: 0, completionRate: 0 });
        if (val > best) { best = val; bestIdx = i; }
    });
    return bestIdx;
}

function getWorstIndex(entities: Entity[], stats: Record<string, EntityStats>, getter: NumericGetter): number {
    let worst = Infinity;
    let worstIdx = 0;
    entities.forEach((e, i) => {
        const val = getter(stats[e.id] ?? { projects: 0, tasks: 0, budget: 0, completionRate: 0 });
        if (val < worst) { worst = val; worstIdx = i; }
    });
    return worstIdx;
}

function allEqual(entities: Entity[], stats: Record<string, EntityStats>, getter: NumericGetter): boolean {
    const vals = entities.map(e => getter(stats[e.id] ?? { projects: 0, tasks: 0, budget: 0, completionRate: 0 }));
    return vals.every(v => v === vals[0]);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_GRADIENTS: Record<string, string> = {
    Prospecto: 'from-amber-400 to-orange-500',
    Cliente:   'from-emerald-400 to-teal-500',
    Partner:   'from-blue-400 to-indigo-500',
};

const TYPE_BADGES: Record<string, string> = {
    Prospecto: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    Cliente:   'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    Partner:   'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

// ─── Row definition ───────────────────────────────────────────────────────────

interface MetricRow {
    label: string;
    getter: NumericGetter;
    format: (v: number) => string;
    higherIsBetter: boolean;
}

const METRIC_ROWS: MetricRow[] = [
    {
        label: 'Proyectos',
        getter: s => s.projects,
        format: v => String(v),
        higherIsBetter: true,
    },
    {
        label: 'Tareas',
        getter: s => s.tasks,
        format: v => String(v),
        higherIsBetter: true,
    },
    {
        label: 'Presupuesto Total',
        getter: s => s.budget,
        format: v => `$${v.toLocaleString('es-CO')}`,
        higherIsBetter: true,
    },
    {
        label: 'Tasa de Completado',
        getter: s => s.completionRate,
        format: v => `${v.toFixed(1)}%`,
        higherIsBetter: true,
    },
];

// ─── Cell color ───────────────────────────────────────────────────────────────

function getCellStyle(
    colIdx: number,
    bestIdx: number,
    worstIdx: number,
    equal: boolean,
): string {
    if (equal) return 'text-muted-foreground';
    if (colIdx === bestIdx)  return 'text-emerald-600 dark:text-emerald-400 font-black';
    if (colIdx === worstIdx) return 'text-red-500 dark:text-red-400 font-bold';
    return 'text-foreground font-semibold';
}

function TrendIcon({ colIdx, bestIdx, worstIdx, equal }: { colIdx: number; bestIdx: number; worstIdx: number; equal: boolean }) {
    if (equal) return <Minus className="w-3.5 h-3.5 text-muted-foreground/50" />;
    if (colIdx === bestIdx)  return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
    if (colIdx === worstIdx) return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
    return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EntityComparison({ entities, entityStats, onClose }: EntityComparisonProps) {
    if (entities.length < 2) return null;

    const safeStats = (id: string): EntityStats =>
        entityStats[id] ?? { projects: 0, tasks: 0, budget: 0, completionRate: 0 };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Comparación de entidades"
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden w-full"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-primary/5 to-transparent">
                <div>
                    <h3 className="font-black text-sm uppercase tracking-widest text-foreground">
                        Comparativa de Entidades
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                        {entities.length} entidades seleccionadas
                    </p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        aria-label="Cerrar comparación"
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Comparison table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    {/* Entity header columns */}
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            {/* Row label column */}
                            <th className="px-6 py-4 text-left w-40">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Métrica
                                </span>
                            </th>

                            {entities.map(entity => {
                                const gradient = TYPE_GRADIENTS[entity.type] ?? 'from-slate-400 to-slate-600';
                                const badge    = TYPE_BADGES[entity.type] ?? '';
                                return (
                                    <th key={entity.id} className="px-6 py-4 text-center min-w-[160px]">
                                        <div className="flex flex-col items-center gap-2">
                                            {/* Logo / Avatar */}
                                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-lg shadow-md overflow-hidden`}>
                                                {entity.logo_url ? (
                                                    <img src={entity.logo_url} alt={entity.name} className="w-full h-full object-contain p-1.5" />
                                                ) : (
                                                    entity.name.substring(0, 2).toUpperCase()
                                                )}
                                            </div>

                                            <div className="text-center">
                                                <p className="font-black text-xs text-foreground leading-tight max-w-[120px] truncate">
                                                    {entity.name}
                                                </p>
                                                <span className={`inline-flex mt-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${badge}`}>
                                                    {entity.type}
                                                </span>
                                            </div>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    {/* Metric rows */}
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                        {METRIC_ROWS.map(row => {
                            const getter   = row.higherIsBetter ? row.getter : (s: EntityStats) => -row.getter(s);
                            const bestIdx  = getBestIndex(entities, entityStats, getter);
                            const worstIdx = getWorstIndex(entities, entityStats, getter);
                            const equal    = allEqual(entities, entityStats, row.getter);

                            return (
                                <tr key={row.label} className="hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors">
                                    {/* Metric label */}
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            {row.label}
                                        </span>
                                    </td>

                                    {entities.map((entity, colIdx) => {
                                        const stats = safeStats(entity.id);
                                        const value = row.getter(stats);
                                        const cellStyle = getCellStyle(colIdx, bestIdx, worstIdx, equal);

                                        return (
                                            <td key={entity.id} className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <TrendIcon
                                                        colIdx={colIdx}
                                                        bestIdx={bestIdx}
                                                        worstIdx={worstIdx}
                                                        equal={equal}
                                                    />
                                                    <span className={`text-sm ${cellStyle}`}>
                                                        {row.format(value)}
                                                    </span>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 bg-slate-50/30 dark:bg-white/2">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Mejor valor
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-red-500 dark:text-red-400">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Menor valor
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <Minus className="w-3.5 h-3.5" />
                    Sin diferencia
                </div>
            </div>
        </div>
    );
}
