'use client';

import { useState } from 'react';
import {
    Search,
    Plus,
    SortAsc,
    Briefcase,
    ChevronDown,
    Download,
    Filter
} from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';

const SUB_STATUS_OPTIONS = ['all', 'En Tiempo', 'En Riesgo', 'Demorado', 'Bloqueado'] as const;
type SubStatusOption = typeof SUB_STATUS_OPTIONS[number];

interface TaskHeaderProps {
    onSearch: (query: string) => void;
    onNewTask: () => void;
    onStatusFilter: (status: string) => void;
    onSort: () => void;
    onPriorityFilter: (priority: string) => void;
    totalTasks: number;
    currentStatus?: string;
    currentPriority?: string;
    projects?: { id: string; name: string }[];
    onProjectFilter?: (id: string) => void;
    onSubStatusFilter?: (s: string) => void;
    currentProject?: string;
    currentSubStatus?: string;
    onExport?: () => void;
}

const SUB_STATUS_STYLES: Record<SubStatusOption, string> = {
    all: 'bg-primary text-white shadow-primary/30',
    'En Tiempo': 'bg-emerald-500 text-white shadow-emerald-500/30',
    'En Riesgo': 'bg-amber-500 text-white shadow-amber-500/30',
    Demorado: 'bg-orange-500 text-white shadow-orange-500/30',
    Bloqueado: 'bg-red-500 text-white shadow-red-500/30',
};

export function TaskHeader({
    onSearch,
    onNewTask,
    onStatusFilter,
    onSort,
    onPriorityFilter,
    totalTasks,
    currentStatus = 'all',
    currentPriority = 'all',
    projects = [],
    onProjectFilter,
    onSubStatusFilter,
    currentProject = 'all',
    currentSubStatus = 'all',
    onExport,
}: TaskHeaderProps) {
    const { t } = useSettings();
    const [showAdvanced, setShowAdvanced] = useState(false);

    const hasActiveAdvanced =
        currentProject !== 'all' || currentSubStatus !== 'all';

    return (
        <div className="flex flex-col gap-8 mb-10 animate-reveal">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight flex items-center gap-4">
                        {t('tasks.board')}
                        <span className="text-[10px] py-1.5 px-4 bg-primary/10 text-primary rounded-full font-black uppercase tracking-widest shadow-sm">
                            {totalTasks} {t('tasks.total')}
                        </span>
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium text-sm">{t('tasks.desc')}</p>
                </div>

                <div className="flex items-center gap-3">
                    {onExport && (
                        <button
                            type="button"
                            onClick={onExport}
                            title="Exportar CSV"
                            aria-label="Exportar tareas a CSV"
                            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-200"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onNewTask}
                        className="btn-primary"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        <span className="font-bold tracking-wide">{t('tasks.new')}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-8 relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110" />
                    <input
                        type="text"
                        placeholder={t('tasks.searchPlaceholder')}
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all text-sm font-semibold outline-none shadow-sm hover:border-slate-300 dark:hover:border-white/10"
                    />
                </div>

                <div className="md:col-span-4 flex items-center gap-2 p-1.5 bg-slate-100/30 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/5 overflow-x-auto no-scrollbar">
                    {['all', 'Pendiente', 'En Progreso', 'Revisión', 'Completado'].map((status) => (
                        <button
                            type="button"
                            key={status}
                            onClick={() => onStatusFilter(status)}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-300 ${status === currentStatus
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5'
                                }`}
                        >
                            {status === 'all' ? t('general.all') :
                                status === 'Pendiente' ? t('tasks.pending') :
                                    status === 'En Progreso' ? t('tasks.inProgress') :
                                        status === 'Revisión' ? t('tasks.review') :
                                            t('tasks.completed')}
                        </button>
                    ))}
                    <div className="h-8 w-px bg-slate-200/50 dark:bg-white/10 mx-1 shrink-0" />
                    <button
                        type="button"
                        onClick={onSort}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-muted-foreground hover:text-primary transition-all shadow-sm"
                        title="Ordenar por fecha"
                        aria-label="Ordenar por fecha"
                    >
                        <SortAsc className="w-5 h-5" />
                    </button>
                </div>

                {/* Advanced filters toggle */}
                {(onProjectFilter || onSubStatusFilter) && (
                    <div className="md:col-span-8 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            aria-expanded={showAdvanced ? ('true' as const) : ('false' as const)}
                            aria-controls="advanced-filters"
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
                                showAdvanced || hasActiveAdvanced
                                    ? 'bg-primary/10 text-primary border-primary/30'
                                    : 'bg-white dark:bg-slate-900 text-muted-foreground border-slate-200 dark:border-white/10 hover:border-primary/40 hover:text-primary'
                            }`}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            Filtros
                            {hasActiveAdvanced && (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                            )}
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                )}
            </div>

            {/* Advanced filters row */}
            {showAdvanced && (onProjectFilter || onSubStatusFilter) && (
                <div
                    id="advanced-filters"
                    className="flex flex-wrap items-center gap-4 px-4 py-3 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-200 dark:border-white/5 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    {/* Project dropdown */}
                    {onProjectFilter && projects.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <label htmlFor="project-filter" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground shrink-0">
                                Proyecto
                            </label>
                            <select
                                id="project-filter"
                                value={currentProject}
                                onChange={(e) => onProjectFilter(e.target.value)}
                                className="text-[10px] font-black uppercase tracking-wider bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-foreground focus:outline-none focus:border-primary transition-all"
                            >
                                <option value="all">Todos</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Sub-status pills */}
                    {onSubStatusFilter && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground shrink-0">
                                Sub-estado
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {SUB_STATUS_OPTIONS.map((s) => (
                                    <button
                                        type="button"
                                        key={s}
                                        onClick={() => onSubStatusFilter(s)}
                                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 shadow-sm ${
                                            currentSubStatus === s
                                                ? SUB_STATUS_STYLES[s]
                                                : 'bg-white dark:bg-slate-900 text-muted-foreground border border-slate-200 dark:border-white/10 hover:border-primary/40 hover:text-primary'
                                        }`}
                                    >
                                        {s === 'all' ? 'Todos' : s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
