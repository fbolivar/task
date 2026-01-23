'use client';

import { Search, Plus, Filter, Package, Laptop, Car, Smartphone, Sofa } from 'lucide-react';
import { AssetCategory } from '../types';

interface AssetHeaderProps {
    onSearch: (term: string) => void;
    onNewAsset: () => void;
    categoryFilter: AssetCategory | 'All';
    onCategoryChange: (category: AssetCategory | 'All') => void;
}

export function AssetHeader({ onSearch, onNewAsset, categoryFilter, onCategoryChange }: AssetHeaderProps) {
    const categories: { label: string; value: AssetCategory | 'All'; icon: any }[] = [
        { label: 'Todos', value: 'All', icon: Package },
        { label: 'Hardware', value: 'Hardware', icon: Laptop },
        { label: 'Software', value: 'Software', icon: Smartphone },
        { label: 'Vehículos', value: 'Vehículo', icon: Car },
        { label: 'Mobiliario', value: 'Mobiliario', icon: Sofa },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground mb-2 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-2xl text-primary">
                            <Package className="w-8 h-8" />
                        </div>
                        Control de Activos
                    </h1>
                    <p className="text-muted-foreground font-medium">Gestión estratégica de recursos físicos y digitales.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o serial..."
                            onChange={(e) => onSearch(e.target.value)}
                            className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium w-full md:w-[300px]"
                        />
                    </div>
                    <button
                        onClick={onNewAsset}
                        className="btn-primary flex items-center gap-2 px-6 py-2.5"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="font-bold">Nuevo Activo</span>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <div className="p-1 px-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-r border-slate-200 dark:border-slate-800 mr-2">
                    <Filter className="w-3 h-3" /> Categoría
                </div>
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = categoryFilter === cat.value;
                    return (
                        <button
                            key={cat.value}
                            onClick={() => onCategoryChange(cat.value)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${isActive
                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                                    : 'bg-white dark:bg-slate-900 text-muted-foreground border-slate-200 dark:border-slate-800 hover:border-primary/50'
                                }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {cat.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
