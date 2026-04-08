'use client';

import { useState, useMemo } from 'react';
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    isSameMonth,
    isToday,
    startOfWeek,
    endOfWeek,
    addMonths,
    subMonths,
    isSameDay,
} from 'date-fns';
import { es } from 'date-fns/locale/es';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Task } from '../types';

interface CalendarViewProps {
    tasks: Task[];
    onEdit: (task: Task) => void;
}

const PRIORITY_STYLES: Record<string, { chip: string; dot: string }> = {
    Alta: {
        chip: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/50 hover:bg-red-200 dark:hover:bg-red-800/60',
        dot: 'bg-red-500',
    },
    Media: {
        chip: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50 hover:bg-amber-200 dark:hover:bg-amber-800/60',
        dot: 'bg-amber-500',
    },
    Baja: {
        chip: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 hover:bg-emerald-200 dark:hover:bg-emerald-800/60',
        dot: 'bg-emerald-500',
    },
};

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function getTasksForDay(tasks: Task[], day: Date): Task[] {
    return tasks.filter((task) => {
        if (!task.end_date) return false;
        const taskDate = new Date(task.end_date + 'T00:00:00');
        return isSameDay(taskDate, day);
    });
}

interface DayTaskChipsProps {
    dayTasks: Task[];
    onEdit: (task: Task) => void;
    maxVisible?: number;
}

function DayTaskChips({ dayTasks, onEdit, maxVisible = 3 }: DayTaskChipsProps) {
    const visible = dayTasks.slice(0, maxVisible);
    const overflow = dayTasks.length - maxVisible;

    return (
        <div className="flex flex-col gap-0.5 mt-1">
            {visible.map((task) => {
                const styles = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.Baja;
                return (
                    <button
                        key={task.id}
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(task);
                        }}
                        title={task.title}
                        className={`flex items-center gap-1 w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium leading-tight truncate transition-colors duration-150 cursor-pointer ${styles.chip}`}
                    >
                        <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${styles.dot}`} aria-hidden="true" />
                        <span className="truncate">{task.title}</span>
                    </button>
                );
            })}
            {overflow > 0 && (
                <span className="text-[10px] text-muted-foreground font-semibold pl-1.5">
                    +{overflow} más
                </span>
            )}
        </div>
    );
}

interface MobileListDayProps {
    day: Date;
    dayTasks: Task[];
    onEdit: (task: Task) => void;
}

function MobileListDay({ day, dayTasks, onEdit }: MobileListDayProps) {
    const today = isToday(day);

    return (
        <div className="border-b border-slate-100 dark:border-white/5 last:border-0 py-3">
            <div className="flex items-center gap-3 mb-2">
                <div
                    className={`w-9 h-9 rounded-full flex flex-col items-center justify-center shrink-0 ${
                        today
                            ? 'bg-primary text-white shadow-sm shadow-primary/40'
                            : 'bg-slate-100 dark:bg-white/5 text-foreground'
                    }`}
                >
                    <span className="text-[10px] font-bold leading-none uppercase">
                        {format(day, 'EEE', { locale: es })}
                    </span>
                    <span className="text-sm font-black leading-none">{format(day, 'd')}</span>
                </div>
                {dayTasks.length === 0 && (
                    <span className="text-xs text-muted-foreground">Sin tareas</span>
                )}
            </div>
            {dayTasks.length > 0 && (
                <div className="flex flex-col gap-1.5 pl-12">
                    {dayTasks.map((task) => {
                        const styles = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.Baja;
                        return (
                            <button
                                key={task.id}
                                type="button"
                                onClick={() => onEdit(task)}
                                className={`flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${styles.chip}`}
                            >
                                <span className={`shrink-0 w-2 h-2 rounded-full ${styles.dot}`} aria-hidden="true" />
                                <span className="truncate">{task.title}</span>
                                {task.project && (
                                    <span className="ml-auto shrink-0 text-[10px] opacity-70 truncate max-w-[80px]">
                                        {task.project.name}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function CalendarView({ tasks, onEdit }: CalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(() => new Date());

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: calStart, end: calEnd });
    }, [currentMonth]);

    const daysWithTasks = useMemo(() => {
        return calendarDays.filter((day) => isSameMonth(day, currentMonth) && getTasksForDay(tasks, day).length > 0);
    }, [calendarDays, currentMonth, tasks]);

    const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: es });
    const capitalizedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    return (
        <div className="card-premium animate-reveal">
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-white/5">
                <button
                    type="button"
                    onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                    aria-label="Mes anterior"
                    className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all duration-200"
                >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>

                <h2 className="text-base font-black tracking-tight text-foreground capitalize">
                    {capitalizedMonth}
                </h2>

                <button
                    type="button"
                    onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                    aria-label="Mes siguiente"
                    className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all duration-200"
                >
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
            </div>

            {/* Desktop grid */}
            <div className="hidden md:block p-4" role="grid" aria-label={`Calendario ${capitalizedMonth}`}>
                {/* Week day headers */}
                <div className="grid grid-cols-7 mb-1" role="row">
                    {WEEK_DAYS.map((day) => (
                        <div
                            key={day}
                            role="columnheader"
                            className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground py-2"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-white/5 rounded-xl overflow-hidden border border-slate-100 dark:border-white/5">
                    {calendarDays.map((day) => {
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const today = isToday(day);
                        const dayTasks = getTasksForDay(tasks, day);

                        return (
                            <div
                                key={day.toISOString()}
                                role="gridcell"
                                aria-label={format(day, 'EEEE d MMMM', { locale: es })}
                                className={`min-h-[96px] p-1.5 flex flex-col transition-colors duration-150 ${
                                    isCurrentMonth
                                        ? 'bg-white dark:bg-slate-900'
                                        : 'bg-slate-50/60 dark:bg-slate-900/40'
                                }`}
                            >
                                {/* Day number */}
                                <span
                                    className={`self-start w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-0.5 shrink-0 ${
                                        today
                                            ? 'bg-primary text-white shadow-sm shadow-primary/40'
                                            : isCurrentMonth
                                            ? 'text-foreground'
                                            : 'text-muted-foreground/40'
                                    }`}
                                    aria-current={today ? 'date' : undefined}
                                >
                                    {format(day, 'd')}
                                </span>

                                {/* Task chips */}
                                {isCurrentMonth && dayTasks.length > 0 && (
                                    <DayTaskChips
                                        dayTasks={dayTasks}
                                        onEdit={onEdit}
                                        maxVisible={3}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mobile list view */}
            <div className="block md:hidden px-4 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-3 pt-2">
                    Dias con tareas este mes
                </p>
                {daysWithTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Sin tareas con fecha de vencimiento este mes.
                    </p>
                ) : (
                    <div>
                        {daysWithTasks.map((day) => (
                            <MobileListDay
                                key={day.toISOString()}
                                day={day}
                                dayTasks={getTasksForDay(tasks, day)}
                                onEdit={onEdit}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 px-4 pb-4 pt-2 flex-wrap">
                {Object.entries(PRIORITY_STYLES).map(([priority, styles]) => (
                    <div key={priority} className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${styles.dot}`} aria-hidden="true" />
                        <span className="text-[10px] font-semibold text-muted-foreground">
                            Prioridad {priority}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
