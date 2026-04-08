'use client';

import { Search, Plus, Filter, Package, Laptop, Car, Smartphone, Sofa, Download } from 'lucide-react';
import { AssetCategory, AssetStatus } from '../types';
import { useSettings } from '@/shared/contexts/SettingsContext';

interface AssetHeaderProps {
    onSearch: (term: string) => void;
    onNewAsset: () => void;
    categoryFilter: AssetCategory | 'All';
    onCategoryChange: (category: AssetCategory | 'All') => void;
    statusFilter: string;
    onStatusChange: (s: string) => void;
    onExport?: () => void;
}

interface StatusPill {
    label: string;
    value: string;
    activeClass: string;
}

const STATUS_PILLS: StatusPill[] = [
    { label: 'Todos', value: 'All', activeClass: 'bg-slate-700 text-white shadow-lg shadow-slate-700/30' },
    { label: 'Disponible', value: 'Disponible', activeClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' },
    { label: 'Asignado', value: 'Asignado', activeClass: 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' },
    { label: 'Mantenimiento', value: 'Mantenimiento', activeClass: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' },
    { label: 'Baja', value: 'Baja', activeClass: 'bg-red-600 text-white shadow-lg shadow-red-600/30' },
];

export function AssetHeader({
    onSearch,
    onNewAsset,
    categoryFilter,
    onCategoryChange,
    statusFilter,
    onStatusChange,
    onExport,
}: AssetHeaderProps) {
    const { t } = useSettings();

    const categories: { label: string; value: AssetCategory | 'All'; icon: any }[] = [
        { label: t('general.all'), value: 'All', icon: Package },
        { label: t('inventory.cat.hardware'), value: 'Hardware', icon: Laptop },
        { label: t('inventory.cat.software'), value: 'Software', icon: Smartphone },
        { label: t('inventory.cat.vehicle'), value: 'Vehículo', icon: Car },
        { label: t('inventory.cat.furniture'), value: 'Mobiliario', icon: Sofa },
    ];

    return (
        <div className="flex flex-col gap-6 mb-10 animate-reveal">
            {/* Title row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5 group">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full transition-all group-hover:scale-150 duration-700" />
                        <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white shadow-2xl shadow-primary/30 group-hover:rotate-6 transition-transform duration-500">
                            <Package className="w-8 h-8" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight leading-none">{t('inventory.subtitle')}</h1>
                        <p className="text-muted-foreground font-medium text-sm mt-2">{t('inventory.subdesc')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {onExport && (
                        <button
                            type="button"
                            onClick={onExport}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-wider shadow-sm"
                            aria-label="Exportar inventario como CSV"
                        >
                            <Download className="w-4 h-4" />
                            Exportar CSV
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onNewAsset}
                        className="btn-primary"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        <span className="font-bold tracking-wide">{t('inventory.new')}</span>
                    </button>
                </div>
            </div>

            {/* Search + Category filters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-6 relative flex-1 group w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110" />
                    <input
                        type="text"
                        placeholder={t('inventory.searchPlaceholder')}
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all text-sm font-semibold outline-none shadow-sm hover:border-slate-300 dark:hover:border-white/10"
                    />
                </div>

                <div className="lg:col-span-6 flex items-center gap-2 p-1.5 bg-slate-100/30 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/5 overflow-x-auto no-scrollbar">
                    <div className="hidden sm:flex p-1 px-4 items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 border-r border-slate-200/50 dark:border-white/10 mr-1 shrink-0">
                        <Filter className="w-3 h-3" /> Categorías
                    </div>
                    {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = categoryFilter === cat.value;
                        return (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => onCategoryChange(cat.value)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${isActive
                                    ? 'bg-primary shadow-lg shadow-primary/30 text-white translate-y-[-1px]'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5'
                                    }`}
                                aria-pressed={isActive ? 'true' : 'false'}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Status filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 shrink-0">
                    <Filter className="w-3 h-3" /> Estado:
                </div>
                {STATUS_PILLS.map((pill) => {
                    const isActive = statusFilter === pill.value;
                    return (
                        <button
                            key={pill.value}
                            type="button"
                            onClick={() => onStatusChange(pill.value)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 border ${
                                isActive
                                    ? `${pill.activeClass} border-transparent translate-y-[-1px]`
                                    : 'border-slate-200 dark:border-white/10 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5'
                            }`}
                            aria-pressed={isActive ? 'true' : 'false'}
                        >
                            {pill.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
