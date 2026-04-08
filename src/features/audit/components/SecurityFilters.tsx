'use client';

import { Shield, AlertTriangle } from 'lucide-react';

interface SecurityFiltersProps {
    filterEventType: string;
    filterSeverity: string;
    dateFrom: string;
    dateTo: string;
    onFilterEventTypeChange: (value: string) => void;
    onFilterSeverityChange: (value: string) => void;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
    onClearFilters: () => void;
}

export function SecurityFilters({
    filterEventType,
    filterSeverity,
    dateFrom,
    dateTo,
    onFilterEventTypeChange,
    onFilterSeverityChange,
    onDateFromChange,
    onDateToChange,
    onClearFilters,
}: SecurityFiltersProps) {
    const hasActiveFilters = filterEventType || filterSeverity || dateFrom || dateTo;

    return (
        <div className="glass-card p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Event Type Filter */}
                <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                        value={filterEventType}
                        onChange={(e) => onFilterEventTypeChange(e.target.value)}
                        className="input-premium pl-10 w-full appearance-none"
                    >
                        <option value="">Todos los eventos</option>
                        <option value="login_success">Login Exitoso</option>
                        <option value="login_failed">Login Fallido</option>
                        <option value="logout">Logout</option>
                        <option value="password_change">Cambio Contraseña</option>
                        <option value="api_access">Acceso API</option>
                        <option value="session_expired">Sesión Expirada</option>
                    </select>
                </div>

                {/* Severity Filter */}
                <div className="relative">
                    <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                        value={filterSeverity}
                        onChange={(e) => onFilterSeverityChange(e.target.value)}
                        className="input-premium pl-10 w-full appearance-none"
                    >
                        <option value="">Todas las severidades</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="critical">Critical</option>
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

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <button onClick={onClearFilters} className="btn-secondary text-xs">
                        Limpiar filtros
                    </button>
                )}
            </div>
        </div>
    );
}
