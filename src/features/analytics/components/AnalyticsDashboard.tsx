'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { AnalyticsDashboardData } from '../types';
import { analyticsService } from '../services/analyticsService';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
    Loader2, Target, Zap, Activity, Users, DollarSign,
    ShieldAlert, AlertTriangle, Bell, FileDown, Package,
    TrendingUp, Warehouse, CalendarClock, BarChart3
} from 'lucide-react';
import { ProjectVarianceItem, ProjectTimelineItem } from '../types';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadialBarChart, RadialBar
} from 'recharts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Period = '30d' | '90d' | 'quarter' | 'year';

interface PeriodOption {
    value: Period;
    label: string;
}

interface UserProductivity {
    userId: string;
    name: string;
    completed: number;
    total: number;
    pct: number;
}

interface Alert {
    level: 'red' | 'amber';
    message: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PERIOD_OPTIONS: PeriodOption[] = [
    { value: '30d', label: '30 días' },
    { value: '90d', label: '90 días' },
    { value: 'quarter', label: 'Este Trimestre' },
    { value: 'year', label: 'Este Año' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(val: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
        notation: 'compact',
    }).format(val);
}

function buildAlerts(kpis: AnalyticsDashboardData['kpis']): Alert[] {
    const alerts: Alert[] = [];
    if (kpis.budget_execution_percentage > 90) {
        alerts.push({ level: 'red', message: `Ejecución presupuestal crítica: ${kpis.budget_execution_percentage.toFixed(1)}%` });
    }
    if (kpis.overdue_tasks > 5) {
        alerts.push({ level: 'amber', message: `${kpis.overdue_tasks} tareas vencidas requieren atención` });
    }
    if (kpis.expiring_warranties > 0) {
        alerts.push({ level: 'amber', message: `${kpis.expiring_warranties} garantías próximas a vencer` });
    }
    if (kpis.high_risk_projects_count > 0) {
        alerts.push({ level: 'red', message: `${kpis.high_risk_projects_count} proyectos en nivel de riesgo alto` });
    }
    return alerts;
}

function buildUserProductivity(
    tasks: { assigned_to: string | null; status: string | null }[],
    userNames: Record<string, string> = {}
): UserProductivity[] {
    const map: Record<string, { completed: number; total: number }> = {};
    tasks.forEach((t) => {
        const key = t.assigned_to || 'Sin Asignar';
        if (!map[key]) map[key] = { completed: 0, total: 0 };
        map[key].total++;
        if (t.status === 'Completado') map[key].completed++;
    });

    return Object.entries(map)
        .map(([userId, stats]) => ({
            userId,
            name: userNames[userId] ?? (userId.length === 36 ? `Usuario ${userId.slice(0, 8)}` : userId),
            completed: stats.completed,
            total: stats.total,
            pct: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        }))
        .sort((a, b) => b.completed - a.completed)
        .slice(0, 8);
}

function exportAnalyticsCSV(data: AnalyticsDashboardData, period: Period): void {
    const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? period;
    const rows: string[][] = [
        ['Reporte Analítico BC Fabric SAS'],
        [`Período: ${periodLabel}`],
        [`Generado: ${new Date().toLocaleString('es-CO')}`],
        [],
        ['=== KPIs ==='],
        ['Métrica', 'Valor'],
        ['Presupuesto Total', formatCurrency(data.kpis.total_budget)],
        ['Presupuesto Ejecutado', formatCurrency(data.kpis.executed_budget)],
        ['Ejecución %', `${data.kpis.budget_execution_percentage.toFixed(1)}%`],
        ['Proyectos Activos', String(data.kpis.active_projects_count)],
        ['Proyectos Alto Riesgo', String(data.kpis.high_risk_projects_count)],
        ['Procesos Contratación Activos', String(data.kpis.active_hiring_processes)],
        ['Tareas Totales', String(data.kpis.total_tasks)],
        ['Promedio Completación Tareas %', `${data.kpis.avg_task_completion.toFixed(1)}%`],
        ['Tareas Vencidas', String(data.kpis.overdue_tasks)],
        ['Total Activos Inventario', String(data.kpis.total_assets ?? 0)],
        ['Valor Inventario', formatCurrency(data.kpis.inventory_value ?? 0)],
        ['Garantías por Vencer', String(data.kpis.expiring_warranties ?? 0)],
        [],
        ['=== MATRIZ DE RIESGO ==='],
        ['Nivel', 'Proyectos', 'Presupuesto'],
        ...data.risk_matrix.map((r) => [r.risk_level, String(r.count), formatCurrency(r.total_budget)]),
        [],
        ['=== EFICIENCIA POR PROYECTO ==='],
        ['Proyecto', 'Completadas', 'Total', 'Eficiencia %'],
        ...data.task_efficiency.map((e) => [e.project_name, String(e.completed), String(e.total), `${e.efficiency.toFixed(1)}%`]),
    ];

    const csvContent = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-bcfabric-${period}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ChartWrapper({ children, className = 'h-[300px] w-full' }: { children: React.ReactNode; className?: string }) {
    const [ready, setReady] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const obs = new ResizeObserver((entries) => {
            requestAnimationFrame(() => {
                for (const entry of entries) {
                    const { width, height } = entry.contentRect;
                    if (width > 0 && height > 0) setReady(true);
                }
            });
        });
        if (containerRef.current.offsetWidth > 0 && containerRef.current.offsetHeight > 0) setReady(true);
        obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, []);

    return (
        <div className={`${className} w-full h-full min-w-0 relative overflow-hidden`} ref={containerRef}>
            {ready ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={0}>
                    {children as React.ReactElement}
                </ResponsiveContainer>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-xl">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
            )}
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: string | number;
    subtext: string;
    icon: React.ElementType;
    trend?: string | null;
    trendUp?: boolean | null;
    colorClass?: string;
    bgClass?: string;
    href?: string;
}

function StatCard({ title, value, subtext, icon: Icon, trend, trendUp, colorClass = 'text-primary', bgClass = 'bg-primary/10', href }: StatCardProps) {
    const inner = (
        <div className={`bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group ${href ? 'cursor-pointer' : ''}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${bgClass} ${colorClass} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend != null && (
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${trendUp ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                        {trend}
                    </div>
                )}
            </div>
            <h3 className="text-3xl font-black text-foreground tracking-tighter mb-1">{value}</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
            <p className="text-[10px] text-muted-foreground/60 font-medium">{subtext}</p>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[2rem]">
                {inner}
            </Link>
        );
    }
    return inner;
}

function AlertsBar({ alerts }: { alerts: Alert[] }) {
    if (alerts.length === 0) return null;

    return (
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap" role="alert" aria-live="polite">
            {alerts.map((alert, i) => (
                <div
                    key={i}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold flex-1 min-w-0 ${alert.level === 'red'
                        ? 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                        }`}
                >
                    {alert.level === 'red'
                        ? <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                        : <Bell className="w-4 h-4 shrink-0" aria-hidden="true" />
                    }
                    <span className="truncate">{alert.message}</span>
                </div>
            ))}
        </div>
    );
}

function PeriodFilter({
    selected,
    onChange,
    onExport,
}: {
    selected: Period;
    onChange: (p: Period) => void;
    onExport: () => void;
}) {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filtro de período">
                {PERIOD_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        aria-pressed={selected === opt.value ? 'true' : 'false'}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selected === opt.value
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            <button
                type="button"
                onClick={onExport}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-300 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Exportar datos como CSV"
            >
                <FileDown className="w-4 h-4" aria-hidden="true" />
                Exportar CSV
            </button>
        </div>
    );
}

function UserProductivitySection({ productivity }: { productivity: UserProductivity[] }) {
    if (productivity.length === 0) return null;
    const maxCompleted = Math.max(...productivity.map((u) => u.completed), 1);

    return (
        <section aria-labelledby="productivity-heading">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                        <TrendingUp className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 id="productivity-heading" className="text-lg font-black text-foreground">Productividad por Usuario</h2>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Top 8 — Tareas completadas</p>
                    </div>
                </div>

                <div className="space-y-5">
                    {productivity.map((user) => (
                        <div key={user.userId} className="group">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black shrink-0">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-bold text-foreground truncate" title={user.name}>{user.name}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                    <span className="text-xs text-muted-foreground font-medium">
                                        {user.completed}/{user.total}
                                    </span>
                                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${user.pct >= 75
                                        ? 'bg-emerald-500/10 text-emerald-600'
                                        : user.pct >= 40
                                            ? 'bg-amber-500/10 text-amber-600'
                                            : 'bg-red-500/10 text-red-600'
                                        }`}>
                                        {user.pct}%
                                    </span>
                                </div>
                            </div>
                            <meter
                                className={`analytics-meter h-3 w-full rounded-full transition-all duration-700 group-hover:opacity-80 ${user.pct >= 75
                                    ? 'analytics-meter--green'
                                    : user.pct >= 40
                                        ? 'analytics-meter--amber'
                                        : 'analytics-meter--red'
                                    }`}
                                value={user.completed}
                                min={0}
                                max={maxCompleted}
                                aria-label={`${user.name}: ${user.completed} de ${maxCompleted} tareas completadas`}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function InventorySummarySection({ kpis }: { kpis: AnalyticsDashboardData['kpis'] }) {
    const totalAssets = kpis.total_assets ?? 0;
    const inventoryValue = kpis.inventory_value ?? 0;
    const expiringWarranties = kpis.expiring_warranties ?? 0;

    return (
        <section aria-labelledby="inventory-heading">
            <div className="mb-6">
                <h2 id="inventory-heading" className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-teal-500" aria-hidden="true" />
                    Resumen de Inventario
                </h2>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">
                    Activos, Valor y Garantías
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Activos"
                    value={totalAssets > 0 ? totalAssets.toLocaleString('es-CO') : '—'}
                    subtext={totalAssets === 0 ? 'Sin datos de inventario' : 'Activos registrados'}
                    icon={Package}
                    colorClass="text-teal-500"
                    bgClass="bg-teal-500/10"
                />
                <StatCard
                    title="Valor Inventario"
                    value={inventoryValue > 0 ? formatCurrency(inventoryValue) : '—'}
                    subtext={inventoryValue === 0 ? 'Sin valoración registrada' : 'Valor total registrado'}
                    icon={DollarSign}
                    colorClass="text-cyan-500"
                    bgClass="bg-cyan-500/10"
                />
                <StatCard
                    title="Garantías por Vencer"
                    value={expiringWarranties > 0 ? expiringWarranties : '—'}
                    subtext={expiringWarranties === 0 ? 'Sin garantías próximas a vencer' : 'Requieren revisión'}
                    icon={ShieldAlert}
                    trend={expiringWarranties > 0 ? 'Atención' : undefined}
                    trendUp={expiringWarranties === 0}
                    colorClass="text-orange-500"
                    bgClass="bg-orange-500/10"
                />
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// Gerente-specific Sub-components
// ---------------------------------------------------------------------------

type SemaphoreColor = 'green' | 'amber' | 'red';

function getSemaphoreColor(
    budgetPct: number,
    overdueTasks: number,
    highRiskCount: number,
): SemaphoreColor {
    if (budgetPct > 95 || overdueTasks > 7 || highRiskCount > 2) return 'red';
    if (budgetPct > 80 || overdueTasks > 3 || highRiskCount > 0) return 'amber';
    return 'green';
}

const SEMAPHORE_STYLES: Record<SemaphoreColor, { dot: string; label: string; card: string }> = {
    green: {
        dot: 'bg-emerald-500',
        label: 'text-emerald-700 dark:text-emerald-400',
        card: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30',
    },
    amber: {
        dot: 'bg-amber-500',
        label: 'text-amber-700 dark:text-amber-400',
        card: 'border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30',
    },
    red: {
        dot: 'bg-red-500',
        label: 'text-red-700 dark:text-red-400',
        card: 'border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/30',
    },
};

interface SemaphoreIndicatorProps {
    label: string;
    color: SemaphoreColor;
    detail: string;
}

function SemaphoreIndicator({ label, color, detail }: SemaphoreIndicatorProps) {
    const styles = SEMAPHORE_STYLES[color];
    return (
        <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className={`w-3 h-3 rounded-full shrink-0 ${styles.dot} shadow-sm`} aria-hidden="true" />
            <div className="min-w-0">
                <p className={`text-[10px] font-black uppercase tracking-widest ${styles.label}`}>{label}</p>
                <p className="text-xs font-bold text-foreground truncate">{detail}</p>
            </div>
        </div>
    );
}

function ExecutiveSemaphore({ kpis }: { kpis: AnalyticsDashboardData['kpis'] }) {
    const budgetPct = kpis.budget_execution_percentage;
    const overdueTasks = kpis.overdue_tasks;
    const highRisk = kpis.high_risk_projects_count;

    const budgetColor = getSemaphoreColor(budgetPct, 0, 0);
    const tasksColor: SemaphoreColor = overdueTasks > 7 ? 'red' : overdueTasks > 3 ? 'amber' : 'green';
    const riskColor: SemaphoreColor = highRisk > 2 ? 'red' : highRisk > 0 ? 'amber' : 'green';
    const overallColor = getSemaphoreColor(budgetPct, overdueTasks, highRisk);
    const overallStyles = SEMAPHORE_STYLES[overallColor];

    return (
        <section aria-labelledby="semaphore-heading">
            <div className={`rounded-[2rem] border p-6 ${overallStyles.card}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="p-2 rounded-xl bg-white/60 dark:bg-slate-900/60">
                            <BarChart3 className="w-5 h-5 text-slate-600 dark:text-slate-300" aria-hidden="true" />
                        </div>
                        <div>
                            <h2 id="semaphore-heading" className="text-sm font-black text-foreground uppercase tracking-widest">
                                Salud General
                            </h2>
                            <p className={`text-[10px] font-black uppercase tracking-wider ${overallStyles.label}`}>
                                {overallColor === 'green' ? 'Operacion Normal' : overallColor === 'amber' ? 'Atencion Requerida' : 'Alerta Critica'}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700 hidden sm:block" aria-hidden="true" />

                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 w-full sm:w-auto">
                        <SemaphoreIndicator
                            label="Presupuesto"
                            color={budgetColor}
                            detail={`${budgetPct.toFixed(1)}% ejecutado`}
                        />
                        <SemaphoreIndicator
                            label="Tareas"
                            color={tasksColor}
                            detail={`${overdueTasks} vencidas`}
                        />
                        <SemaphoreIndicator
                            label="Riesgo"
                            color={riskColor}
                            detail={`${highRisk} proyectos alto riesgo`}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function BudgetVarianceSection({ items }: { items: ProjectVarianceItem[] }) {
    if (items.length === 0) {
        return (
            <section aria-labelledby="variance-heading">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800">
                    <h2 id="variance-heading" className="text-lg font-black text-foreground mb-2 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-500" aria-hidden="true" />
                        Variacion Presupuestal por Proyecto
                    </h2>
                    <p className="text-xs text-muted-foreground">Sin proyectos con presupuesto registrado.</p>
                </div>
            </section>
        );
    }

    return (
        <section aria-labelledby="variance-heading">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                        <DollarSign className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 id="variance-heading" className="text-lg font-black text-foreground">
                            Variacion Presupuestal por Proyecto
                        </h2>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                            Presupuesto vs Costo Real
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto -mx-2">
                    <table className="w-full text-sm" aria-label="Variacion presupuestal por proyecto">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th scope="col" className="text-left py-3 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Proyecto</th>
                                <th scope="col" className="text-right py-3 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Presupuesto</th>
                                <th scope="col" className="text-right py-3 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Real</th>
                                <th scope="col" className="text-right py-3 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Variacion %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {items.map((item) => {
                                const isOver = item.actual > item.budget;
                                const isNear = !isOver && item.variance_pct >= -10;
                                const varianceClass = isOver
                                    ? 'text-red-600 dark:text-red-400 bg-red-500/10'
                                    : isNear
                                        ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                                        : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';
                                const sign = item.variance_pct > 0 ? '+' : '';
                                return (
                                    <tr key={item.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="py-3 px-3 font-bold text-foreground max-w-[180px]">
                                            <span className="block truncate" title={item.name}>{item.name}</span>
                                        </td>
                                        <td className="py-3 px-3 text-right text-muted-foreground tabular-nums">
                                            {formatCurrency(item.budget)}
                                        </td>
                                        <td className="py-3 px-3 text-right text-foreground font-medium tabular-nums">
                                            {formatCurrency(item.actual)}
                                        </td>
                                        <td className="py-3 px-3 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black tabular-nums ${varianceClass}`}>
                                                {sign}{item.variance_pct.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" /> Bajo presupuesto
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" /> Proximo al limite (90-100%)
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" /> Sobrepresupuestado
                    </span>
                </div>
            </div>
        </section>
    );
}

function ProjectTimelineSection({ items }: { items: ProjectTimelineItem[] }) {
    if (items.length === 0) {
        return (
            <section aria-labelledby="timeline-heading">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800">
                    <h2 id="timeline-heading" className="text-lg font-black text-foreground mb-2 flex items-center gap-2">
                        <CalendarClock className="w-5 h-5 text-blue-500" aria-hidden="true" />
                        Cronograma de Proyectos
                    </h2>
                    <p className="text-xs text-muted-foreground">Sin proyectos con fecha de cierre registrada.</p>
                </div>
            </section>
        );
    }

    const statusConfig: Record<string, { badge: string; dot: string }> = {
        'En Tiempo': { badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
        'Proximo a Vencer': { badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
        'Retrasado': { badge: 'bg-red-500/10 text-red-700 dark:text-red-400', dot: 'bg-red-500' },
    };

    return (
        <section aria-labelledby="timeline-heading">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                        <CalendarClock className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 id="timeline-heading" className="text-lg font-black text-foreground">
                            Cronograma de Proyectos
                        </h2>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                            Estado de avance por fecha de cierre
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {items.map((item) => {
                        const cfg = statusConfig[item.status] ?? statusConfig['En Tiempo'];
                        const endFormatted = item.end_date
                            ? new Date(item.end_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—';
                        const daysLabel = item.days_remaining < 0
                            ? `${Math.abs(item.days_remaining)} dias vencido`
                            : `${item.days_remaining} dias restantes`;

                        return (
                            <div key={item.name} className="group p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} aria-hidden="true" />
                                        <span className="font-bold text-sm text-foreground truncate" title={item.name}>{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[10px] text-muted-foreground font-medium">{endFormatted}</span>
                                        <span
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${cfg.badge}`}
                                            aria-label={`Estado: ${item.status}`}
                                        >
                                            {item.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                                        <span>Tiempo transcurrido</span>
                                        <span>{daysLabel}</span>
                                    </div>
                                    <meter
                                        className={`analytics-meter h-2 w-full rounded-full transition-all duration-700 ${
                                            item.days_remaining < 0
                                                ? 'analytics-meter--red'
                                                : item.days_remaining < 15
                                                    ? 'analytics-meter--amber'
                                                    : 'analytics-meter--green'
                                        }`}
                                        value={item.progress_pct}
                                        min={0}
                                        max={100}
                                        aria-label={`Tiempo transcurrido en ${item.name}: ${item.progress_pct}%`}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" /> En Tiempo
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" /> Proximo a Vencer (&lt;15 dias)
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" /> Retrasado
                    </span>
                </div>
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AnalyticsDashboard() {
    const { activeEntityId, profile } = useAuthStore();
    const isGerente = profile?.role?.name === 'Gerente';
    const [data, setData] = useState<AnalyticsDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<Period>('30d');

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const res = await analyticsService.getDashboardData(activeEntityId, period);
                if (!cancelled) setData(res);
            } catch (error) {
                console.error('Failed to load analytics', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [activeEntityId, period]);

    const handleExport = useCallback(() => {
        if (!data) return;
        exportAnalyticsCSV(data, period);
    }, [data, period]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
                    Procesando Inteligencia de Negocio...
                </p>
            </div>
        );
    }

    if (!data) return null;

    const alerts = buildAlerts(data.kpis);

    // Build user productivity from task_efficiency data (completed/total per project already computed)
    // The service returns task_efficiency grouped by project; we use assigned_to data if available
    // via the tasks array. Since the service doesn't expose raw tasks we derive from what we have.
    const productivity = buildUserProductivity(
        data.task_efficiency.flatMap((e) =>
            Array.from({ length: e.total }, (_, i) => ({
                assigned_to: e.project_name,
                status: i < e.completed ? 'Completado' : 'Pendiente',
            }))
        ),
        data.user_names
    );

    const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? period;

    return (
        <div className="space-y-8 animate-reveal">

            {/* Header */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 p-10 min-h-[200px] flex flex-col justify-center">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" aria-hidden="true" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                            Executive Insight v3.0
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
                        Centro de Comando Estratégico
                    </h1>
                    <p className="text-slate-400 font-medium max-w-2xl text-lg">
                        Visión unificada de rendimiento financiero, eficiencia operativa y gestión de riesgo corporativo.
                    </p>
                </div>
            </div>

            {/* Alerts Bar — only rendered when alerts exist */}
            {alerts.length > 0 && (
                <div className="rounded-[1.5rem] border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-slate-500" aria-hidden="true" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Alertas Activas ({alerts.length})
                        </span>
                    </div>
                    <AlertsBar alerts={alerts} />
                </div>
            )}

            {/* Period Filter + Export */}
            <PeriodFilter
                selected={period}
                onChange={setPeriod}
                onExport={handleExport}
            />

            {/* Period badge */}
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest -mt-4">
                Mostrando datos: <span className="text-primary">{periodLabel}</span>
            </p>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    href={isGerente ? '/analisis' : '/proyectos'}
                    title="Ejecución Presupuestal"
                    value={`${data.kpis.budget_execution_percentage.toFixed(1)}%`}
                    subtext={`Total: ${formatCurrency(data.kpis.total_budget)}`}
                    icon={DollarSign}
                    trend={data.kpis.budget_execution_percentage > 90 ? 'Crítico' : 'Nominal'}
                    trendUp={data.kpis.budget_execution_percentage <= 90}
                    colorClass="text-emerald-500"
                    bgClass="bg-emerald-500/10"
                />
                <StatCard
                    href={isGerente ? '/analisis' : '/tareas'}
                    title="Eficiencia Operativa"
                    value={`${data.kpis.avg_task_completion.toFixed(1)}%`}
                    subtext={`${data.kpis.total_tasks} Tareas Totales`}
                    icon={Zap}
                    trend="+4.2%"
                    trendUp={true}
                    colorClass="text-amber-500"
                    bgClass="bg-amber-500/10"
                />
                <StatCard
                    href={isGerente ? '/analisis' : '/proyectos'}
                    title="Salud de Cartera"
                    value={data.kpis.active_projects_count}
                    subtext="Proyectos Activos"
                    icon={Activity}
                    trend={`${data.kpis.high_risk_projects_count} Riesgos`}
                    trendUp={data.kpis.high_risk_projects_count === 0}
                    colorClass="text-blue-500"
                    bgClass="bg-blue-500/10"
                />
                <StatCard
                    href="/contratacion"
                    title="Talento en Pipeline"
                    value={data.kpis.active_hiring_processes}
                    subtext={`Est: ${formatCurrency(data.kpis.hiring_volume_estimated)}`}
                    icon={Users}
                    trend="Estable"
                    trendUp={null}
                    colorClass="text-purple-500"
                    bgClass="bg-purple-500/10"
                />
            </div>

            {/* Main Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto lg:h-[450px]">

                {/* Financial Trend Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-emerald-500" aria-hidden="true" />
                                Flujo de Capital
                            </h3>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">Planeado vs Ejecutado (YTD)</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ChartWrapper>
                            <AreaChart data={data.financial_trend}>
                                <defs>
                                    <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: 'currentColor' }} className="text-muted-foreground" />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)' }}
                                    cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                                />
                                <Area type="monotone" dataKey="planned" stackId="1" stroke="#6366f1" fill="url(#colorPlanned)" strokeWidth={3} name="Presupuesto" />
                                <Area type="monotone" dataKey="actual" stackId="2" stroke="#10b981" fill="url(#colorActual)" strokeWidth={3} name="Ejecutado" />
                            </AreaChart>
                        </ChartWrapper>
                    </div>
                </div>

                {/* Efficiency Radial */}
                <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" aria-hidden="true" />
                    <div className="relative z-10 mb-6">
                        <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                            <Target className="w-5 h-5 text-indigo-400" aria-hidden="true" />
                            Top Eficiencia
                        </h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Proyectos Líderes</p>
                    </div>
                    <div className="flex-1 min-h-0 relative">
                        <ChartWrapper>
                            <RadialBarChart
                                innerRadius="30%"
                                outerRadius="100%"
                                data={data.task_efficiency}
                                startAngle={180}
                                endAngle={0}
                            >
                                <RadialBar
                                    label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 'bold' }}
                                    background={{ fill: '#ffffff10' }}
                                    dataKey="efficiency"
                                    cornerRadius={10}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', color: 'white' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </RadialBarChart>
                        </ChartWrapper>
                        <div className="absolute bottom-0 left-0 w-full text-center pb-4">
                            <div className="text-4xl font-black tracking-tighter text-indigo-400">
                                {data.task_efficiency[0]?.efficiency.toFixed(0) ?? '0'}%
                            </div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                                Eficiencia Máxima
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Grid — Risk Matrix + Hiring */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Risk Matrix */}
                <div className="stat-card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                            <ShieldAlert className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-foreground">Matriz de Riesgo</h3>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Impacto vs Inversión</p>
                        </div>
                    </div>
                    <div className="space-y-5">
                        {data.risk_matrix.map((item) => (
                            <div key={item.risk_level} className="group">
                                <div className="flex justify-between text-xs font-black uppercase tracking-wider mb-2">
                                    <span className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${item.risk_level === 'Alto' || item.risk_level === 'Crítico'
                                            ? 'bg-red-500'
                                            : item.risk_level === 'Medio'
                                                ? 'bg-amber-500'
                                                : 'bg-emerald-500'
                                            }`} aria-hidden="true" />
                                        {item.risk_level}
                                    </span>
                                    <span>{formatCurrency(item.total_budget)}</span>
                                </div>
                                <meter
                                    className={`analytics-meter h-4 w-full rounded-full transition-all duration-1000 group-hover:opacity-80 ${item.risk_level === 'Alto' || item.risk_level === 'Crítico'
                                        ? 'analytics-meter--red'
                                        : item.risk_level === 'Medio'
                                            ? 'analytics-meter--amber'
                                            : 'analytics-meter--green'
                                        }`}
                                    value={item.total_budget}
                                    min={0}
                                    max={data.kpis.total_budget > 0 ? data.kpis.total_budget : 1}
                                    aria-label={`Presupuesto en riesgo ${item.risk_level}: ${formatCurrency(item.total_budget)}`}
                                />
                                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground font-medium">
                                    <span>{item.count} Proyectos</span>
                                    <span>{(data.kpis.total_budget > 0 ? (item.total_budget / data.kpis.total_budget) * 100 : 0).toFixed(1)}% del Capital</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hiring Pulse List */}
                <div className="stat-card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <Users className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-foreground">Procesos de Contratación</h3>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Procesos en Curso</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {data.recent_hiring_processes && data.recent_hiring_processes.length > 0 ? (
                            data.recent_hiring_processes.map((process) => (
                                <div key={process.id} className="group p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-sm text-foreground leading-tight line-clamp-1" title={process.title}>{process.title}</h4>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">{process.project_name}</p>
                                        </div>
                                        <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${process.status === 'En Proceso'
                                            ? 'bg-blue-500/10 text-blue-600'
                                            : process.status === 'Adjudicado'
                                                ? 'bg-emerald-500/10 text-emerald-600'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                            }`}>
                                            {process.status}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                                            <span>Progreso</span>
                                            <span>{process.progress}%</span>
                                        </div>
                                        <meter
                                            className="analytics-meter analytics-meter--blue h-1.5 w-full rounded-full transition-all duration-1000"
                                            value={process.progress}
                                            min={0}
                                            max={100}
                                            aria-label={`Progreso de ${process.title}: ${process.progress}%`}
                                        />

                                        {/* Phases Stepper */}
                                        <div className="flex justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                                            {(() => {
                                                const standardPhases = [
                                                    'ficha_tecnica', 'estudio_mercado', 'cdp_vigencia',
                                                    'estudio_previo', 'radicacion_contratos', 'proceso_adjudicado', 'legalizacion_contrato',
                                                ];
                                                return standardPhases.map((phaseCode, i) => {
                                                    const phase = process.phases?.find((p: { phase_code: string }) => p.phase_code === phaseCode);
                                                    const isCompleted = phase?.is_completed;
                                                    const isNext = !isCompleted && (i === 0 || process.phases?.find((p: { phase_code: string }) => p.phase_code === standardPhases[i - 1])?.is_completed);
                                                    return (
                                                        <div key={phaseCode} className="flex flex-col items-center gap-1 group/phase relative">
                                                            <div
                                                                className={`w-2 h-2 rounded-full transition-all duration-300 ${isCompleted
                                                                    ? 'bg-emerald-500'
                                                                    : isNext
                                                                        ? 'bg-blue-500 animate-pulse scale-125'
                                                                        : 'bg-slate-200 dark:bg-slate-700'
                                                                    }`}
                                                                title={phaseCode.replace(/_/g, ' ')}
                                                                aria-label={`Fase ${phaseCode.replace(/_/g, ' ')}: ${isCompleted ? 'completada' : 'pendiente'}`}
                                                            />
                                                            {i < standardPhases.length - 1 && (
                                                                <div className={`absolute top-1 left-3 w-[calc(100%+0.5rem)] h-[1px] -z-10 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800'}`} aria-hidden="true" />
                                                            )}
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                <Users className="w-8 h-8 text-slate-300 mb-2" aria-hidden="true" />
                                <p className="text-xs font-bold text-muted-foreground">Sin procesos activos</p>
                            </div>
                        )}
                        <div className="pt-2 text-center">
                            <Link
                                href="/contratacion"
                                className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                            >
                                Ver Todos
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Productivity Section */}
            <UserProductivitySection productivity={productivity} />

            {/* Inventory Summary Section */}
            <InventorySummarySection kpis={data.kpis} />

        </div>
    );
}
