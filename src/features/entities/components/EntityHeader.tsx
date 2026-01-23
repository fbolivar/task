'use client';

import { Building2, Plus, Search } from 'lucide-react';

interface EntityHeaderProps {
    onSearch: (term: string) => void;
    onNewEntity: () => void;
    filterType: string;
    onFilterChange: (type: any) => void;
}

export function EntityHeader({ onSearch, onNewEntity, filterType, onFilterChange }: EntityHeaderProps) {
    return (
        <div className="flex flex-col gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-xl shadow-primary/20">
                        <Building2 className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Ecosistema de Entidades</h1>
                        <p className="text-muted-foreground font-medium">Gestión estratégica de clientes, prospectos y aliados corporativos.</p>
                    </div>
                </div>
                <button
                    onClick={onNewEntity}
                    className="btn-primary flex items-center gap-2 group hover:scale-[1.02] active:scale-[0.98] transition-all px-6 py-3 shadow-xl shadow-primary/20"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    <span className="font-bold">Nueva Entidad</span>
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, correo o contacto clave..."
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium outline-none"
                    />
                </div>

                <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 w-full md:w-auto">
                    {['All', 'Prospecto', 'Cliente', 'Partner'].map((type) => (
                        <button
                            key={type}
                            onClick={() => onFilterChange(type)}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${filterType === type
                                    ? 'bg-white dark:bg-slate-800 shadow-sm text-primary border border-slate-200 dark:border-slate-700'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {type === 'All' ? 'Todos' : type}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
