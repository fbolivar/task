'use client';

import {
    differenceInDays,
    addWeeks,
    addDays,
    format,
    eachWeekOfInterval,
    startOfWeek,
    parseISO,
    isToday,
    isBefore,
    isAfter,
    startOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GanttTask {
    id: string;
    title: string;
    start_date?: string | null;
    end_date?: string | null;
    status: string;
    assignee?: { full_name: string } | null;
}

export interface GanttChartProps {
    tasks: GanttTask[];
    projectStartDate?: string;
    projectEndDate?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_BAR: Record<string, string> = {
    'Pendiente':   'bg-slate-400 dark:bg-slate-500',
    'En Progreso': 'bg-blue-500 dark:bg-blue-400',
    'Revisión':    'bg-amber-500 dark:bg-amber-400',
    'Completado':  'bg-emerald-500 dark:bg-emerald-400',
};

const STATUS_LABEL: Record<string, string> = {
    'Pendiente':   'text-slate-600 dark:text-slate-400',
    'En Progreso': 'text-blue-700 dark:text-blue-400',
    'Revisión':    'text-amber-700 dark:text-amber-400',
    'Completado':  'text-emerald-700 dark:text-emerald-400',
};

const LABEL_COL_WIDTH = 200; // px

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDateSafe(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    try {
        return parseISO(dateStr);
    } catch {
        return null;
    }
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GanttChart({ tasks, projectStartDate, projectEndDate }: GanttChartProps) {
    if (tasks.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                <p className="text-sm text-muted-foreground">Sin tareas para mostrar en el diagrama.</p>
            </div>
        );
    }

    const today = startOfDay(new Date());

    // Resolve task dates, filling missing values with defaults
    const projStart = parseDateSafe(projectStartDate);
    const projEnd   = parseDateSafe(projectEndDate);

    const resolvedTasks = tasks.map((task) => {
        const rawStart = parseDateSafe(task.start_date);
        const rawEnd   = parseDateSafe(task.end_date);

        const start = rawStart ?? projStart ?? today;
        const end   = rawEnd   ?? (rawStart ? addWeeks(start, 1) : addWeeks(projStart ?? today, 1));

        return { ...task, resolvedStart: start, resolvedEnd: end };
    });

    // Calculate chart date range (min start → max end, padded by a few days)
    const allStarts = resolvedTasks.map((t) => t.resolvedStart);
    const allEnds   = resolvedTasks.map((t) => t.resolvedEnd);

    const chartStart = startOfWeek(
        allStarts.reduce((min, d) => (isBefore(d, min) ? d : min), allStarts[0]),
        { locale: es }
    );
    const chartEnd = addDays(
        allEnds.reduce((max, d) => (isAfter(d, max) ? d : max), allEnds[0]),
        7 // pad
    );

    const totalDays = differenceInDays(chartEnd, chartStart);
    if (totalDays <= 0) return null;

    // Build week columns
    const weekStarts = eachWeekOfInterval(
        { start: chartStart, end: chartEnd },
        { locale: es }
    );

    // Today offset percentage
    const todayOffset = clamp(differenceInDays(today, chartStart) / totalDays, 0, 1) * 100;
    const showTodayMarker = isAfter(today, chartStart) && isBefore(today, chartEnd);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">

            {/* Legend */}
            <div className="flex flex-wrap gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {Object.entries(STATUS_BAR).map(([status, barClass]) => (
                    <div key={status} className="flex items-center gap-1.5">
                        <span className={`inline-block w-3 h-3 rounded-sm ${barClass}`} />
                        <span className="text-xs text-muted-foreground">{status}</span>
                    </div>
                ))}
                {showTodayMarker && (
                    <div className="flex items-center gap-1.5 ml-auto">
                        <span className="inline-block w-0.5 h-3 bg-red-500" />
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">Hoy</span>
                    </div>
                )}
            </div>

            {/* Scrollable chart area */}
            <div className="flex" style={{ minHeight: '60px' }}>

                {/* Fixed label column */}
                <div
                    className="flex-shrink-0 border-r border-slate-200 dark:border-slate-700"
                    style={{ width: `${LABEL_COL_WIDTH}px` }}
                >
                    {/* Header spacer */}
                    <div className="h-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50" />

                    {/* Task labels */}
                    {resolvedTasks.map((task, i) => (
                        <div
                            key={task.id}
                            className={`flex flex-col justify-center px-3 h-12 border-b border-slate-100 dark:border-slate-800 ${
                                i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/20'
                            }`}
                        >
                            <span
                                className="text-xs font-medium text-foreground truncate leading-tight"
                                title={task.title}
                            >
                                {task.title}
                            </span>
                            {task.assignee && (
                                <span className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                                    {task.assignee.full_name}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Scrollable timeline */}
                <div className="flex-1 overflow-x-auto">
                    <div style={{ minWidth: `${weekStarts.length * 80}px` }} className="relative">

                        {/* Week header row */}
                        <div className="flex h-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                            {weekStarts.map((weekStart, i) => (
                                <div
                                    key={i}
                                    className="flex-shrink-0 flex items-center justify-center px-1 border-r border-slate-100 dark:border-slate-800"
                                    style={{ width: '80px' }}
                                >
                                    <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                                        {format(weekStart, 'd MMM', { locale: es })}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Task rows with bars */}
                        {resolvedTasks.map((task, i) => {
                            const barStart = clamp(
                                differenceInDays(task.resolvedStart, chartStart) / totalDays,
                                0, 1
                            );
                            const barEnd = clamp(
                                differenceInDays(task.resolvedEnd, chartStart) / totalDays,
                                0, 1
                            );
                            const barWidth  = Math.max(barEnd - barStart, 0.005); // min visible width
                            const barClass  = STATUS_BAR[task.status] ?? 'bg-slate-400';

                            return (
                                <div
                                    key={task.id}
                                    className={`relative flex items-center h-12 border-b border-slate-100 dark:border-slate-800 ${
                                        i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/20'
                                    }`}
                                >
                                    {/* Column grid lines */}
                                    {weekStarts.map((_, wi) => (
                                        <div
                                            key={wi}
                                            className="absolute top-0 bottom-0 border-r border-slate-100 dark:border-slate-800/60"
                                            style={{ left: `${(wi / weekStarts.length) * 100}%`, width: '80px' }}
                                        />
                                    ))}

                                    {/* Today marker */}
                                    {showTodayMarker && (
                                        <div
                                            className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
                                            style={{ left: `${todayOffset}%` }}
                                            aria-hidden="true"
                                        >
                                            <span className="absolute -top-0 left-1 text-[9px] text-red-500 font-bold leading-none">
                                                ▼
                                            </span>
                                        </div>
                                    )}

                                    {/* Task bar */}
                                    <div
                                        className={`absolute h-6 rounded ${barClass} opacity-90 hover:opacity-100 transition-opacity cursor-default flex items-center px-2 overflow-hidden group`}
                                        style={{
                                            left:  `${barStart * 100}%`,
                                            width: `${barWidth * 100}%`,
                                        }}
                                        title={`${task.title} — ${task.status}`}
                                        aria-label={`${task.title}: ${task.status}`}
                                    >
                                        <span className={`text-[10px] font-semibold text-white truncate leading-none select-none`}>
                                            {task.title}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Status summary footer */}
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>
                    {format(chartStart, 'd MMM yyyy', { locale: es })}
                    {' — '}
                    {format(chartEnd, 'd MMM yyyy', { locale: es })}
                </span>
                <span className="ml-auto">{tasks.length} tarea{tasks.length !== 1 ? 's' : ''}</span>
            </div>
        </div>
    );
}
