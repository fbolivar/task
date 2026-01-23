'use client';

import {
    Search,
    Plus,
    Filter,
    CheckSquare,
    SortAsc
} from 'lucide-react';

interface TaskHeaderProps {
    onSearch: (query: string) => void;
    onNewTask: () => void;
    onStatusFilter: (status: string) => void;
    totalTasks: number;
}

export function TaskHeader({ onSearch, onNewTask, onStatusFilter, totalTasks }: TaskHeaderProps) {
    return (
        <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                        Tablero de Tareas
                        <span className="text-xs py-1 px-3 bg-primary/10 text-primary rounded-full font-bold">
                            {totalTasks} Total
                        </span>
                    </h1>
                    <p className="text-muted-foreground mt-1">Sigue el cumplimiento y la carga operativa diaria.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onNewTask}
                        className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nueva Tarea</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-8 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por título, descripción o responsable..."
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                    />
                </div>

                <div className="md:col-span-4 flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                    <button
                        onClick={() => onStatusFilter('all')}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all whitespace-nowrap"
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => onStatusFilter('Pendiente')}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all whitespace-nowrap"
                    >
                        Pendientes
                    </button>
                    <button
                        onClick={() => onStatusFilter('En Progreso')}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all whitespace-nowrap"
                    >
                        En Marcha
                    </button>
                    <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />
                    <button className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                        <SortAsc className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
