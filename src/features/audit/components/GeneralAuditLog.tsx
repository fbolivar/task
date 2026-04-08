'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RefreshCw, Download } from 'lucide-react';
import { format } from 'date-fns';
import { AuditLog } from './types';
import { GeneralFilters } from './GeneralFilters';
import { GeneralLogList } from './GeneralLogList';
import { AuditPagination } from './AuditPagination';

const ITEMS_PER_PAGE = 20;

export function GeneralAuditLog() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAction, setFilterAction] = useState<string>('');
    const [filterEntity, setFilterEntity] = useState<string>('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const supabase = createClient();

    useEffect(() => {
        fetchLogs();
    }, [page, filterAction, filterEntity, dateFrom, dateTo]);

    const fetchLogs = async () => {
        setLoading(true);

        let query = supabase
            .from('activity_logs')
            .select(`
                *,
                user:profiles!activity_logs_user_id_fkey(full_name, email)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

        if (filterAction) query = query.eq('action', filterAction);
        if (filterEntity) query = query.eq('entity_type', filterEntity);
        if (dateFrom) query = query.gte('created_at', new Date(dateFrom).toISOString());
        if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59);
            query = query.lte('created_at', endDate.toISOString());
        }

        const { data, count } = await query;
        if (data) {
            setLogs(data);
            setTotalCount(count || 0);
        }
        setLoading(false);
    };

    const filteredLogs = logs.filter(log => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            log.description?.toLowerCase().includes(q) ||
            log.user?.full_name?.toLowerCase().includes(q) ||
            log.entity_type?.toLowerCase().includes(q) ||
            log.action?.toLowerCase().includes(q)
        );
    });

    const handleFilterActionChange = (value: string) => {
        setFilterAction(value);
        setPage(0);
    };

    const handleFilterEntityChange = (value: string) => {
        setFilterEntity(value);
        setPage(0);
    };

    const handleDateFromChange = (value: string) => {
        setDateFrom(value);
        setPage(0);
    };

    const handleDateToChange = (value: string) => {
        setDateTo(value);
        setPage(0);
    };

    const exportToCSV = () => {
        const headers = ['Fecha', 'Usuario', 'Acción', 'Entidad', 'Descripción'];
        const rows = filteredLogs.map(log => [
            format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
            log.user?.full_name || 'Sistema',
            log.action,
            log.entity_type,
            log.description
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit_log_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const hasActiveFilters = filterAction || filterEntity || dateFrom || dateTo;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-foreground">Log de Actividades</h2>
                    <p className="text-muted-foreground text-sm font-medium">
                        Registro completo de actividades del sistema
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchLogs} className="btn-secondary flex items-center gap-2 text-sm">
                        <RefreshCw className="w-4 h-4" />
                        Actualizar
                    </button>
                    <button onClick={exportToCSV} className="btn-primary flex items-center gap-2 text-sm">
                        <Download className="w-4 h-4" />
                        Exportar CSV
                    </button>
                </div>
            </div>

            <GeneralFilters
                searchQuery={searchQuery}
                filterAction={filterAction}
                filterEntity={filterEntity}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onSearchQueryChange={setSearchQuery}
                onFilterActionChange={handleFilterActionChange}
                onFilterEntityChange={handleFilterEntityChange}
                onDateFromChange={handleDateFromChange}
                onDateToChange={handleDateToChange}
            />

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="font-bold">{totalCount.toLocaleString()} registros</span>
                {hasActiveFilters && (
                    <button
                        onClick={() => {
                            setFilterAction('');
                            setFilterEntity('');
                            setDateFrom('');
                            setDateTo('');
                            setPage(0);
                        }}
                        className="text-primary hover:underline text-xs"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            <GeneralLogList logs={filteredLogs} loading={loading} />

            <AuditPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
    );
}
