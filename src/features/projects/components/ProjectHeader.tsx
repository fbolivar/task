'use client';

import {
    Search,
    Plus,
    SortDesc,
    Building2,
    Download,
} from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';

interface EntityOption {
    id: string;
    name: string;
}

interface ProjectHeaderProps {
    onSearch: (query: string) => void;
    onNewProject: () => void;
    onStatusFilter: (status: string) => void;
    onSort: () => void;
    totalProjects: number;
    currentStatus?: string;
    entities?: EntityOption[];
    currentEntity?: string;
    onEntityFilter?: (entityId: string) => void;
    onExport?: () => void;
}

export function ProjectHeader({
    onSearch,
    onNewProject,
    onStatusFilter,
    onSort,
    totalProjects,
    currentStatus = 'all',
    entities = [],
    currentEntity = 'all',
    onEntityFilter,
    onExport,
}: ProjectHeaderProps) {
    const { t } = useSettings();

    return (
        <div className="flex flex-col gap-8 mb-10 animate-reveal">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight flex items-center gap-4">
                        {t('projects.title')}
                        <span className="text-[10px] py-1.5 px-4 bg-primary/10 text-primary rounded-full font-black uppercase tracking-widest shadow-sm">
                            {totalProjects} {t('general.active')}
                        </span>
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium text-sm">{t('projects.desc')}</p>
                </div>

                <div className="flex items-center gap-3">
                    {onExport && (
                        <button
                            type="button"
                            onClick={onExport}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm font-bold text-muted-foreground hover:text-foreground hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-sm"
                            aria-label="Exportar proyectos a CSV"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Exportar</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onNewProject}
                        className="btn-primary"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        <span className="font-bold tracking-wide">{t('projects.new')}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-5 relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110" />
                    <input
                        type="text"
                        placeholder={t('projects.searchPlaceholder')}
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all text-sm font-semibold outline-none shadow-sm hover:border-slate-300 dark:hover:border-white/10"
                    />
                </div>

                {entities.length > 0 && onEntityFilter && (
                    <div className="md:col-span-3 relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <select
                            value={currentEntity}
                            onChange={(e) => onEntityFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all text-sm font-semibold outline-none shadow-sm hover:border-slate-300 dark:hover:border-white/10 appearance-none cursor-pointer"
                            aria-label="Filtrar por entidad"
                        >
                            <option value="all">Todas las entidades</option>
                            {entities.map((entity) => (
                                <option key={entity.id} value={entity.id}>{entity.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className={`${entities.length > 0 && onEntityFilter ? 'md:col-span-4' : 'md:col-span-7'} flex items-center gap-2 p-1.5 bg-slate-100/30 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/5 overflow-x-auto no-scrollbar`}>
                    {['all', 'Activo', 'Pausado', 'Completado', 'Bajo Revisión'].map((status) => (
                        <button
                            type="button"
                            key={status}
                            onClick={() => onStatusFilter(status)}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${status === currentStatus
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5'
                                }`}
                        >
                            {status === 'all' ? t('general.all') : status === 'Activo' ? t('general.active') : status === 'Completado' ? t('general.completed') : status}
                        </button>
                    ))}
                    <div className="h-8 w-px bg-slate-200/50 dark:bg-white/10 mx-1 shrink-0" />
                    <button
                        type="button"
                        onClick={onSort}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-muted-foreground hover:text-primary transition-all shadow-sm"
                        aria-label="Ordenar proyectos"
                    >
                        <SortDesc className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
