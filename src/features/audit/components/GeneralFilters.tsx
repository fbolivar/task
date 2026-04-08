'use client';

import { Search, Filter, Package } from 'lucide-react';

interface GeneralFiltersProps {
    searchQuery: string;
    filterAction: string;
    filterEntity: string;
    dateFrom: string;
    dateTo: string;
    onSearchQueryChange: (value: string) => void;
    onFilterActionChange: (value: string) => void;
    onFilterEntityChange: (value: string) => void;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
}

export function GeneralFilters({
    searchQuery,
    filterAction,
    filterEntity,
    dateFrom,
    dateTo,
    onSearchQueryChange,
    onFilterActionChange,
    onFilterEntityChange,
    onDateFromChange,
    onDateToChange,
}: GeneralFiltersProps) {
    return (
        <div className="glass-card p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="lg:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar en descripción, usuario..."
                        value={searchQuery}
                        onChange={(e) => onSearchQueryChange(e.target.value)}
                        className="input-premium pl-10 w-full"
                    />
                </div>

                {/* Action Filter */}
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                        value={filterAction}
                        onChange={(e) => onFilterActionChange(e.target.value)}
                        className="input-premium pl-10 w-full appearance-none"
                    >
                        <option value="">Todas las acciones</option>
                        <option value="create">Crear</option>
                        <option value="update">Actualizar</option>
                        <option value="delete">Eliminar</option>
                        <option value="view">Ver</option>
                        <option value="login">Login</option>
                        <option value="logout">Logout</option>
                        <option value="approve">Aprobar</option>
                        <option value="reject">Rechazar</option>
                    </select>
                </div>

                {/* Entity Filter */}
                <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                        value={filterEntity}
                        onChange={(e) => onFilterEntityChange(e.target.value)}
                        className="input-premium pl-10 w-full appearance-none"
                    >
                        <option value="">Todas las entidades</option>
                        <option value="task">Tareas</option>
                        <option value="project">Proyectos</option>
                        <option value="asset">Activos</option>
                        <option value="user">Usuarios</option>
                        <option value="change_request">Cambios</option>
                        <option value="entity">Entidades</option>
                    </select>
                </div>

                {/* Date Range */}
                <div className="flex gap-2">
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => onDateFromChange(e.target.value)}
                        className="input-premium w-full text-xs"
                    />
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => onDateToChange(e.target.value)}
                        className="input-premium w-full text-xs"
                    />
                </div>
            </div>
        </div>
    );
}
